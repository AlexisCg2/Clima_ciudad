import { describe, it, expect } from 'vitest';
import { manejar, respuestaJson, respuestaVacia } from '../../src/lib/api-handler';
import { ErrorNoAutenticado, ErrorValidacion } from '../../src/lib/errores';

describe('Envoltorio Unificado manejar(handler) y Respuestas API (Sección 9.2)', () => {
  it('respuestaJson genera Response con status y Content-Type application/json', async () => {
    const res = respuestaJson({ ok: true }, 200, { 'X-Custom': '1' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('x-custom')).toBe('1');
    const datos = await res.json();
    expect(datos).toEqual({ ok: true });
  });

  it('respuestaVacia genera Response con status 204 y sin cuerpo', () => {
    const res = respuestaVacia();
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });

  it('manejar captura ErrorValidacion y retorna HTTP 400 con formato canónico { error, detalles }', async () => {
    const handler = manejar(async () => {
      throw new ErrorValidacion('Parámetro inválido', [{ campo: 'lat', mensaje: 'Fuera de rango' }]);
    });

    const req = new Request('http://localhost:3000/api/test');
    const res = await handler(req);

    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toBe('no-store');

    const json = (await res.json()) as { error: string; detalles: Array<{ campo: string; mensaje: string }> };
    expect(json.error).toBe('Parámetro inválido');
    expect(json.detalles).toEqual([{ campo: 'lat', mensaje: 'Fuera de rango' }]);
  });

  it('manejar captura ErrorNoAutenticado y retorna HTTP 401', async () => {
    const handler = manejar(async () => {
      throw new ErrorNoAutenticado('Debe iniciar sesión');
    });

    const res = await handler(new Request('http://localhost:3000/api/test'));
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('Debe iniciar sesión');
  });

  it('manejar captura excepciones no controladas y retorna HTTP 500 sin exponer trazas internas', async () => {
    const handler = manejar(async () => {
      throw new Error('Fallo crítico no previsto en infraestructura interna');
    });

    const res = await handler(new Request('http://localhost:3000/api/test'));
    expect(res.status).toBe(500);

    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('Ha ocurrido un error interno inesperado en el servidor');
  });
});
