import { describe, it, expect } from 'vitest';
import {
  extraerTokenSesion,
  verificarOrigenCsrf,
  crearCookieSesionHeader,
  borrarCookieSesionHeader,
  requerirUsuario,
} from '../../src/lib/auth-servidor';
import { ErrorNoAutenticado, ErrorNoAutorizado } from '../../src/lib/errores';
import type { AuthAdminLike } from '../../src/lib/firebase-admin';

describe('Autenticación de Servidor y Protección CSRF (Sección 9.1)', () => {
  it('extraerTokenSesion extrae correctamente la cookie de sesión', () => {
    const req = new Request('http://localhost:3000/api/auth/yo', {
      headers: { cookie: 'tema=oscuro; sesion=cookie_secreta_123; otra=1' },
    });
    const extraido = extraerTokenSesion(req);
    expect(extraido).toEqual({ tipo: 'cookie', token: 'cookie_secreta_123' });
  });

  it('extraerTokenSesion extrae token Bearer de la cabecera Authorization', () => {
    const req = new Request('http://localhost:3000/api/auth/yo', {
      headers: { authorization: 'Bearer token_jwt_abc' },
    });
    const extraido = extraerTokenSesion(req);
    expect(extraido).toEqual({ tipo: 'bearer', token: 'token_jwt_abc' });
  });

  it('extraerTokenSesion retorna null si no hay cookie ni Bearer', () => {
    const req = new Request('http://localhost:3000/api/auth/yo');
    expect(extraerTokenSesion(req)).toBeNull();
  });

  it('verificarOrigenCsrf no bloquea peticiones GET', () => {
    const req = new Request('http://localhost:3000/api/ciudades', { method: 'GET' });
    expect(() => verificarOrigenCsrf(req)).not.toThrow();
  });

  it('verificarOrigenCsrf permite POST cuando Origin coincide', () => {
    const req = new Request('http://localhost:3000/api/ciudades', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(() => verificarOrigenCsrf(req)).not.toThrow();
  });

  it('verificarOrigenCsrf lanza ErrorNoAutorizado (403) ante discrepancia de Origin', () => {
    const req = new Request('http://localhost:3000/api/ciudades', {
      method: 'POST',
      headers: { origin: 'http://sitio-malicioso.com' },
    });
    expect(() => verificarOrigenCsrf(req)).toThrow(ErrorNoAutorizado);
  });

  it('verificarOrigenCsrf rechaza petición con cookie si faltan Origin y Referer', () => {
    const req = new Request('http://localhost:3000/api/ciudades', {
      method: 'POST',
      headers: { cookie: 'sesion=cookie_activa' },
    });
    expect(() => verificarOrigenCsrf(req)).toThrow(ErrorNoAutorizado);
  });

  it('crearCookieSesionHeader formatea los flags HttpOnly, SameSite=Lax y Max-Age', () => {
    const header = crearCookieSesionHeader('token_123', 432000, false);
    expect(header).toContain('sesion=token_123');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Max-Age=432000');
  });

  it('borrarCookieSesionHeader formatea la cookie expirada y añade Secure en producción', () => {
    const headerDev = borrarCookieSesionHeader(false);
    expect(headerDev).toContain('sesion=');
    expect(headerDev).toContain('Max-Age=0');
    expect(headerDev).not.toContain('Secure');

    const headerProd = borrarCookieSesionHeader(true);
    expect(headerProd).toContain('Secure');
  });

  it('requerirUsuario autentica exitosamente mediante cookie verificada', async () => {
    const mockAuthAdmin: AuthAdminLike = {
      async createSessionCookie() {
        return 'cookie';
      },
      async verifySessionCookie(cookie) {
        if (cookie === 'cookie_valida') {
          return { uid: 'usr_abc', email: 'test@example.com', rol: 'usuario' };
        }
        throw new Error('Invalida');
      },
      async verifyIdToken() {
        return { uid: 'usr_id', email: 'id@example.com' };
      },
      async revokeRefreshTokens() {},
    };

    const req = new Request('http://localhost:3000/api/auth/yo', {
      headers: { cookie: 'sesion=cookie_valida' },
    });

    const usuario = await requerirUsuario(req, mockAuthAdmin);
    expect(usuario.uid).toBe('usr_abc');
    expect(usuario.correo).toBe('test@example.com');
    expect(usuario.rol).toBe('usuario');
  });

  it('requerirUsuario lanza ErrorNoAutenticado (401) si falta token o es inválido', async () => {
    const reqSinSesion = new Request('http://localhost:3000/api/auth/yo');
    await expect(requerirUsuario(reqSinSesion)).rejects.toThrow(ErrorNoAutenticado);
  });
});
