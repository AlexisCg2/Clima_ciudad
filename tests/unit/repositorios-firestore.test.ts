import { describe, it, expect } from 'vitest';
import { mapearDocumentoCache } from '../../src/repositories/cache-clima.repository';
import { mapearDocumentoCiudad, RepositorioCiudadesFirestore } from '../../src/repositories/ciudades.repository';
import { ErrorConflicto } from '../../src/lib/errores';
import type { FirestoreAdminLike } from '../../src/lib/firebase-admin';

describe('Lógica de Repositorios Firestore (Sección 9.3 y Transacciones Atómicas)', () => {
  it('mapearDocumentoCache deserializa documentos válidos y descarta datos corruptos', () => {
    const rawValido = {
      obtenidoEn: '2026-11-14T12:00:00.000Z',
      datos: { temperaturaActualCelsius: 22 },
    };
    const mapeado = mapearDocumentoCache(rawValido);
    expect(mapeado).not.toBeNull();
    expect(mapeado?.obtenidoEn).toBe('2026-11-14T12:00:00.000Z');

    expect(mapearDocumentoCache(null)).toBeNull();
    expect(mapearDocumentoCache({})).toBeNull();
    expect(mapearDocumentoCache({ obtenidoEn: 123 })).toBeNull();
  });

  it('mapearDocumentoCiudad mapea campos obligatorios y descarta datos inconsistentes', () => {
    const rawValido = {
      nombre: 'Bogotá',
      pais: 'Colombia',
      lat: 4.6097,
      lng: -74.0817,
      agregadaEn: '2026-11-14T12:00:00.000Z',
    };
    const mapeada = mapearDocumentoCiudad('fav_1', rawValido);
    expect(mapeada).toEqual({
      id: 'fav_1',
      nombre: 'Bogotá',
      pais: 'Colombia',
      lat: 4.6097,
      lng: -74.0817,
      agregadaEn: '2026-11-14T12:00:00.000Z',
    });

    expect(mapearDocumentoCiudad('fav_2', { nombre: 'Incompleto' })).toBeNull();
  });

  it('RepositorioCiudadesFirestore garantiza límite de 10 favoritas en transacción atómica', async () => {
    // Mock de Firestore con 10 documentos ya existentes
    const diezDocs = Array.from({ length: 10 }, (_, i) => ({
      id: `doc_${i}`,
      data: () => ({
        nombre: `Ciudad ${i}`,
        pais: 'Pais',
        lat: i,
        lng: i,
        agregadaEn: new Date().toISOString(),
      }),
    }));

    const mockFirestore: FirestoreAdminLike = {
      collection() {
        return {
          doc() {
            return { id: 'nuevo_id' };
          },
        };
      },
      async runTransaction<T>(updateFunction: (transaction: unknown) => Promise<T>): Promise<T> {
        const transaccionMock = {
          async get() {
            return { docs: diezDocs };
          },
          set() {},
        };
        return updateFunction(transaccionMock);
      },
    };

    const repo = new RepositorioCiudadesFirestore(mockFirestore);

    await expect(
      repo.guardar('usr_123', {
        nombre: 'Ciudad Excedente 11',
        pais: 'Colombia',
        lat: 5.0,
        lng: -75.0,
      })
    ).rejects.toThrow(ErrorConflicto);
  });

  it('RepositorioCiudadesFirestore detecta duplicados en transacción y aborta con ErrorConflicto', async () => {
    const unDocExistente = [
      {
        id: 'doc_existente',
        data: () => ({
          nombre: 'Medellín',
          pais: 'Colombia',
          lat: 6.2442,
          lng: -75.5812,
          agregadaEn: new Date().toISOString(),
        }),
      },
    ];

    const mockFirestore: FirestoreAdminLike = {
      collection() {
        return {
          doc() {
            return { id: 'nuevo_id' };
          },
        };
      },
      async runTransaction<T>(updateFunction: (transaction: unknown) => Promise<T>): Promise<T> {
        const transaccionMock = {
          async get() {
            return { docs: unDocExistente };
          },
          set() {},
        };
        return updateFunction(transaccionMock);
      },
    };

    const repo = new RepositorioCiudadesFirestore(mockFirestore);

    await expect(
      repo.guardar('usr_123', {
        nombre: 'Medellín',
        pais: 'Colombia',
        lat: 6.2442,
        lng: -75.5812,
      })
    ).rejects.toThrow(ErrorConflicto);
  });
});
