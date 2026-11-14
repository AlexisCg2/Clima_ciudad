'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

let appCliente: FirebaseApp | null = null;
let authCliente: Auth | null = null;

/**
 * Inicializa de forma segura la instancia cliente de Firebase Web SDK.
 * Cumple con la Sección 2 y 9.1 de 09-clima-por-ciudad.md:
 * - Variables NEXT_PUBLIC_* públicas por diseño.
 * - El navegador nunca toca Firestore directamente, solo Firebase Auth.
 */
export function obtenerFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (appCliente) {
    return appCliente;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId) {
    return null;
  }

  const apps = getApps();
  appCliente =
    apps.length > 0 && apps[0]
      ? apps[0]
      : initializeApp({
          apiKey,
          authDomain,
          projectId,
          appId,
        });

  return appCliente;
}

/**
 * Obtiene el cliente de Firebase Auth en el navegador.
 */
export function obtenerAuthCliente(): Auth | null {
  if (authCliente) {
    return authCliente;
  }

  const app = obtenerFirebaseApp();
  if (!app) {
    return null;
  }

  authCliente = getAuth(app);
  return authCliente;
}

/**
 * Inicia sesión con correo y contraseña, obtiene el idToken de Firebase
 * y lo intercambia con /api/auth/sesion para establecer la cookie HttpOnly.
 */
export async function iniciarSesion(correo: string, contrasena: string): Promise<User> {
  const auth = obtenerAuthCliente();
  if (!auth) {
    throw new Error('Firebase Auth no está configurado con variables NEXT_PUBLIC_FIREBASE_*');
  }

  const credencial = await signInWithEmailAndPassword(auth, correo, contrasena);
  const idToken = await credencial.user.getIdToken(true);

  const res = await fetch('/api/auth/sesion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errorData.error || 'Error al establecer la sesión en el servidor');
  }

  return credencial.user;
}

/**
 * Registra un nuevo usuario con correo y contraseña, e inicia la sesión HttpOnly.
 */
export async function registrarUsuario(correo: string, contrasena: string): Promise<User> {
  const auth = obtenerAuthCliente();
  if (!auth) {
    throw new Error('Firebase Auth no está configurado con variables NEXT_PUBLIC_FIREBASE_*');
  }

  const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);
  const idToken = await credencial.user.getIdToken(true);

  const res = await fetch('/api/auth/sesion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errorData.error || 'Error al establecer la sesión en el servidor');
  }

  return credencial.user;
}

/**
 * Cierra la sesión activa en el servidor y en Firebase Auth.
 */
export async function cerrarSesion(): Promise<void> {
  try {
    await fetch('/api/auth/sesion', {
      method: 'DELETE',
    });
  } catch {
    // Continuar para cerrar sesión en cliente
  }

  const auth = obtenerAuthCliente();
  if (auth) {
    await firebaseSignOut(auth);
  }
}

/**
 * Suscriptor a los cambios de estado de autenticación en el cliente.
 */
export function escucharCambiosAuth(callback: (usuario: User | null) => void): () => void {
  const auth = obtenerAuthCliente();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
