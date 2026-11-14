import { ErrorConflicto, ErrorRecursoNoEncontrado } from '../lib/errores';
import { obtenerFirestoreAdmin, type FirestoreAdminLike } from '../lib/firebase-admin';
import { LIMITE_MAXIMO_CIUDADES_FAVORITAS, type CiudadFavorita, type EntradaCrearCiudadFavorita } from '../types/ciudad';
import type { IRepositorioCiudades } from '../services/ciudades.service';

/**
 * Mapeador puro de datos crudos de Firestore a la interfaz de dominio CiudadFavorita.
 */
export function mapearDocumentoCiudad(id: string, data: unknown): CiudadFavorita | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const obj = data as Record<string, unknown>;
  if (
    typeof obj.nombre !== 'string' ||
    typeof obj.pais !== 'string' ||
    typeof obj.lat !== 'number' ||
    typeof obj.lng !== 'number'
  ) {
    return null;
  }

  return {
    id,
    nombre: obj.nombre,
    pais: obj.pais,
    lat: obj.lat,
    lng: obj.lng,
    agregadaEn: typeof obj.agregadaEn === 'string' ? obj.agregadaEn : new Date().toISOString(),
  };
}

interface FirestoreCollectionRefLike {
  doc(id?: string): FirestoreDocRefLike;
  get(): Promise<{ docs: Array<{ id: string; data(): unknown }> }>;
}

interface FirestoreDocRefLike {
  id: string;
  get(): Promise<{ exists: boolean; data(): unknown }>;
  delete(): Promise<void>;
  set(data: unknown): Promise<void>;
}

interface FirestoreTransactionLike {
  get(ref: unknown): Promise<{ docs?: Array<{ id: string; data(): unknown }>; exists?: boolean; data?(): unknown }>;
  set(ref: unknown, data: unknown): void;
}

/**
 * Repositorio de ciudades favoritas en Firestore mediante Firebase Admin SDK.
 * Ruta en Firestore: usuarios/{uid}/ciudades/{id} (Sección 9.4).
 * Garantiza la atomicidad del límite de 10 favoritas mediante transacciones.
 */
export class RepositorioCiudadesFirestore implements IRepositorioCiudades {
  private readonly firestoreInyectado?: FirestoreAdminLike;

  constructor(firestoreInyectado?: FirestoreAdminLike) {
    this.firestoreInyectado = firestoreInyectado;
  }

  private async getFirestore(): Promise<FirestoreAdminLike> {
    return this.firestoreInyectado ?? (await obtenerFirestoreAdmin());
  }

  private obtenerColeccionRef(firestore: FirestoreAdminLike, uid: string): FirestoreCollectionRefLike {
    return firestore.collection(`usuarios/${uid}/ciudades`) as unknown as FirestoreCollectionRefLike;
  }

  public async listar(uid: string): Promise<CiudadFavorita[]> {
    const firestore = await this.getFirestore();
    const colRef = this.obtenerColeccionRef(firestore, uid);
    const snapshot = await colRef.get();

    const resultado: CiudadFavorita[] = [];
    for (const doc of snapshot.docs) {
      const mapeada = mapearDocumentoCiudad(doc.id, doc.data());
      if (mapeada) {
        resultado.push(mapeada);
      }
    }

    return resultado;
  }

  public async obtenerPorId(uid: string, ciudadId: string): Promise<CiudadFavorita | null> {
    const firestore = await this.getFirestore();
    const colRef = this.obtenerColeccionRef(firestore, uid);
    const docRef = colRef.doc(ciudadId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return null;
    }

    return mapearDocumentoCiudad(ciudadId, docSnapshot.data());
  }

  public async contar(uid: string): Promise<number> {
    const lista = await this.listar(uid);
    return lista.length;
  }

  /**
   * Guarda una nueva ciudad favorita ejecutando una transacción atómica para
   * garantizar que no se exceda el límite de 10 ni se creen duplicados concurrentes.
   */
  public async guardar(uid: string, datos: EntradaCrearCiudadFavorita): Promise<CiudadFavorita> {
    const firestore = await this.getFirestore();
    const colRef = this.obtenerColeccionRef(firestore, uid);

    return firestore.runTransaction(async (tUntyped) => {
      const t = tUntyped as FirestoreTransactionLike;

      // 1. Lecturas antes de escrituras (Regla obligatoria de transacciones en Firestore)
      const snapshot = (await t.get(colRef)) as { docs: Array<{ id: string; data(): unknown }> };
      const docs = snapshot.docs ?? [];

      if (docs.length >= LIMITE_MAXIMO_CIUDADES_FAVORITAS) {
        throw new ErrorConflicto(
          `Ha alcanzado el límite máximo de ${LIMITE_MAXIMO_CIUDADES_FAVORITAS} ciudades favoritas`
        );
      }

      // 2. Detección de duplicados concurrentes
      for (const d of docs) {
        const existente = mapearDocumentoCiudad(d.id, d.data());
        if (
          existente &&
          existente.nombre.toLowerCase() === datos.nombre.trim().toLowerCase() &&
          Math.abs(existente.lat - datos.lat) < 0.01 &&
          Math.abs(existente.lng - datos.lng) < 0.01
        ) {
          throw new ErrorConflicto('Esta ciudad ya se encuentra en su lista de favoritos');
        }
      }

      // 3. Escritura
      const nuevoDocRef = colRef.doc();
      const nuevoDocId = nuevoDocRef.id;
      const agregadaEn = new Date().toISOString();

      const docData = {
        nombre: datos.nombre.trim(),
        pais: datos.pais.trim(),
        lat: datos.lat,
        lng: datos.lng,
        agregadaEn,
      };

      t.set(nuevoDocRef, docData);

      return {
        id: nuevoDocId,
        ...docData,
      };
    });
  }

  public async eliminar(uid: string, ciudadId: string): Promise<void> {
    const firestore = await this.getFirestore();
    const colRef = this.obtenerColeccionRef(firestore, uid);
    const docRef = colRef.doc(ciudadId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new ErrorRecursoNoEncontrado('La ciudad favorita que intenta eliminar no existe');
    }

    await docRef.delete();
  }
}
