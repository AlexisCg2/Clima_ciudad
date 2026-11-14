import { z } from 'zod';

/**
 * Esquema de validación para coordenadas geográficas y parámetros de consulta de clima.
 * Cumple con la sección 8 (-90 a 90 para latitud, -180 a 180 para longitud).
 */
export const latitudSchema = z.coerce
  .number({
    invalid_type_error: 'La latitud debe ser un número válido',
    required_error: 'La latitud es obligatoria',
  })
  .min(-90, 'La latitud no puede ser menor a -90°')
  .max(90, 'La latitud no puede ser mayor a 90°');

export const longitudSchema = z.coerce
  .number({
    invalid_type_error: 'La longitud debe ser un número válido',
    required_error: 'La longitud es obligatoria',
  })
  .min(-180, 'La longitud no puede ser menor a -180°')
  .max(180, 'La longitud no puede ser mayor a 180°');

export const consultaClimaSchema = z.object({
  lat: latitudSchema,
  lng: longitudSchema,
});

export type ConsultaClimaParams = z.infer<typeof consultaClimaSchema>;

/**
 * Genera la clave de caché normalizada con 2 decimales para Firestore y memoria.
 * Especificación de sección 9.4: cacheClima/{lat2_lng2}
 */
export function generarClaveCache(lat: number, lng: number): string {
  const lat2 = Number(lat.toFixed(2));
  const lng2 = Number(lng.toFixed(2));
  return `${lat2.toFixed(2)}_${lng2.toFixed(2)}`;
}
