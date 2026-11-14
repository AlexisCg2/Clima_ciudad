import { celsiusAFahrenheit } from '../lib/temperatura';
import { obtenerCondicionWmo } from '../lib/wmo';
import { normalizarClaveCache, esCacheValido, calcularAntiguedadMinutos } from '../lib/cache-reglas';
import { ErrorValidacion } from '../lib/errores';
import { ClienteOpenMeteo, type RespuestaOpenMeteoClima } from '../lib/open-meteo';
import type { DatosClima, EntradaCacheClima, PronosticoDia, PronosticoHora } from '../types/clima';

/**
 * Puerto (interfaz) para el repositorio de caché de clima.
 * Cumple con la arquitectura por capas estricta de AGENTS.md.
 */
export interface IRepositorioCacheClima {
  obtener(clave: string): Promise<EntradaCacheClima | null>;
  guardar(clave: string, entrada: EntradaCacheClima): Promise<void>;
}

/**
 * Implementación de caché en memoria para pruebas y respaldo volátil.
 */
export class RepositorioCacheMemoria implements IRepositorioCacheClima {
  private readonly mapa = new Map<string, EntradaCacheClima>();

  public async obtener(clave: string): Promise<EntradaCacheClima | null> {
    const entrada = this.mapa.get(clave);
    return entrada ? { ...entrada } : null;
  }

  public async guardar(clave: string, entrada: EntradaCacheClima): Promise<void> {
    this.mapa.set(clave, { ...entrada });
  }

  public limpiar(): void {
    this.mapa.clear();
  }
}

/**
 * Servicio de dominio para gestión y consulta del clima.
 * Aplica caché compartida (15 min), normalización a 2 decimales y conversión de unidades.
 */
export class ClimaService {
  private readonly cliente: ClienteOpenMeteo;
  private readonly cacheRepositorio?: IRepositorioCacheClima;

  constructor(cliente: ClienteOpenMeteo, cacheRepositorio?: IRepositorioCacheClima) {
    this.cliente = cliente;
    this.cacheRepositorio = cacheRepositorio;
  }

  /**
   * Obtiene los datos meteorológicos completos para unas coordenadas geográficas.
   * Consulta primero la caché; si expiró o no existe, invoca al conector de Open-Meteo.
   *
   * @param lat Latitud (-90 a 90).
   * @param lng Longitud (-180 a 180).
   * @param fechaActual Fecha de referencia para evaluación de expiración.
   */
  public async obtenerClima(
    lat: number,
    lng: number,
    fechaActual: Date = new Date()
  ): Promise<DatosClima> {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new ErrorValidacion('La latitud debe ser un número finito entre -90 y 90');
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new ErrorValidacion('La longitud debe ser un número finito entre -180 y 180');
    }

    const claveCache = normalizarClaveCache(lat, lng);

    // 1. Intento de lectura desde la capa de caché
    if (this.cacheRepositorio) {
      const cacheado = await this.cacheRepositorio.obtener(claveCache);
      if (cacheado && esCacheValido(cacheado.obtenidoEn, fechaActual)) {
        const antiguedad = calcularAntiguedadMinutos(cacheado.obtenidoEn, fechaActual);
        return {
          ...cacheado.datos,
          desdeCache: true,
          antiguedadMinutos: antiguedad,
        };
      }
    }

    // 2. Consulta al servicio externo Open-Meteo
    const raw = await this.cliente.consultarPronostico(lat, lng);

    // 3. Transformación y enriquecimiento de datos de dominio
    const ahoraIso = fechaActual.toISOString();
    const datosNormalizados = this.mapearRespuestaADominio(raw, lat, lng, ahoraIso);

    // 4. Guardado en caché
    if (this.cacheRepositorio) {
      await this.cacheRepositorio.guardar(claveCache, {
        datos: datosNormalizados,
        obtenidoEn: ahoraIso,
      });
    }

    return datosNormalizados;
  }

  /**
   * Mapea la estructura cruda de Open-Meteo al modelo enriquecido de dominio DatosClima.
   */
  private mapearRespuestaADominio(
    raw: RespuestaOpenMeteoClima,
    latOriginal: number,
    lngOriginal: number,
    obtenidoEnIso: string
  ): DatosClima {
    const condicionActual = obtenerCondicionWmo(raw.current.weather_code);
    const tempCelsius = raw.current.temperature_2m;
    const sensCelsius = raw.current.apparent_temperature;

    // Próximas 24 horas a partir del índice actual o primeras 24
    const totalHorasDisponibles = raw.hourly.time.length;
    const limiteHoras = Math.min(24, totalHorasDisponibles);
    const pronostico24Horas: PronosticoHora[] = [];

    for (let i = 0; i < limiteHoras; i++) {
      const horaStr = raw.hourly.time[i] ?? '';
      const tCelsius = raw.hourly.temperature_2m[i] ?? 0;
      const sCelsius = raw.hourly.apparent_temperature[i] ?? tCelsius;
      const wmoCode = raw.hourly.weather_code[i] ?? 0;
      const cond = obtenerCondicionWmo(wmoCode);

      pronostico24Horas.push({
        hora: horaStr,
        temperaturaCelsius: tCelsius,
        temperaturaFahrenheit: celsiusAFahrenheit(tCelsius),
        sensacionTermicaCelsius: sCelsius,
        sensacionTermicaFahrenheit: celsiusAFahrenheit(sCelsius),
        codigoWmo: wmoCode,
        descripcion: cond.descripcion,
        probabilidadPrecipitacion: raw.hourly.precipitation_probability[i] ?? 0,
        humedadRelativa: raw.hourly.relative_humidity_2m[i] ?? 0,
        velocidadVientoKmH: raw.hourly.wind_speed_10m[i] ?? 0,
      });
    }

    // Próximos 7 días
    const totalDiasDisponibles = raw.daily.time.length;
    const limiteDias = Math.min(7, totalDiasDisponibles);
    const pronostico7Dias: PronosticoDia[] = [];

    for (let d = 0; d < limiteDias; d++) {
      const fecha = raw.daily.time[d] ?? '';
      const minC = raw.daily.temperature_2m_min[d] ?? 0;
      const maxC = raw.daily.temperature_2m_max[d] ?? 0;
      const wmoCode = raw.daily.weather_code[d] ?? 0;
      const cond = obtenerCondicionWmo(wmoCode);

      pronostico7Dias.push({
        fecha,
        temperaturaMinCelsius: minC,
        temperaturaMaxCelsius: maxC,
        temperaturaMinFahrenheit: celsiusAFahrenheit(minC),
        temperaturaMaxFahrenheit: celsiusAFahrenheit(maxC),
        codigoWmo: wmoCode,
        descripcion: cond.descripcion,
        probabilidadPrecipitacionMax: raw.daily.precipitation_probability_max[d] ?? 0,
        amanecer: raw.daily.sunrise[d] ?? '',
        atardecer: raw.daily.sunset[d] ?? '',
      });
    }

    return {
      coordenadas: {
        lat: Number(latOriginal.toFixed(4)),
        lng: Number(lngOriginal.toFixed(4)),
      },
      zonaHoraria: raw.timezone,
      temperaturaActualCelsius: tempCelsius,
      temperaturaActualFahrenheit: celsiusAFahrenheit(tempCelsius),
      sensacionTermicaCelsius: sensCelsius,
      sensacionTermicaFahrenheit: celsiusAFahrenheit(sensCelsius),
      humedadRelativa: raw.current.relative_humidity_2m,
      velocidadVientoKmH: raw.current.wind_speed_10m,
      codigoWmo: raw.current.weather_code,
      descripcion: condicionActual.descripcion,
      icono: condicionActual.icono,
      pronostico24Horas,
      pronostico7Dias,
      obtenidoEn: obtenidoEnIso,
      desdeCache: false,
      antiguedadMinutos: 0,
    };
  }
}
