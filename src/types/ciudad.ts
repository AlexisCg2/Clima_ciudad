/**
 * Tipos de dominio para el módulo de ciudades y búsqueda geográfica
 * Cumple con RF-01, RF-04 y la estructura de Firestore usuarios/{uid}/ciudades/{id}.
 */

/** Límite máximo de ciudades favoritas por usuario (RF-04 y Sección 8) */
export const LIMITE_MAXIMO_CIUDADES_FAVORITAS = 10;

export interface CiudadSugerida {
  id: number;
  nombre: string;
  pais: string;
  codigoPais: string;
  region: string | null;
  lat: number;
  lng: number;
  zonaHoraria: string;
}

export interface CiudadFavorita {
  id: string; // ID asignado en Firestore
  nombre: string;
  pais: string;
  lat: number;
  lng: number;
  agregadaEn: string; // ISO 8601 UTC
}

export interface EntradaCrearCiudadFavorita {
  nombre: string;
  pais: string;
  lat: number;
  lng: number;
}
