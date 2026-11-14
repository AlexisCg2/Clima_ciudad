import { z } from 'zod';
import { latitudSchema, longitudSchema } from './coordenadas.schema';
import { LIMITE_MAXIMO_CIUDADES_FAVORITAS } from '../types/ciudad';

export { LIMITE_MAXIMO_CIUDADES_FAVORITAS };

/**
 * Esquema de validación para registrar una nueva ciudad favorita.
 */
export const crearCiudadFavoritaSchema = z
  .object({
    nombre: z
      .string({
        required_error: 'El nombre de la ciudad es obligatorio',
        invalid_type_error: 'El nombre de la ciudad debe ser texto',
      })
      .trim()
      .min(1, 'El nombre de la ciudad no puede estar vacío')
      .max(100, 'El nombre de la ciudad no puede superar los 100 caracteres'),
    pais: z
      .string({
        required_error: 'El país es obligatorio',
        invalid_type_error: 'El país debe ser texto',
      })
      .trim()
      .min(1, 'El país no puede estar vacío')
      .max(100, 'El país no puede superar los 100 caracteres'),
    lat: latitudSchema,
    lng: longitudSchema,
  })
  .strict();

export type CrearCiudadFavoritaEntrada = z.infer<typeof crearCiudadFavoritaSchema>;

/**
 * Esquema para validar el parámetro id de la ruta /api/ciudades/[id]
 */
export const ciudadIdParamSchema = z
  .object({
    id: z
      .string({
        required_error: 'El identificador de la ciudad es obligatorio',
      })
      .trim()
      .min(1, 'El identificador no puede estar vacío')
      .max(128, 'El identificador excede la longitud permitida'),
  })
  .strict();
