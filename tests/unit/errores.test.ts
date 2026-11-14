import { describe, it, expect } from 'vitest';
import {
  ErrorApp,
  ErrorValidacion,
  ErrorNoAutenticado,
  ErrorNoAutorizado,
  ErrorRecursoNoEncontrado,
  ErrorConflicto,
  ErrorDemasiadasSolicitudes,
  ErrorServicioExterno,
  ErrorTimeoutServicio,
  serializarError,
} from '../../src/lib/errores';

describe('Jerarquía de Errores y Serialización Canónica (Sección 9.2)', () => {
  it('ErrorValidacion tiene código 400 y detalles opcionales', () => {
    const err = new ErrorValidacion('Parámetros inválidos', [{ campo: 'lat', mensaje: 'Obligatorio' }]);
    expect(err).toBeInstanceOf(ErrorApp);
    expect(err.codigoHttp).toBe(400);
    expect(err.message).toBe('Parámetros inválidos');
    expect(err.detalles).toEqual([{ campo: 'lat', mensaje: 'Obligatorio' }]);
  });

  it('ErrorNoAutenticado tiene código 401', () => {
    const err = new ErrorNoAutenticado();
    expect(err.codigoHttp).toBe(401);
  });

  it('ErrorNoAutorizado tiene código 403', () => {
    const err = new ErrorNoAutorizado();
    expect(err.codigoHttp).toBe(403);
  });

  it('ErrorRecursoNoEncontrado tiene código 404', () => {
    const err = new ErrorRecursoNoEncontrado();
    expect(err.codigoHttp).toBe(404);
  });

  it('ErrorConflicto tiene código 409', () => {
    const err = new ErrorConflicto('Elemento duplicado');
    expect(err.codigoHttp).toBe(409);
    expect(err.message).toBe('Elemento duplicado');
  });

  it('ErrorDemasiadasSolicitudes tiene código 429', () => {
    const err = new ErrorDemasiadasSolicitudes();
    expect(err.codigoHttp).toBe(429);
  });

  it('ErrorServicioExterno tiene código 502', () => {
    const err = new ErrorServicioExterno('Open-Meteo falló');
    expect(err.codigoHttp).toBe(502);
  });

  it('ErrorTimeoutServicio tiene código 504', () => {
    const err = new ErrorTimeoutServicio();
    expect(err.codigoHttp).toBe(504);
  });

  it('serializarError convierte ErrorApp a formato { error, detalles? }', () => {
    const err = new ErrorValidacion('Falta parámetro', [{ campo: 'q', mensaje: 'Mínimo 2 caracteres' }]);
    const serializado = serializarError(err);
    expect(serializado.codigoHttp).toBe(400);
    expect(serializado.cuerpo).toEqual({
      error: 'Falta parámetro',
      detalles: [{ campo: 'q', mensaje: 'Mínimo 2 caracteres' }],
    });
  });

  it('serializarError enmascara excepciones no controladas con HTTP 500 sin exponer trazas', () => {
    const errorInterno = new Error('Database password timeout');
    const serializado = serializarError(errorInterno);
    expect(serializado.codigoHttp).toBe(500);
    expect(serializado.cuerpo.error).toBe('Ha ocurrido un error interno inesperado en el servidor');
    expect(serializado.cuerpo).not.toHaveProperty('detalles');
  });
});
