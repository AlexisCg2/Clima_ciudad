import { describe, it, expect } from 'vitest';
import {
  celsiusAFahrenheit,
  fahrenheitACelsius,
  obtenerSimboloUnidad,
  formatearTemperatura,
} from '../../src/lib/temperatura';

describe('Utilidad de Conversión de Temperatura (RF-03 y Sección 11)', () => {
  describe('celsiusAFahrenheit - 4 Casos Obligatorios de la Rúbrica', () => {
    it('Caso 1: Punto de congelación del agua (0 °C -> 32 °F)', () => {
      expect(celsiusAFahrenheit(0)).toBe(32);
    });

    it('Caso 2: Punto de ebullición del agua (100 °C -> 212 °F)', () => {
      expect(celsiusAFahrenheit(100)).toBe(212);
    });

    it('Caso 3: Punto de convergencia de escalas (-40 °C -> -40 °F)', () => {
      expect(celsiusAFahrenheit(-40)).toBe(-40);
    });

    it('Caso 4: Temperatura ambiente estándar (25 °C -> 77 °F)', () => {
      expect(celsiusAFahrenheit(25)).toBe(77);
    });
  });

  describe('celsiusAFahrenheit - Precisión y Casos de Borde', () => {
    it('Convierte temperatura corporal normal (37 °C -> 98.6 °F)', () => {
      expect(celsiusAFahrenheit(37, 1)).toBe(98.6);
    });

    it('Lanza TypeError al recibir NaN o Infinity', () => {
      expect(() => celsiusAFahrenheit(Number.NaN)).toThrow(TypeError);
      expect(() => celsiusAFahrenheit(Infinity)).toThrow(TypeError);
      expect(() => celsiusAFahrenheit(-Infinity)).toThrow(TypeError);
    });
  });

  describe('fahrenheitACelsius - Conversión Inversa y Simetría', () => {
    it('Invierte punto de congelación (32 °F -> 0 °C)', () => {
      expect(fahrenheitACelsius(32)).toBe(0);
    });

    it('Invierte punto de ebullición (212 °F -> 100 °C)', () => {
      expect(fahrenheitACelsius(212)).toBe(100);
    });

    it('Invierte punto de convergencia (-40 °F -> -40 °C)', () => {
      expect(fahrenheitACelsius(-40)).toBe(-40);
    });

    it('Invierte temperatura ambiente (77 °F -> 25 °C)', () => {
      expect(fahrenheitACelsius(77)).toBe(25);
    });

    it('Lanza TypeError al recibir NaN o Infinity', () => {
      expect(() => fahrenheitACelsius(Number.NaN)).toThrow(TypeError);
      expect(() => fahrenheitACelsius(Infinity)).toThrow(TypeError);
    });
  });

  describe('Formateo y Accesibilidad de Unidades', () => {
    it('Retorna el símbolo correcto para cada unidad', () => {
      expect(obtenerSimboloUnidad('celsius')).toBe('°C');
      expect(obtenerSimboloUnidad('fahrenheit')).toBe('°F');
    });

    it('Formatea valores con símbolo accesible', () => {
      const formateadoC = formatearTemperatura(25, 'celsius');
      expect(formateadoC).toContain('25');
      expect(formateadoC).toContain('°C');

      const formateadoF = formatearTemperatura(77, 'fahrenheit');
      expect(formateadoF).toContain('77');
      expect(formateadoF).toContain('°F');
    });
  });
});
