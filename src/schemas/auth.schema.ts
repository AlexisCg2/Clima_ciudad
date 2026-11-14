import { z } from 'zod';

/**
 * Esquema de validación para el inicio de sesión mediante intercambio de ID token.
 * Cumple con la sección 9.1 (POST /api/auth/sesion { idToken }).
 */
export const sesionAuthSchema = z
  .object({
    idToken: z
      .string({
        required_error: 'El idToken es obligatorio',
        invalid_type_error: 'El idToken debe ser una cadena de texto',
      })
      .trim()
      .min(1, 'El idToken no puede estar vacío'),
  })
  .strict();

export type SesionAuthEntrada = z.infer<typeof sesionAuthSchema>;
