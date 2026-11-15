/** Error de negocio con código HTTP, para responder 400/404/409 en lugar de 500. */
export class ErrorNegocio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.status = status;
  }
}
