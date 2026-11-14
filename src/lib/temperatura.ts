import type { UnidadTemperatura } from '../types/clima';

/**
 * Utilidad pura para conversión y formateo de temperaturas.
 * Cumple con RF-03 y los criterios de la Sección 11 (Vitest - 4 casos de prueba mínimos).
 */

/**
 * Convierte grados Celsius a grados Fahrenheit.
 * Fórmula física: F = (C * 9/5) + 32
 *
 * @param celsius Temperatura en grados Celsius.
 * @param decimales Cantidad de decimales de precisión (por defecto 1).
 * @returns Temperatura convertida en grados Fahrenheit.
 * @throws Error si el valor no es un número finito.
 */
export function celsiusAFahrenheit(celsius: number, decimales = 1): number {
  if (!Number.isFinite(celsius)) {
    throw new TypeError(`El valor de temperatura debe ser un número finito válido. Recibido: ${String(celsius)}`);
  }
  const fahrenheit = (celsius * 9) / 5 + 32;
  const factor = Math.pow(10, decimales);
  return Math.round(fahrenheit * factor) / factor;
}

/**
 * Convierte grados Fahrenheit a grados Celsius.
 * Fórmula física: C = (F - 32) * 5/9
 *
 * @param fahrenheit Temperatura en grados Fahrenheit.
 * @param decimales Cantidad de decimales de precisión (por defecto 1).
 * @returns Temperatura convertida en grados Celsius.
 * @throws Error si el valor no es un número finito.
 */
export function fahrenheitACelsius(fahrenheit: number, decimales = 1): number {
  if (!Number.isFinite(fahrenheit)) {
    throw new TypeError(`El valor de temperatura debe ser un número finito válido. Recibido: ${String(fahrenheit)}`);
  }
  const celsius = ((fahrenheit - 32) * 5) / 9;
  const factor = Math.pow(10, decimales);
  return Math.round(celsius * factor) / factor;
}

/**
 * Obtiene el símbolo textual accesible para la unidad de temperatura.
 *
 * @param unidad Unidad solicitada ('celsius' o 'fahrenheit').
 * @returns '°C' o '°F'.
 */
export function obtenerSimboloUnidad(unidad: UnidadTemperatura): string {
  return unidad === 'celsius' ? '°C' : '°F';
}

/**
 * Formatea un valor numérico de temperatura con su correspondiente símbolo de unidad.
 *
 * @param valor Magnitud de la temperatura ya expresada en la unidad destino.
 * @param unidad Unidad de medida ('celsius' | 'fahrenheit').
 * @param incluirSimbolo Si es true, añade el símbolo ('°C' o '°F').
 * @returns Cadena formateada (ej. "25.0 °C").
 */
export function formatearTemperatura(
  valor: number,
  unidad: UnidadTemperatura,
  incluirSimbolo = true
): string {
  if (!Number.isFinite(valor)) {
    throw new TypeError(`El valor a formatear debe ser un número finito válido. Recibido: ${String(valor)}`);
  }
  const textoNumero = valor.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  if (!incluirSimbolo) {
    return textoNumero;
  }

  return `${textoNumero} ${obtenerSimboloUnidad(unidad)}`;
}
