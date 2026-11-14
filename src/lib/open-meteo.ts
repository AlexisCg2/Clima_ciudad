import { ErrorServicioExterno, ErrorTimeoutServicio, ErrorValidacion } from './errores';
import type { CiudadSugerida } from '../types/ciudad';

/**
 * Interfaces para las respuestas crudas emitidas por Open-Meteo.
 */
export interface RespuestaOpenMeteoClima {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface ResultadoGeocodificacionOpenMeteo {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  timezone: string;
}

export interface RespuestaOpenMeteoGeocodificacion {
  results?: ResultadoGeocodificacionOpenMeteo[];
}

export interface OpcionesClienteOpenMeteo {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  baseUrlClima?: string;
  baseUrlGeocodificacion?: string;
}

/**
 * Cliente HTTP para Open-Meteo.
 * Utiliza fetch nativo con AbortSignal.timeout, mapeando fallos de red y tiempos a 502/504.
 */
export class ClienteOpenMeteo {
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly baseUrlClima: string;
  private readonly baseUrlGeocodificacion: string;

  constructor(opciones: OpcionesClienteOpenMeteo = {}) {
    this.timeoutMs = opciones.timeoutMs ?? 5000;
    this.fetchFn = opciones.fetchFn ?? fetch;
    this.baseUrlClima = opciones.baseUrlClima ?? 'https://api.open-meteo.com/v1/forecast';
    this.baseUrlGeocodificacion = opciones.baseUrlGeocodificacion ?? 'https://geocoding-api.open-meteo.com/v1/search';
  }

  /**
   * Ejecuta una petición HTTP protegida con timeout y mapeo de errores POSIX/HTTP.
   */
  private async ejecutarPeticion<T>(url: string): Promise<T> {
    const signal = AbortSignal.timeout(this.timeoutMs);

    try {
      const respuesta = await this.fetchFn(url, {
        signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!respuesta.ok) {
        throw new ErrorServicioExterno(
          `Open-Meteo respondió con estado HTTP ${respuesta.status} (${respuesta.statusText})`
        );
      }

      return (await respuesta.json()) as T;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          throw new ErrorTimeoutServicio(
            `El servicio externo Open-Meteo no respondió dentro del límite de ${this.timeoutMs} ms`
          );
        }
      }
      if (error instanceof ErrorServicioExterno) {
        throw error;
      }
      throw new ErrorServicioExterno(
        error instanceof Error ? error.message : 'Fallo en la comunicación de red con Open-Meteo'
      );
    }
  }

  /**
   * Consulta el pronóstico del clima actual, por horas y por días para coordenadas dadas.
   */
  public async consultarPronostico(lat: number, lng: number): Promise<RespuestaOpenMeteoClima> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new ErrorValidacion('Las coordenadas de latitud y longitud deben ser numéricas');
    }

    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,sunrise,sunset',
      timezone: 'auto',
    });

    const url = `${this.baseUrlClima}?${params.toString()}`;
    return this.ejecutarPeticion<RespuestaOpenMeteoClima>(url);
  }

  /**
   * Busca ciudades en el servicio de geocodificación de Open-Meteo.
   */
  public async buscarCiudades(termino: string, limite = 10): Promise<CiudadSugerida[]> {
    const qLimpio = termino.trim();
    if (qLimpio.length < 2 || qLimpio.length > 60) {
      throw new ErrorValidacion('El término de búsqueda debe tener entre 2 y 60 caracteres');
    }

    const params = new URLSearchParams({
      name: qLimpio,
      count: Math.min(Math.max(limite, 1), 20).toString(),
      language: 'es',
      format: 'json',
    });

    const url = `${this.baseUrlGeocodificacion}?${params.toString()}`;
    const datos = await this.ejecutarPeticion<RespuestaOpenMeteoGeocodificacion>(url);

    if (!datos.results || !Array.isArray(datos.results)) {
      return [];
    }

    return datos.results.map((r) => ({
      id: r.id,
      nombre: r.name,
      pais: r.country ?? '',
      codigoPais: r.country_code ?? '',
      region: r.admin1 ?? null,
      lat: r.latitude,
      lng: r.longitude,
      zonaHoraria: r.timezone ?? 'UTC',
    }));
  }
}
