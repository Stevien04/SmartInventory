import couchbase from 'couchbase';
import { getCluster, getCollection, getScope } from '../config/couchbase.js';

/**
 * Almacén sobre Couchbase Capella.
 * - Lecturas y escrituras por clave (KV): rápidas, no necesitan índices.
 * - Listados con SQL++ (el lenguaje de consultas de Couchbase, parecido a SQL).
 * - Transacciones ACID multi-documento para los movimientos de stock.
 */
const NOMBRE_VALIDO = /^[A-Za-z][A-Za-z0-9_]*$/;

function validarNombre(nombre) {
  if (!NOMBRE_VALIDO.test(nombre)) throw new Error(`Nombre de campo no permitido: ${nombre}`);
  return nombre;
}

export async function obtener(coleccion, id) {
  try {
    const resultado = await getCollection(coleccion).get(id);
    return resultado.content;
  } catch (error) {
    if (error instanceof couchbase.DocumentNotFoundError) return null;
    throw error;
  }
}

/**
 * Construye una consulta SQL++ parametrizada, por ejemplo:
 *   SELECT d.* FROM `productos` AS d WHERE d.`estado` = $estado ORDER BY d.`nombre` ASC
 * Los valores van como parámetros ($estado), nunca concatenados en el texto.
 */
export function construirConsulta(coleccion, { filtro = {}, orden, limite } = {}) {
  let sql = `SELECT d.* FROM \`${validarNombre(coleccion)}\` AS d`;
  const campos = Object.keys(filtro).map(validarNombre);
  if (campos.length) {
    sql += ' WHERE ' + campos.map((c) => `d.\`${c}\` = $${c}`).join(' AND ');
  }
  if (orden) {
    const direccion = orden.direccion === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY d.\`${validarNombre(orden.campo)}\` ${direccion}`;
  }
  if (limite) sql += ` LIMIT ${Number.parseInt(limite, 10)}`;
  return { sql, parametros: { ...filtro } };
}

export async function consultar(sql, parametros = {}) {
  const resultado = await getScope().query(sql, {
    parameters: parametros,
    // RequestPlus: la consulta ve las escrituras recién hechas (lectura consistente).
    scanConsistency: couchbase.QueryScanConsistency.RequestPlus
  });
  return resultado.rows;
}

export async function listar(coleccion, opciones = {}) {
  const { sql, parametros } = construirConsulta(coleccion, opciones);
  return consultar(sql, parametros);
}

export async function insertar(coleccion, doc) {
  await getCollection(coleccion).insert(doc.id, doc);
  return doc;
}

export async function reemplazar(coleccion, doc) {
  await getCollection(coleccion).replace(doc.id, doc);
  return doc;
}

/**
 * Transacción ACID de Couchbase: o se aplican todas las escrituras o ninguna.
 * Si la función lanza un error de negocio, la transacción se revierte y se
 * relanza ese mismo error (no el envoltorio TransactionFailedError).
 */
export async function transaccion(fn, intentos = 5) {
  for (let intento = 1; ; intento++) {
    try {
      return await ejecutarTransaccion(fn);
    } catch (error) {
      // Los errores de negocio (con status HTTP) no se reintentan.
      // Un conflicto de concurrencia (otro proceso cambió el mismo documento) sí:
      // al repetir, la transacción vuelve a leer el stock actualizado.
      const esConflicto = !error.status && /cas_mismatch|write_write_conflict|TransactionFailed/i.test(`${error.name} ${error.message}`);
      if (!esConflicto || intento >= intentos) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * intento + Math.random() * 50));
    }
  }
}

async function ejecutarTransaccion(fn) {
  let resultado;
  try {
    await getCluster().transactions().run(async (ctx) => {
      const leidos = new Map();
      const tx = {
        obtener: async (coleccion, id) => {
          try {
            const doc = await ctx.get(getCollection(coleccion), id);
            leidos.set(`${coleccion}:${id}`, doc);
            return doc.content;
          } catch (error) {
            if (error instanceof couchbase.DocumentNotFoundError) return null;
            throw error;
          }
        },
        reemplazar: async (coleccion, doc) => {
          const leido = leidos.get(`${coleccion}:${doc.id}`);
          if (!leido) throw new Error('Solo se puede reemplazar un documento leído en la misma transacción');
          await ctx.replace(leido, doc);
        },
        insertar: async (coleccion, doc) => {
          await ctx.insert(getCollection(coleccion), doc.id, doc);
        }
      };
      resultado = await fn(tx);
    });
  } catch (error) {
    if (error instanceof couchbase.TransactionFailedError && error.cause) throw error.cause;
    throw error;
  }
  return resultado;
}
