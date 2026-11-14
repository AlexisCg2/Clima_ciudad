/**
 * Adaptador de Middleware para Next.js 15.
 * Next.js 15 requiere que el interceptor se denomine middleware.ts.
 * Delega la lógica en proxy.ts según la convención del proyecto (09-clima-por-ciudad.md Secciones 3 y 9.1).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { proxy } from './proxy';

export function middleware(request: NextRequest) {
  const resultado = proxy(request);
  if (resultado && resultado.redirect) {
    return NextResponse.redirect(new URL(resultado.redirect, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/ciudades/:path*'],
};
