import { ErrorConflicto, ErrorRecursoNoEncontrado, ErrorValidacion } from '../lib/errores';
import { ClienteOpenMeteo } from '../lib/open-meteo';
import {
  LIMITE_MAXIMO_CIUDADES_FAVORITAS,
  type CiudadFavorita,
  type CiudadSugerida,
  type EntradaCrearCiudadFavorita,
} from '../types/ciudad';

/**
 * Puerto (interfaz) para el repositorio de persistencia de ciudades favoritas.
 * Cumple con la arquitectura por capas estricta de AGENTS.md.
 */
export interface IRepositorioCiudades {
  listar(uid: string): Promise<CiudadFavorita[]>;
  obtenerPorId(uid: string, ciudadId: string): Promise<CiudadFavorita | null>;
  guardar(uid: string, datos: EntradaCrearCiudadFavorita): Promise<CiudadFavorita>;
  eliminar(uid: string, ciudadId: string): Promise<void>;
  contar(uid: string): Promise<number>;
}

/**
 * Implementación en memoria del repositorio de ciudades para pruebas unitarias.
 */
export class RepositorioCiudadesMemoria implements IRepositorioCiudades {
  private readonly datos = new Map<string, CiudadFavorita[]>();

  public async listar(uid: string): Promise<CiudadFavorita[]> {
    const lista = this.datos.get(uid) ?? [];
    return [...lista];
  }

  public async obtenerPorId(uid: string, ciudadId: string): Promise<CiudadFavorita | null> {
    const lista = this.datos.get(uid) ?? [];
    const encontrada = lista.find((c) => c.id === ciudadId);
    return encontrada ? { ...encontrada } : null;
  }

  public async guardar(uid: string, datos: EntradaCrearCiudadFavorita): Promise<CiudadFavorita> {
    const lista = this.datos.get(uid) ?? [];
    const nueva: CiudadFavorita = {
      id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nombre: datos.nombre,
      pais: datos.pais,
      lat: datos.lat,
      lng: datos.lng,
      agregadaEn: new Date().toISOString(),
    };
    lista.push(nueva);
    this.datos.set(uid, lista);
    return { ...nueva };
  }

  public async eliminar(uid: string, ciudadId: string): Promise<void> {
    const lista = this.datos.get(uid) ?? [];
    const filtrada = lista.filter((c) => c.id !== ciudadId);
    this.datos.set(uid, filtrada);
  }

  public async contar(uid: string): Promise<number> {
    const lista = this.datos.get(uid) ?? [];
    return lista.length;
  }

  public limpiar(): void {
    this.datos.clear();
  }
}

/**
 * Servicio de dominio para búsqueda y gestión de ciudades favoritas.
 * Aplica reglas de negocio: búsqueda [2, 60] caracteres y límite de 10 favoritas.
 */
export class CiudadesService {
  private readonly clienteOpenMeteo: ClienteOpenMeteo;
  private readonly repositorio?: IRepositorioCiudades;

  constructor(clienteOpenMeteo: ClienteOpenMeteo, repositorio?: IRepositorioCiudades) {
    this.clienteOpenMeteo = clienteOpenMeteo;
    this.repositorio = repositorio;
  }

  /**
   * Busca ciudades por nombre en el servicio geográfico.
   *
   * @param termino Texto de búsqueda (2 a 60 caracteres).
   * @param limite Cantidad máxima de resultados.
   */
  public async buscar(termino: string, limite = 10): Promise<CiudadSugerida[]> {
    const limpio = termino.trim();
    if (limpio.length < 2 || limpio.length > 60) {
      throw new ErrorValidacion('El texto de búsqueda debe tener entre 2 y 60 caracteres');
    }
    return this.clienteOpenMeteo.buscarCiudades(limpio, limite);
  }

  /**
   * Lista las ciudades favoritas del usuario autenticado.
   */
  public async listarFavoritas(uid: string): Promise<CiudadFavorita[]> {
    if (!this.repositorio) {
      throw new Error('Repositorio de ciudades no configurado');
    }
    return this.repositorio.listar(uid);
  }

  /**
   * Agrega una nueva ciudad favorita aplicando la regla de límite máximo de 10.
   */
  public async agregarFavorita(
    uid: string,
    datos: EntradaCrearCiudadFavorita
  ): Promise<CiudadFavorita> {
    if (!this.repositorio) {
      throw new Error('Repositorio de ciudades no configurado');
    }

    if (!datos.nombre.trim()) {
      throw new ErrorValidacion('El nombre de la ciudad es obligatorio');
    }
    if (!datos.pais.trim()) {
      throw new ErrorValidacion('El país es obligatorio');
    }
    if (!Number.isFinite(datos.lat) || datos.lat < -90 || datos.lat > 90) {
      throw new ErrorValidacion('La latitud debe ser un número válido entre -90 y 90');
    }
    if (!Number.isFinite(datos.lng) || datos.lng < -180 || datos.lng > 180) {
      throw new ErrorValidacion('La longitud debe ser un número válido entre -180 y 180');
    }

    const totalActual = await this.repositorio.contar(uid);
    if (totalActual >= LIMITE_MAXIMO_CIUDADES_FAVORITAS) {
      throw new ErrorConflicto(
        `Ha alcanzado el límite máximo de ${LIMITE_MAXIMO_CIUDADES_FAVORITAS} ciudades favoritas`
      );
    }

    // Comprobar si ya existe una favorita en la misma ubicación
    const existentes = await this.repositorio.listar(uid);
    const duplicada = existentes.find(
      (c) =>
        c.nombre.toLowerCase() === datos.nombre.trim().toLowerCase() &&
        Math.abs(c.lat - datos.lat) < 0.01 &&
        Math.abs(c.lng - datos.lng) < 0.01
    );

    if (duplicada) {
      throw new ErrorConflicto('Esta ciudad ya se encuentra en su lista de favoritos');
    }

    return this.repositorio.guardar(uid, {
      nombre: datos.nombre.trim(),
      pais: datos.pais.trim(),
      lat: datos.lat,
      lng: datos.lng,
    });
  }

  /**
   * Elimina una ciudad favorita por su identificador.
   */
  public async eliminarFavorita(uid: string, ciudadId: string): Promise<void> {
    if (!this.repositorio) {
      throw new Error('Repositorio de ciudades no configurado');
    }
    const existente = await this.repositorio.obtenerPorId(uid, ciudadId);
    if (!existente) {
      throw new ErrorRecursoNoEncontrado('La ciudad favorita que intenta eliminar no existe');
    }
    await this.repositorio.eliminar(uid, ciudadId);
  }
}
