import { isCouchbaseActive } from '../config/couchbase.js';
import * as couchbaseStore from './couchbaseStore.js';
import * as memoria from './memoria.js';

/**
 * Punto único de acceso a los datos. Los controladores no saben si detrás
 * está Couchbase Capella o el almacén en memoria.
 */
function store() {
  return isCouchbaseActive() ? couchbaseStore : memoria;
}

export function origenDatos() {
  return isCouchbaseActive() ? 'Couchbase Capella' : 'Memoria (sin Couchbase)';
}

const ahora = () => new Date().toISOString();

export function obtener(coleccion, id) {
  return store().obtener(coleccion, id);
}

/** @param {{filtro?: object, orden?: {campo: string, direccion?: 'ASC'|'DESC'}, limite?: number}} opciones */
export function listar(coleccion, opciones) {
  return store().listar(coleccion, opciones);
}

export async function buscarUno(coleccion, filtro) {
  const [doc] = await store().listar(coleccion, { filtro, limite: 1 });
  return doc ?? null;
}

export function insertar(coleccion, doc) {
  const t = ahora();
  return store().insertar(coleccion, { ...doc, createdAt: t, updatedAt: t });
}

/** Lee el documento, aplica los cambios y lo guarda. Devuelve null si no existe. */
export async function actualizar(coleccion, id, cambios) {
  const actual = await store().obtener(coleccion, id);
  if (!actual) return null;
  const nuevo = { ...actual, ...cambios, id, updatedAt: ahora() };
  return store().reemplazar(coleccion, nuevo);
}

/**
 * Ejecuta varias lecturas y escrituras como una sola transacción ACID.
 * `fn` recibe un objeto con obtener(coleccion, id), reemplazar(coleccion, doc)
 * e insertar(coleccion, doc).
 */
export function transaccion(fn) {
  return store().transaccion(async (tx) =>
    fn({
      obtener: tx.obtener,
      reemplazar: (coleccion, doc) => tx.reemplazar(coleccion, { ...doc, updatedAt: ahora() }),
      insertar: (coleccion, doc) => tx.insertar(coleccion, { ...doc, createdAt: ahora(), updatedAt: ahora() })
    })
  );
}
