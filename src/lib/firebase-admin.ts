import { ErrorServicioExterno } from './errores';

/**
 * Módulo de inicialización segura de Firebase Admin SDK.
 * Exclusivamente para ejecución en entorno de servidor (Route Handlers).
 *
 * Cumple con:
 * - Sección 9.1 y 9.3 de 09-clima-por-ciudad.md (Acceso restringido a Admin SDK).
 * - AGENTS.md: Prohibición de almacenar secretos o valores ficticios en código.
 * - La inicialización requiere variables de entorno en producción:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */

// Tipos estructurales para desacoplar de dependencias no instaladas
export interface FirestoreAdminLike {
  collection(path: string): unknown;
  runTransaction<T>(updateFunction: (transaction: unknown) => Promise<T>): Promise<T>;
}

export interface AuthAdminLike {
  createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string>;
  verifySessionCookie(sessionCookie: string, checkRevoked?: boolean): Promise<{ uid: string; email?: string; rol?: string }>;
  verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<{ uid: string; email?: string; rol?: string }>;
  revokeRefreshTokens(uid: string): Promise<void>;
}

let instanciaFirestore: FirestoreAdminLike | null = null;
let instanciaAuth: AuthAdminLike | null = null;

/**
 * Valida la presencia de las variables de entorno del servidor para Firebase Admin.
 * No imprime ni almacena valores de credenciales.
 */
export function verificarVariablesEntornoFirebaseAdmin(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  esEmulador: boolean;
} {
  const esEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const projectId = process.env.FIREBASE_PROJECT_ID || (esEmulador ? 'demo-clima-ciudad' : undefined);
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || (esEmulador ? 'emulator@example.com' : undefined);
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || (esEmulador ? 'none' : undefined);

  if (!projectId || !clientEmail || !privateKey) {
    throw new ErrorServicioExterno(
      'Configuración incompleta: las variables de servidor FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY son requeridas'
    );
  }

  // Normalización de saltos de línea en claves privadas de Vercel/entorno
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return { projectId, clientEmail, privateKey, esEmulador };
}

/**
 * Inyecta instancias simuladas de Firebase Admin (utilizado en pruebas unitarias).
 */
export function configurarFirebaseAdminPruebas(mocks: {
  firestore?: FirestoreAdminLike;
  auth?: AuthAdminLike;
}): void {
  if (mocks.firestore) {
    instanciaFirestore = mocks.firestore;
  }
  if (mocks.auth) {
    instanciaAuth = mocks.auth;
  }
}

/**
 * Obtiene el cliente de Firestore de Firebase Admin.
 * Lanza ErrorServicioExterno si no hay credenciales configuradas en el entorno.
 */
export async function obtenerFirestoreAdmin(): Promise<FirestoreAdminLike> {
  if (instanciaFirestore) {
    return instanciaFirestore;
  }

  // Comprobar variables de entorno antes de importar
  const credenciales = verificarVariablesEntornoFirebaseAdmin();

  try {
    // Importación dinámica para evitar fallos si el paquete no está instalado
    const adminApp = await import('firebase-admin/app');
    const adminFirestore = await import('firebase-admin/firestore');

    const apps = adminApp.getApps();
    const app =
      apps.length > 0 && apps[0]
        ? apps[0]
        : adminApp.initializeApp(
            credenciales.esEmulador
              ? { projectId: credenciales.projectId }
              : {
                  credential: adminApp.cert({
                    projectId: credenciales.projectId,
                    clientEmail: credenciales.clientEmail,
                    privateKey: credenciales.privateKey,
                  }),
                }
          );

    instanciaFirestore = adminFirestore.getFirestore(app) as unknown as FirestoreAdminLike;
    return instanciaFirestore;
  } catch (error: unknown) {
    throw new ErrorServicioExterno(
      `No se pudo inicializar Firestore Admin: ${error instanceof Error ? error.message : 'Dependencia no disponible'}`
    );
  }
}

/**
 * Obtiene el cliente de Auth de Firebase Admin.
 * Lanza ErrorServicioExterno si no hay credenciales configuradas en el entorno.
 */
export async function obtenerAuthAdmin(): Promise<AuthAdminLike> {
  if (instanciaAuth) {
    return instanciaAuth;
  }

  const credenciales = verificarVariablesEntornoFirebaseAdmin();

  try {
    const adminApp = await import('firebase-admin/app');
    const adminAuth = await import('firebase-admin/auth');

    const apps = adminApp.getApps();
    const app =
      apps.length > 0 && apps[0]
        ? apps[0]
        : adminApp.initializeApp(
            credenciales.esEmulador
              ? { projectId: credenciales.projectId }
              : {
                  credential: adminApp.cert({
                    projectId: credenciales.projectId,
                    clientEmail: credenciales.clientEmail,
                    privateKey: credenciales.privateKey,
                  }),
                }
          );

    instanciaAuth = adminAuth.getAuth(app) as unknown as AuthAdminLike;
    return instanciaAuth;
  } catch (error: unknown) {
    throw new ErrorServicioExterno(
      `No se pudo inicializar Firebase Auth Admin: ${error instanceof Error ? error.message : 'Dependencia no disponible'}`
    );
  }
}
