import type { DetalleErrorValidacion, RespuestaErrorApi } from '../types/api';

/**
 * Jerarquía de errores tipados de dominio para la aplicación y la API REST.
 * Cumple con la sección 9.2 (Contrato REST común y formato unificado de error).
 */

export abstract class ErrorApp extends Error {
  public abstract readonly codigoHttp: number;
  public readonly detalles?: DetalleErrorValidacion[];

  constructor(mensaje: string, detalles?: DetalleErrorValidacion[]) {
    super(mensaje);
    this.name = this.constructor.name;
    this.detalles = detalles;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorValidacion extends ErrorApp {
  public readonly codigoHttp = 400;

  constructor(mensaje = 'Los datos proporcionados son inválidos', detalles?: DetalleErrorValidacion[]) {
    super(mensaje, detalles);
  }
}

export class ErrorNoAutenticado extends ErrorApp {
  public readonly codigoHttp = 401;

  constructor(mensaje = 'Debe iniciar sesión para realizar esta acción') {
    super(mensaje);
  }
}

export class ErrorNoAutorizado extends ErrorApp {
  public readonly codigoHttp = 403;

  constructor(mensaje = 'No tiene permisos para acceder a este recurso') {
    super(mensaje);
  }
}

export class ErrorRecursoNoEncontrado extends ErrorApp {
  public readonly codigoHttp = 404;

  constructor(mensaje = 'El recurso solicitado no fue encontrado') {
    super(mensaje);
  }
}

export class ErrorConflicto extends ErrorApp {
  public readonly codigoHttp = 409;

  constructor(mensaje = 'La operación no se pudo completar debido a un conflicto con el estado actual del recurso') {
    super(mensaje);
  }
}

export class ErrorDemasiadasSolicitudes extends ErrorApp {
  public readonly codigoHttp = 429;

  constructor(mensaje = 'Ha excedido el límite de solicitudes permitido. Intente más tarde') {
    super(mensaje);
  }
}

export class ErrorServicioExterno extends ErrorApp {
  public readonly codigoHttp = 502;

  constructor(mensaje = 'El servicio externo de clima no está disponible temporalmente') {
    super(mensaje);
  }
}

export class ErrorTimeoutServicio extends ErrorApp {
  public readonly codigoHttp = 504;

  constructor(mensaje = 'El servicio externo tardó demasiado tiempo en responder') {
    super(mensaje);
  }
}

/**
 * Convierte cualquier error capturado en una estructura canónica HTTP para Route Handlers.
 * Cumple con el formato { "error": "mensaje", "detalles"?: [...] }.
 */
export function serializarError(error: unknown): {
  codigoHttp: number;
  cuerpo: RespuestaErrorApi;
} {
  if (error instanceof ErrorApp) {
    const cuerpo: RespuestaErrorApi = { error: error.message };
    if (error.detalles && error.detalles.length > 0) {
      cuerpo.detalles = error.detalles;
    }
    return {
      codigoHttp: error.codigoHttp,
      cuerpo,
    };
  }

  // Errores no controlados no exponen trazas internas al cliente (Sección 9.2)
  return {
    codigoHttp: 500,
    cuerpo: {
      error: 'Ha ocurrido un error interno inesperado en el servidor',
    },
  };
}
