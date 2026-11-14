/**
 * Tipos de dominio para el módulo de clima (Open-Meteo)
 * Cumple con RF-02, RF-03, RF-06 y la especificación de cacheClima/{lat2_lng2}.
 */

export type UnidadTemperatura = 'celsius' | 'fahrenheit';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface CondicionClimatica {
  codigoWmo: number;
  descripcion: string;
  icono: string;
}

export interface PronosticoHora {
  hora: string; // ISO 8601 UTC
  temperaturaCelsius: number;
  temperaturaFahrenheit: number;
  sensacionTermicaCelsius: number;
  sensacionTermicaFahrenheit: number;
  codigoWmo: number;
  descripcion: string;
  probabilidadPrecipitacion: number; // Porcentaje 0 - 100
  humedadRelativa: number; // Porcentaje 0 - 100
  velocidadVientoKmH: number;
}

export interface PronosticoDia {
  fecha: string; // Formato YYYY-MM-DD
  temperaturaMinCelsius: number;
  temperaturaMaxCelsius: number;
  temperaturaMinFahrenheit: number;
  temperaturaMaxFahrenheit: number;
  codigoWmo: number;
  descripcion: string;
  probabilidadPrecipitacionMax: number; // Porcentaje 0 - 100
  amanecer: string; // ISO 8601 UTC
  atardecer: string; // ISO 8601 UTC
}

export interface DatosClima {
  coordenadas: Coordenadas;
  zonaHoraria: string;
  temperaturaActualCelsius: number;
  temperaturaActualFahrenheit: number;
  sensacionTermicaCelsius: number;
  sensacionTermicaFahrenheit: number;
  humedadRelativa: number;
  velocidadVientoKmH: number;
  codigoWmo: number;
  descripcion: string;
  icono: string;
  pronostico24Horas: PronosticoHora[];
  pronostico7Dias: PronosticoDia[];
  obtenidoEn: string; // ISO 8601 UTC
  desdeCache: boolean;
  antiguedadMinutos: number;
}

export interface EntradaCacheClima {
  datos: DatosClima;
  obtenidoEn: string; // ISO 8601 UTC
}
