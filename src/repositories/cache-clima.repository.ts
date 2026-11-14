import { obtenerFirestoreAdmin, type FirestoreAdminLike } from '../lib/firebase-admin';
import type { IRepositorioCacheClima } from '../services/clima.service';
import type { DatosClima, EntradaCacheClima } from '../types/clima';

/**
 * Nombre de la colección raíz compartida en Firestore para la caché de clima.
 * Cumple con la sección 9.4: cacheClima/{lat2_lng2}
 */
export const COLECCION_CACHE_CLIMA = 'cacheClima';

/**
 * Función pura para mapear datos crudos leídos de un documento Firestore a EntradaCacheClima.
 */
export function mapearDocumentoCache(datosCrudos: unknown): EntradaCacheClima | null {
  if (!datosCrudos || typeof datosCrudos !== 'object') {
    return null;
  }
  const obj = datosCrudos as Record<string, unknown>;
  if (!obj.obtenidoEn || typeof obj.obtenidoEn !== 'string' || !obj.datos) {
    return null;
  }

  return {
    obtenidoEn: obj.obtenidoEn,
    datos: obj.datos as DatosClima,
  };
}

/**
 * Repositorio de caché de clima en Firestore mediante Firebase Admin SDK.
 * Exclusivamente para ejecución del lado del servidor.
 */
export class RepositorioCacheFirestore implements IRepositorioCacheClima {
  private readonly firestoreInyectado?: FirestoreAdminLike;

  constructor(firestoreInyectado?: FirestoreAdminLike) {
    this.firestoreInyectado = firestoreInyectado;
  }

  private async getFirestore(): Promise<FirestoreAdminLike> {
    return this.firestoreInyectado ?? (await obtenerFirestoreAdmin());
  }

  public async obtener(clave: string): Promise<EntradaCacheClima | null> {
    const firestore = await this.getFirestore();
    // Interfaz dinámica para compatibilidad con Admin SDK cuando esté instalado
    const coleccion = firestore.collection(COLECCION_CACHE_CLIMA) as {
      doc(id: string): { get(): Promise<{ exists: boolean; data(): unknown }> };
    };

    const docSnapshot = await coleccion.doc(clave).get();
    if (!docSnapshot.exists) {
      return null;
    }

    return mapearDocumentoCache(docSnapshot.data());
  }

  public async guardar(clave: string, entrada: EntradaCacheClima): Promise<void> {
    const firestore = await this.getFirestore();
    const coleccion = firestore.collection(COLECCION_CACHE_CLIMA) as {
      doc(id: string): { set(datos: unknown): Promise<void> };
    };

    await coleccion.doc(clave).set({
      datos: entrada.datos,
      obtenidoEn: entrada.obtenidoEn,
    });
  }
}
