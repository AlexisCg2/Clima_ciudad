import { respuestaJson } from '../lib/api-handler';
import { requerirUsuario } from '../lib/auth-servidor';
import type { AuthAdminLike } from '../lib/firebase-admin';

/**
 * Consulta la identidad y rol del usuario con sesión activa.
 * GET /api/auth/yo
 */
export async function getYoHandler(
  request: Request,
  authAdminInyectado?: AuthAdminLike
): Promise<Response> {
  const usuario = await requerirUsuario(request, authAdminInyectado);

  return respuestaJson(
    { usuario },
    200,
    { 'Cache-Control': 'no-store' }
  );
}
