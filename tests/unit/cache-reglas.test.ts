import { describe, it, expect } from 'vitest';
import {
  normalizarClaveCache,
  esCacheValido,
  calcularAntiguedadMinutos,
  TTL_CACHE_CLIMA_MS,
} from '../../src/lib/cache-reglas';

describe('Reglas de Negocio de Caché (15 minutos y normalización lat2_lng2)', () => {
  it('normalizarClaveCache formatea a exactamente 2 decimales', () => {
    expect(normalizarClaveCache(4.60971, -74.08175)).toBe('4.61_-74.08');
    expect(normalizarClaveCache(0, 0)).toBe('0.00_0.00');
    expect(normalizarClaveCache(-34.603722, -58.381592)).toBe('-34.60_-58.38');
  });

  it('normalizarClaveCache lanza TypeError ante coordenadas no finitas', () => {
    expect(() => normalizarClaveCache(NaN, 10)).toThrow(TypeError);
    expect(() => normalizarClaveCache(10, Infinity)).toThrow(TypeError);
  });

  it('esCacheValido retorna true para datos dentro de los 15 minutos (900s)', () => {
    const ahora = new Date('2026-11-14T12:00:00.000Z');
    // Guardado hace 10 minutos (600,000 ms)
    const guardadoIso = new Date('2026-11-14T11:50:00.000Z').toISOString();
    expect(esCacheValido(guardadoIso, ahora)).toBe(true);
  });

  it('esCacheValido retorna false para datos de más de 15 minutos', () => {
    const ahora = new Date('2026-11-14T12:00:00.000Z');
    // Guardado hace 15 minutos y 1 segundo
    const guardadoIso = new Date('2026-11-14T11:44:59.000Z').toISOString();
    expect(esCacheValido(guardadoIso, ahora)).toBe(false);
  });

  it('esCacheValido retorna false ante marcas temporales ISO inválidas', () => {
    expect(esCacheValido('fecha-invalida')).toBe(false);
  });

  it('TTL_CACHE_CLIMA_MS equivale exactamente a 15 minutos en milisegundos', () => {
    expect(TTL_CACHE_CLIMA_MS).toBe(15 * 60 * 1000);
  });

  it('calcularAntiguedadMinutos calcula correctamente minutos transcurridos (RF-06)', () => {
    const ahora = new Date('2026-11-14T12:00:00.000Z');
    const hace7Minutos = new Date('2026-11-14T11:53:00.000Z').toISOString();
    expect(calcularAntiguedadMinutos(hace7Minutos, ahora)).toBe(7);

    const reciénObtenido = ahora.toISOString();
    expect(calcularAntiguedadMinutos(reciénObtenido, ahora)).toBe(0);
  });
});
