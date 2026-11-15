import bcrypt from 'bcryptjs';
import * as datos from '../data/datosIniciales.js';

/**
 * Almacén en memoria con la misma interfaz que el de Couchbase.
 * Se usa cuando no hay credenciales de Couchbase (desarrollo local y pruebas).
 * Los datos se pierden al reiniciar el proceso.
 */
const copia = (obj) => (obj === null || obj === undefined ? null : structuredClone(obj));

function crearTablas() {
  const ahora = new Date().toISOString();
  const conFechas = (doc) => ({ ...doc, createdAt: ahora, updatedAt: ahora });
  const tablas = {
    usuarios: new Map(),
    categorias: new Map(),
    proveedores: new Map(),
    productos: new Map(),
    movimientos: new Map()
  };
  const admin = datos.usuarioAdmin(bcrypt.hashSync(datos.ADMIN_PASSWORD_DEMO, 10));
  tablas.usuarios.set(admin.id, conFechas(admin));
  for (const nombre of ['categorias', 'proveedores', 'productos', 'movimientos']) {
    for (const doc of datos[nombre]) tablas[nombre].set(doc.id, conFechas(doc));
  }
  return tablas;
}

let tablas = crearTablas();

/** Vuelve a los datos iniciales (útil en pruebas). */
export function reiniciar() {
  tablas = crearTablas();
}

function tabla(coleccion) {
  const t = tablas[coleccion];
  if (!t) throw new Error(`Colección desconocida: ${coleccion}`);
  return t;
}

function cumpleFiltro(doc, filtro) {
  return Object.entries(filtro).every(([campo, valor]) => doc[campo] === valor);
}

export async function obtener(coleccion, id) {
  return copia(tabla(coleccion).get(id) ?? null);
}

export async function listar(coleccion, { filtro = {}, orden, limite } = {}) {
  let docs = [...tabla(coleccion).values()].filter((d) => cumpleFiltro(d, filtro));
  if (orden) {
    const signo = orden.direccion === 'DESC' ? -1 : 1;
    docs.sort((a, b) => (a[orden.campo] > b[orden.campo] ? signo : a[orden.campo] < b[orden.campo] ? -signo : 0));
  }
  if (limite) docs = docs.slice(0, limite);
  return docs.map(copia);
}

export async function insertar(coleccion, doc) {
  const t = tabla(coleccion);
  if (t.has(doc.id)) throw new Error(`Ya existe un documento con id ${doc.id}`);
  t.set(doc.id, copia(doc));
  return copia(doc);
}

export async function reemplazar(coleccion, doc) {
  tabla(coleccion).set(doc.id, copia(doc));
  return copia(doc);
}

/**
 * En memoria no hay concurrencia real (un solo hilo), así que basta con
 * ejecutar la función con las mismas operaciones que ofrece Couchbase.
 * Las escrituras se aplican solo si la función termina sin errores.
 */
export async function transaccion(fn) {
  const pendientes = [];
  const tx = {
    obtener: (coleccion, id) => obtener(coleccion, id),
    reemplazar: async (coleccion, doc) => {
      pendientes.push(() => reemplazar(coleccion, doc));
    },
    insertar: async (coleccion, doc) => {
      if (tabla(coleccion).has(doc.id)) throw new Error(`Ya existe un documento con id ${doc.id}`);
      pendientes.push(() => insertar(coleccion, doc));
    }
  };
  const resultado = await fn(tx);
  for (const aplicar of pendientes) await aplicar();
  return resultado;
}
