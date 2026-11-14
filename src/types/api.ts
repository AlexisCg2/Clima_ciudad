/**
 * Tipos de contrato HTTP para respuestas de la API REST
 * Cumple con la sección 9.2 (Contrato REST común y formato canónico de errores).
 */

export interface DetalleErrorValidacion {
  campo: string;
  mensaje: string;
}

export interface RespuestaErrorApi {
  error: string;
  detalles?: DetalleErrorValidacion[];
}

export interface RespuestaPaginada<T> {
  items: T[];
  siguienteCursor: string | null;
}
