import { describe, it, expect } from 'vitest';
import { proxy, type ProxyRequest } from '../../proxy';

describe('Proxy de Enrutamiento y Redirección UX (Sección 3 y 9.1)', () => {
  it('Ruta pública "/" sin cookie no redirige', () => {
    const req: ProxyRequest = {
      nextUrl: { pathname: '/' },
      cookies: { get: () => undefined },
      url: 'http://localhost:3000/',
    };
    expect(proxy(req)).toBeNull();
  });

  it('Ruta pública "/buscar" sin cookie no redirige', () => {
    const req: ProxyRequest = {
      nextUrl: { pathname: '/buscar' },
      cookies: { get: () => undefined },
      url: 'http://localhost:3000/buscar',
    };
    expect(proxy(req)).toBeNull();
  });

  it('Ruta protegida "/ciudades" sin cookie redirige a "/"', () => {
    const req: ProxyRequest = {
      nextUrl: { pathname: '/ciudades' },
      cookies: { get: () => undefined },
      url: 'http://localhost:3000/ciudades',
    };
    expect(proxy(req)).toEqual({ redirect: '/' });
  });

  it('Ruta protegida "/ciudades" con cookie vacía redirige a "/"', () => {
    const req: ProxyRequest = {
      nextUrl: { pathname: '/ciudades' },
      cookies: { get: () => ({ value: '' }) },
      url: 'http://localhost:3000/ciudades',
    };
    expect(proxy(req)).toEqual({ redirect: '/' });
  });

  it('Subruta protegida "/ciudades/bogota-123" sin cookie redirige a "/"', () => {
    const req: ProxyRequest = {
      nextUrl: { pathname: '/ciudades/bogota-123' },
      cookies: { get: () => undefined },
      url: 'http://localhost:3000/ciudades/bogota-123',
    };
    expect(proxy(req)).toEqual({ redirect: '/' });
  });

  it('Ruta protegida con cookie de sesión válida permite el acceso (null)', () => {
    const req: ProxyRequest = {
      nextUrl: { pathname: '/ciudades' },
      cookies: { get: (name: string) => (name === 'sesion' ? { value: 'token-jwt-sesion' } : undefined) },
      url: 'http://localhost:3000/ciudades',
    };
    expect(proxy(req)).toBeNull();
  });
});
