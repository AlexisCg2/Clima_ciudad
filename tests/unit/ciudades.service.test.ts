import { describe, it, expect } from 'vitest';
import { CiudadesService, RepositorioCiudadesMemoria } from '../../src/services/ciudades.service';
import { ClienteOpenMeteo } from '../../src/lib/open-meteo';
import { ErrorConflicto, ErrorRecursoNoEncontrado, ErrorValidacion } from '../../src/lib/errores';

describe('Servicio de Dominio CiudadesService (RF-01, RF-04 y Límite de 10 Favoritas)', () => {
  it('buscar rechaza términos con menos de 2 caracteres', async () => {
    const cliente = new ClienteOpenMeteo();
    const servicio = new CiudadesService(cliente);
    await expect(servicio.buscar('a')).rejects.toThrow(ErrorValidacion);
  });

  it('permite agregar hasta 10 ciudades favoritas por usuario', async () => {
    const cliente = new ClienteOpenMeteo();
    const repo = new RepositorioCiudadesMemoria();
    const servicio = new CiudadesService(cliente, repo);

    const uid = 'usr_123';

    // Agrega 10 ciudades
    for (let i = 1; i <= 10; i++) {
      const agregada = await servicio.agregarFavorita(uid, {
        nombre: `Ciudad ${i}`,
        pais: 'País de Prueba',
        lat: i,
        lng: i,
      });
      expect(agregada.id).toBeDefined();
      expect(agregada.nombre).toBe(`Ciudad ${i}`);
    }

    const favoritas = await servicio.listarFavoritas(uid);
    expect(favoritas).toHaveLength(10);
  });

  it('lanza ErrorConflicto (HTTP 409) al intentar agregar la ciudad favorita número 11', async () => {
    const cliente = new ClienteOpenMeteo();
    const repo = new RepositorioCiudadesMemoria();
    const servicio = new CiudadesService(cliente, repo);

    const uid = 'usr_limite';

    for (let i = 1; i <= 10; i++) {
      await servicio.agregarFavorita(uid, {
        nombre: `Ciudad ${i}`,
        pais: 'País',
        lat: i,
        lng: i,
      });
    }

    // Intento número 11
    await expect(
      servicio.agregarFavorita(uid, {
        nombre: 'Ciudad Excedente',
        pais: 'País',
        lat: 11,
        lng: 11,
      })
    ).rejects.toThrow(ErrorConflicto);
  });

  it('lanza ErrorConflicto al intentar agregar una ciudad duplicada', async () => {
    const cliente = new ClienteOpenMeteo();
    const repo = new RepositorioCiudadesMemoria();
    const servicio = new CiudadesService(cliente, repo);

    const uid = 'usr_duplicado';
    await servicio.agregarFavorita(uid, {
      nombre: 'Medellín',
      pais: 'Colombia',
      lat: 6.2442,
      lng: -75.5812,
    });

    await expect(
      servicio.agregarFavorita(uid, {
        nombre: 'Medellín',
        pais: 'Colombia',
        lat: 6.2442,
        lng: -75.5812,
      })
    ).rejects.toThrow(ErrorConflicto);
  });

  it('eliminarFavorita remueve la ciudad existente', async () => {
    const cliente = new ClienteOpenMeteo();
    const repo = new RepositorioCiudadesMemoria();
    const servicio = new CiudadesService(cliente, repo);

    const uid = 'usr_eliminar';
    const fav = await servicio.agregarFavorita(uid, {
      nombre: 'Cali',
      pais: 'Colombia',
      lat: 3.4516,
      lng: -76.532,
    });

    await servicio.eliminarFavorita(uid, fav.id);
    const lista = await servicio.listarFavoritas(uid);
    expect(lista).toHaveLength(0);
  });

  it('eliminarFavorita lanza ErrorRecursoNoEncontrado ante ID inexistente', async () => {
    const cliente = new ClienteOpenMeteo();
    const repo = new RepositorioCiudadesMemoria();
    const servicio = new CiudadesService(cliente, repo);

    await expect(servicio.eliminarFavorita('usr_123', 'id_fantasma')).rejects.toThrow(
      ErrorRecursoNoEncontrado
    );
  });
});
