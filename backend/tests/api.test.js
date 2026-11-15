import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { reiniciar } from '../src/db/memoria.js';
import { construirConsulta } from '../src/db/couchbaseStore.js';
import { connectCouchbase, closeCouchbase } from '../src/config/couchbase.js';

// Sin variables COUCHBASE_* las pruebas usan el almacén en memoria con los datos de ejemplo.
// Con ellas (y después de npm run db:init y npm run seed) se ejecutan contra Couchbase real.
let servidor;
let base;
let token;

async function llamar(metodo, ruta, cuerpo) {
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  reiniciar();
  if (process.env.COUCHBASE_CONNECTION_STRING) await connectCouchbase();
  servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  const login = await llamar('POST', '/auth/login', { email: 'admin@smartinventory.com', password: 'Admin2026*!' });
  assert.equal(login.status, 200);
  token = login.body.token;
});

after(async () => {
  servidor.close();
  await closeCouchbase();
});

test('health informa el motor Couchbase', async () => {
  const { status, body } = await llamar('GET', '/health');
  assert.equal(status, 200);
  assert.equal(body.database.motor, 'Couchbase Capella');
});

test('login rechaza una contraseña incorrecta', async () => {
  const guardado = token;
  token = null;
  const { status } = await llamar('POST', '/auth/login', { email: 'admin@smartinventory.com', password: 'mala' });
  token = guardado;
  assert.equal(status, 401);
});

test('crear producto, registrar entrada y salida', async () => {
  const codigo = `sku-test-${Date.now()}`;
  const creado = await llamar('POST', '/productos', {
    codigo,
    nombre: 'Producto de prueba',
    precioCompra: 10,
    precioVenta: 15,
    stockMinimo: 2
  });
  assert.equal(creado.status, 201);
  assert.equal(creado.body.codigo, codigo.toUpperCase());
  assert.equal(creado.body.stockActual, 0);

  const repetido = await llamar('POST', '/productos', {
    codigo, nombre: 'Otro', precioCompra: 1, precioVenta: 2, stockMinimo: 1
  });
  assert.equal(repetido.status, 409);

  const entrada = await llamar('POST', '/movimientos', { productoId: creado.body.id, tipo: 'ENTRADA', cantidad: 5 });
  assert.equal(entrada.status, 201);
  assert.equal(entrada.body.producto.stockActual, 5);

  const salida = await llamar('POST', '/movimientos', { productoId: creado.body.id, tipo: 'SALIDA', cantidad: 4 });
  assert.equal(salida.status, 201);
  assert.equal(salida.body.producto.stockActual, 1);
  assert.equal(salida.body.alerta, 'STOCK_BAJO');

  const historial = await llamar('GET', `/movimientos?productoId=${creado.body.id}`);
  assert.equal(historial.body.length, 2);
});

test('una salida mayor al stock se rechaza y no cambia nada', async () => {
  const { status, body } = await llamar('POST', '/movimientos', { productoId: 'PROD-002', tipo: 'SALIDA', cantidad: 99 });
  assert.equal(status, 400);
  assert.match(body.error, /Stock insuficiente/);

  const producto = await llamar('GET', '/productos/PROD-002');
  assert.equal(producto.body.stockActual, 3);
});

test('alertas y dashboard reflejan el stock', async () => {
  const alertas = await llamar('GET', '/alertas');
  const tipos = Object.fromEntries(alertas.body.map((a) => [a.id, a.tipoAlerta]));
  assert.equal(tipos['PROD-003'], 'AGOTADO');
  assert.equal(tipos['PROD-002'], 'STOCK_BAJO');

  const resumen = await llamar('GET', '/dashboard/resumen');
  assert.equal(resumen.status, 200);
  assert.ok(resumen.body.totalProductosActivos >= 3);
});

test('las consultas SQL++ van parametrizadas', () => {
  const { sql, parametros } = construirConsulta('productos', {
    filtro: { estado: 'ACTIVO' },
    orden: { campo: 'nombre' },
    limite: 5
  });
  assert.equal(sql, 'SELECT d.* FROM `productos` AS d WHERE d.`estado` = $estado ORDER BY d.`nombre` ASC LIMIT 5');
  assert.deepEqual(parametros, { estado: 'ACTIVO' });
  assert.throws(() => construirConsulta('productos', { filtro: { 'estado` OR 1=1': 'x' } }));
});
