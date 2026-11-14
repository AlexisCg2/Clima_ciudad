import { describe, it, expect } from 'vitest';
import { obtenerCondicionWmo } from '../../src/lib/wmo';

describe('Mapeo de Códigos Meteorológicos WMO (Open-Meteo)', () => {
  it('Código 0 retorna Cielo despejado con icono accesible sol', () => {
    const res = obtenerCondicionWmo(0);
    expect(res.codigoWmo).toBe(0);
    expect(res.descripcion).toBe('Cielo despejado');
    expect(res.icono).toBe('sol');
  });

  it('Códigos de lluvia (61, 63, 65) retornan descripciones graduadas', () => {
    expect(obtenerCondicionWmo(61).descripcion).toBe('Lluvia ligera');
    expect(obtenerCondicionWmo(63).descripcion).toBe('Lluvia moderada');
    expect(obtenerCondicionWmo(65).descripcion).toBe('Lluvia fuerte');
  });

  it('Códigos de tormenta (95, 96, 99) retornan descripciones de tormenta y granizo', () => {
    expect(obtenerCondicionWmo(95).descripcion).toBe('Tormenta eléctrica');
    expect(obtenerCondicionWmo(96).descripcion).toBe('Tormenta eléctrica con granizo ligero');
    expect(obtenerCondicionWmo(99).descripcion).toBe('Tormenta eléctrica con granizo fuerte');
  });

  it('Código no registrado retorna descripción genérica sin romper ejecución', () => {
    const res = obtenerCondicionWmo(9999);
    expect(res.codigoWmo).toBe(9999);
    expect(res.descripcion).toBe('Condición climática no especificada');
    expect(res.icono).toBe('clima-desconocido');
  });
});
