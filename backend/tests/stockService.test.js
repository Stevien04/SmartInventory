import test from 'node:test';
import assert from 'node:assert/strict';
import { validarYCalcularNuevoStock } from '../src/services/stockService.js';
import { calcularNivelAlerta } from '../src/services/alertaService.js';

test('validarYCalcularNuevoStock: incrementa stock correctamente en ENTRADA', () => {
  const resultado = validarYCalcularNuevoStock(10, 'ENTRADA', 5);
  assert.equal(resultado.stockAnterior, 10);
  assert.equal(resultado.stockPosterior, 15);
});

test('validarYCalcularNuevoStock: disminuye stock correctamente en SALIDA permitida', () => {
  const resultado = validarYCalcularNuevoStock(10, 'SALIDA', 4);
  assert.equal(resultado.stockAnterior, 10);
  assert.equal(resultado.stockPosterior, 6);
});

test('validarYCalcularNuevoStock: RECHAZA salida que genera stock negativo', () => {
  assert.throws(
    () => {
      validarYCalcularNuevoStock(5, 'SALIDA', 10);
    },
    {
      message: /Stock insuficiente.*No se permite stock negativo/
    }
  );
});

test('calcularNivelAlerta: clasifica AGOTADO cuando stock es 0', () => {
  assert.equal(calcularNivelAlerta(0, 5), 'AGOTADO');
});

test('calcularNivelAlerta: clasifica STOCK_BAJO cuando stock <= stockMinimo', () => {
  assert.equal(calcularNivelAlerta(4, 5), 'STOCK_BAJO');
  assert.equal(calcularNivelAlerta(5, 5), 'STOCK_BAJO');
});

test('calcularNivelAlerta: clasifica NORMAL cuando stock > stockMinimo', () => {
  assert.equal(calcularNivelAlerta(12, 5), 'NORMAL');
});
