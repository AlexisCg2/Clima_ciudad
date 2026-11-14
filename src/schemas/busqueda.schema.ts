import { z } from 'zod';

/**
 * Esquema de validación para búsqueda de ciudades (Open-Meteo Geocoding).
 * Cumple con la sección 8 (texto de búsqueda de 2 a 60 caracteres).
 */
export const busquedaCiudadSchema = z
  .object({
    q: z
      .string({
        required_error: 'El término de búsqueda es obligatorio',
        invalid_type_error: 'El término de búsqueda debe ser una cadena de texto',
      })
      .trim()
      .min(2, 'El texto de búsqueda debe contener al menos 2 caracteres')
      .max(60, 'El texto de búsqueda no puede superar los 60 caracteres'),
  })
  .strict();

export type BusquedaCiudadParams = z.infer<typeof busquedaCiudadSchema>;
