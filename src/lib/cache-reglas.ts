/**
 * Reglas de negocio y utilidades para la caché de pronósticos de clima.
 * Cumple con RF-06 y la especificación de cacheClima/{lat2_lng2} (15 minutos de TTL).
 */

/** Tiempo de vida de la caché: 15 minutos en milisegundos (15 * 60 * 1000) */
export const TTL_CACHE_CLIMA_MS = 15 * 60 * 1000;

/**
 * Normaliza las coordenadas a exactamente 2 decimales para la clave de caché.
 * Ejemplo: lat 4.6097, lng -74.0817 -> "4.61_-74.08"
 *
 * @param lat Latitud geográfica.
 * @param lng Longitud geográfica.
 * @returns Clave normalizada con formato `{lat2}_{lng2}`.
 */
export function normalizarClaveCache(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new TypeError(`Las coordenadas deben ser números finitos. Recibido lat: ${String(lat)}, lng: ${String(lng)}`);
  }
  const lat2 = Number(lat.toFixed(2));
  const lng2 = Number(lng.toFixed(2));
  return `${lat2.toFixed(2)}_${lng2.toFixed(2)}`;
}

/**
 * Determina si una entrada de caché sigue siendo válida en base a su marca temporal ISO.
 *
 * @param obtenidoEnIso Marca de tiempo ISO 8601 UTC en que se guardaron los datos.
 * @param ahora Fecha de comparación (por defecto la fecha actual).
 * @param ttlMs Tiempo de vida en milisegundos (por defecto 15 minutos).
 * @returns true si el tiempo transcurrido es menor a ttlMs, false en caso contrario.
 */
export function esCacheValido(
  obtenidoEnIso: string,
  ahora: Date = new Date(),
  ttlMs: number = TTL_CACHE_CLIMA_MS
): boolean {
  const tiempoGuardado = new Date(obtenidoEnIso).getTime();
  if (Number.isNaN(tiempoGuardado)) {
    return false;
  }
  const diferencia = ahora.getTime() - tiempoGuardado;
  return diferencia >= 0 && diferencia < ttlMs;
}

/**
 * Calcula la antigüedad de los datos en minutos enteros transcurridos (RF-06).
 *
 * @param obtenidoEnIso Marca de tiempo ISO 8601 UTC original.
 * @param ahora Fecha de comparación.
 * @returns Antigüedad en minutos (entero >= 0).
 */
export function calcularAntiguedadMinutos(
  obtenidoEnIso: string,
  ahora: Date = new Date()
): number {
  const tiempoGuardado = new Date(obtenidoEnIso).getTime();
  if (Number.isNaN(tiempoGuardado)) {
    return 0;
  }
  const diferenciaMs = ahora.getTime() - tiempoGuardado;
  if (diferenciaMs <= 0) {
    return 0;
  }
  return Math.floor(diferenciaMs / (60 * 1000));
}
