/**
 * Proxy de enrutamiento para Next.js (Sección 3 y 9.1 de 09-clima-por-ciudad.md).
 * En Next.js 16/15 actúa como capa auxiliar de redirección UX si falta la cookie de sesión.
 *
 * ADVERTENCIA DE SEGURIDAD:
 * proxy.ts NO es una frontera de seguridad: la autorización real se repite
 * estrictamente en cada Route Handler mediante requerirUsuario(request).
 */

export interface ProxyRequest {
  nextUrl: {
    pathname: string;
  };
  cookies: {
    get(name: string): { value: string } | undefined;
  };
  url: string;
}

export function proxy(request: ProxyRequest): { redirect: string } | null {
  const { pathname } = request.nextUrl;

  // Rutas que requieren sesión obligatoria para navegación
  const rutasProtegidas = ['/ciudades'];

  const esRutaProtegida = rutasProtegidas.some((ruta) => pathname.startsWith(ruta));

  if (esRutaProtegida) {
    const sesionCookie = request.cookies.get('sesion');
    if (!sesionCookie || !sesionCookie.value) {
      // Si falta la cookie de sesión, redirige al inicio
      return { redirect: '/' };
    }
  }

  return null;
}
