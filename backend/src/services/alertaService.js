/**
 * Evalúa el nivel de alerta según el stock actual y el stock mínimo.
 * Regla:
 * - AGOTADO si stockActual === 0
 * - STOCK_BAJO si 0 < stockActual <= stockMinimo
 * - NORMAL si stockActual > stockMinimo
 */
export function calcularNivelAlerta(stockActual, stockMinimo) {
  const actual = Number(stockActual);
  const minimo = Number(stockMinimo);

  if (actual <= 0) {
    return 'AGOTADO';
  }
  if (actual <= minimo) {
    return 'STOCK_BAJO';
  }
  return 'NORMAL';
}
