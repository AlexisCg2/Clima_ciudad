import { ErrorNoAutenticado, ErrorNoAutorizado } from './errores';
import { obtenerAuthAdmin, type AuthAdminLike } from './firebase-admin';
import type { RolUsuario, UsuarioSesion } from '../types/auth';

/**
 * Nombre de la cookie de sesión HttpOnly.
 */
export const NOMBRE_COOKIE_SESION = 'sesion';

/**
 * Tiempo de vida por defecto de la sesión: 5 días en segundos (5 * 24 * 3600).
 * Cumple con la sección 9.1 de 09-clima-por-ciudad.md (entre 5 min y 2 semanas, aprox. 5 días).
 */
export const MAX_AGE_SESION_SEGUNDOS = 5 * 24 * 60 * 60; // 432,000 segundos

/**
 * Extrae la cookie de sesión o el token Bearer del encabezado de la petición.
 */
export function extraerTokenSesion(request: Request): {
  tipo: 'cookie' | 'bearer';
  token: string;
} | null {
  // 1. Intento de extracción por cabecera Cookie
  const cookieHeader = request.headers.get('cookie') ?? '';
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith(`${NOMBRE_COOKIE_SESION}=`)) {
        const valor = c.slice(NOMBRE_COOKIE_SESION.length + 1).trim();
        if (valor) {
          return { tipo: 'cookie', token: valor };
        }
      }
    }
  }

  // 2. Intento de extracción por cabecera Authorization (para Bruno / herramientas de prueba)
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return { tipo: 'bearer', token };
    }
  }

  return null;
}

/**
 * Verifica la procedencia de la petición para mitigar ataques CSRF en métodos que mutan estado.
 * Cumple con la directiva de la Sección 9.1 (Cookie SameSite=Lax y comprobación de Origin).
 */
export function verificarOrigenCsrf(request: Request): void {
  const metodo = request.method.toUpperCase();
  if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') {
    return;
  }

  const credencial = extraerTokenSesion(request);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Si la petición utiliza autenticación basada en Cookie de Sesión,
  // la cabecera Origin o Referer es obligatoria para prevenir ataques CSRF
  if (credencial?.tipo === 'cookie' && !origin && !referer) {
    throw new ErrorNoAutorizado(
      'Cabecera Origin o Referer requerida para operaciones de mutación con sesión (Protección CSRF)'
    );
  }

  if (origin) {
    try {
      const urlPeticion = new URL(request.url);
      if (origin !== urlPeticion.origin) {
        throw new ErrorNoAutorizado('Origen de la petición no coincide con el sitio (Protección CSRF)');
      }
    } catch {
      throw new ErrorNoAutorizado('Origen de la petición inválido');
    }
    return;
  }

  if (referer) {
    try {
      const urlReferer = new URL(referer);
      const urlPeticion = new URL(request.url);
      if (urlReferer.origin !== urlPeticion.origin) {
        throw new ErrorNoAutorizado('Origen en Referer no coincide con el sitio (Protección CSRF)');
      }
    } catch {
      throw new ErrorNoAutorizado('Cabecera Referer inválida (Protección CSRF)');
    }
  }
}

/**
 * Genera la cadena para la cabecera Set-Cookie al iniciar sesión.
 */
export function crearCookieSesionHeader(
  sessionCookie: string,
  maxAgeSegundos: number = MAX_AGE_SESION_SEGUNDOS,
  esProduccion: boolean = process.env.NODE_ENV === 'production'
): string {
  const flags = [
    `${NOMBRE_COOKIE_SESION}=${sessionCookie}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSegundos}`,
  ];

  if (esProduccion) {
    flags.push('Secure');
  }

  return flags.join('; ');
}

/**
 * Genera la cabecera Set-Cookie para destruir la sesión del usuario.
 */
export function borrarCookieSesionHeader(
  esProduccion: boolean = process.env.NODE_ENV === 'production'
): string {
  const flags = [
    `${NOMBRE_COOKIE_SESION}=`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];

  if (esProduccion) {
    flags.push('Secure');
  }

  return flags.join('; ');
}

/**
 * Valida la identidad del usuario autenticado en el servidor.
 * NUNCA confía en datos enviados en el cuerpo o la URL.
 *
 * @throws ErrorNoAutenticado (401) si falta el token o no es válido.
 */
export async function requerirUsuario(
  request: Request,
  authAdminInyectado?: AuthAdminLike
): Promise<UsuarioSesion> {
  const credencial = extraerTokenSesion(request);
  if (!credencial) {
    throw new ErrorNoAutenticado('No hay una sesión activa. Debe iniciar sesión');
  }

  const authAdmin = authAdminInyectado ?? (await obtenerAuthAdmin());

  try {
    let decodificado: { uid: string; email?: string; rol?: string };

    if (credencial.tipo === 'cookie') {
      decodificado = await authAdmin.verifySessionCookie(credencial.token, true);
    } else {
      decodificado = await authAdmin.verifyIdToken(credencial.token, true);
    }

    if (!decodificado.uid) {
      throw new ErrorNoAutenticado('Token de sesión no contiene un identificador de usuario válido');
    }

    const rol: RolUsuario = decodificado.rol === 'admin' ? 'admin' : 'usuario';

    return {
      uid: decodificado.uid,
      correo: decodificado.email ?? '',
      rol,
    };
  } catch (error: unknown) {
    if (error instanceof ErrorNoAutenticado) {
      throw error;
    }
    throw new ErrorNoAutenticado('La sesión ha expirado o no es válida. Inicie sesión nuevamente');
  }
}
