/**
 * Tipos de dominio para autenticación y sesiones
 * Cumple con la sección 9.1 del contrato de API REST con Firebase Auth y Session Cookies.
 */

export type RolUsuario = 'usuario' | 'admin';

export interface UsuarioSesion {
  uid: string;
  correo: string;
  rol: RolUsuario;
}

export interface RespuestaYo {
  usuario: UsuarioSesion;
}

export interface EntradaSesion {
  idToken: string;
}
