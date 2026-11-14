import { describe, it, expect } from 'vitest';
import { formatearTemperatura } from '../../src/lib/temperatura';

describe('Lógica Pura de Interfaz y Formateo Accesible (WCAG 2.2 AA)', () => {
  it('Intl.DateTimeFormat formatea fechas en español sin errores', () => {
    const fecha = new Date('2026-11-14T12:00:00Z');
    const formateadorDia = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
    const dia = formateadorDia.format(fecha);
    expect(typeof dia).toBe('string');
    expect(dia.length).toBeGreaterThan(0);

    const formateadorHora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hora = formateadorHora.format(fecha);
    expect(hora).toMatch(/^\d{2}:\d{2}$/);
  });

  it('Cálculo de escala SVG genera polilíneas válidas sin NaN', () => {
    const temps = [15.5, 18.0, 22.5, 19.0, 14.2];
    const ancho = 800;
    const alto = 220;
    const paddingX = 40;
    const paddingTop = 35;
    const paddingBottom = 45;

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const rango = maxTemp - minTemp;
    const alturaUtil = alto - paddingTop - paddingBottom;
    const pasoX = (ancho - paddingX * 2) / (temps.length - 1);

    const puntos = temps.map((temp, i) => {
      const x = paddingX + i * pasoX;
      const y = paddingTop + alturaUtil - ((temp - minTemp) / rango) * alturaUtil;
      return { x, y };
    });

    for (const p of puntos) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.y).toBeGreaterThanOrEqual(paddingTop);
      expect(p.y).toBeLessThanOrEqual(alto - paddingBottom);
    }

    const polylineStr = puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    expect(polylineStr).toContain(',');
    expect(polylineStr).not.toContain('NaN');
  });

  it('formatearTemperatura aplica formato y símbolos accesibles para ambas escalas', () => {
    expect(formatearTemperatura(20, 'celsius')).toContain('20');
    expect(formatearTemperatura(20, 'celsius')).toContain('°C');
    expect(formatearTemperatura(68, 'fahrenheit')).toContain('68');
    expect(formatearTemperatura(68, 'fahrenheit')).toContain('°F');
  });
});
