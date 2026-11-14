import { respuestaVacia } from '../lib/api-handler';
import {
  borrarCookieSesionHeader,
  crearCookieSesionHeader,
  extraerTokenSesion,
  MAX_AGE_SESION_SEGUNDOS,
  verificarOrigenCsrf,
} from '../lib/auth-servidor';
import { ErrorValidacion } from '../lib/errores';
import { obtenerAuthAdmin, type AuthAdminLike } from '../lib/firebase-admin';

/**
 * Inicia una sesión HttpOnly autenticada con Firebase Auth.
 * POST /api/auth/sesion
 */
export async function postSesionHandler(
  request: Request,
  authAdminInyectado?: AuthAdminLike
): Promise<Response> {
  verificarOrigenCsrf(request);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorValidacion('El cuerpo de la petición debe ser un objeto JSON válido');
  }

  const obj = cuerpo as { idToken?: unknown };
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new ErrorValidacion('El cuerpo de la petición debe ser un objeto JSON válido');
  }

  // Prevención de Mass Assignment
  const camposDesconocidos = Object.keys(obj).filter((k) => k !== 'idToken');
  if (camposDesconocidos.length > 0) {
    throw new ErrorValidacion(
      `Campos no permitidos detectados (Mass Assignment prevenido): ${camposDesconocidos.join(', ')}`
    );
  }

  if (typeof obj.idToken !== 'string' || obj.idToken.trim().length === 0) {
    throw new ErrorValidacion('El idToken es requerido y debe ser una cadena no vacía', [
      { campo: 'idToken', mensaje: 'Obligatorio' },
    ]);
  }

  const authAdmin = authAdminInyectado ?? (await obtenerAuthAdmin());
  const sessionCookie = await authAdmin.createSessionCookie(obj.idToken.trim(), {
    expiresIn: MAX_AGE_SESION_SEGUNDOS * 1000,
  });

  const cookieHeader = crearCookieSesionHeader(sessionCookie, MAX_AGE_SESION_SEGUNDOS);

  return respuestaVacia(204, {
    'Set-Cookie': cookieHeader,
  });
}

/**
 * Cierra la sesión activa y elimina la cookie HttpOnly.
 * DELETE /api/auth/sesion
 */
export async function deleteSesionHandler(
  request: Request,
  authAdminInyectado?: AuthAdminLike
): Promise<Response> {
  verificarOrigenCsrf(request);

  const credencial = extraerTokenSesion(request);
  if (credencial && credencial.tipo === 'cookie') {
    try {
      const authAdmin = authAdminInyectado ?? (await obtenerAuthAdmin());
      const decodificado = await authAdmin.verifySessionCookie(credencial.token);
      if (decodificado.uid) {
        await authAdmin.revokeRefreshTokens(decodificado.uid);
      }
    } catch {
      // Si la cookie ya era inválida o expiró, continuamos para asegurar el borrado
    }
  }

  const cookieHeader = borrarCookieSesionHeader();

  return respuestaVacia(204, {
    'Set-Cookie': cookieHeader,
  });
}
