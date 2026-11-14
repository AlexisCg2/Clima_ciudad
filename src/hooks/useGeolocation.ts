'use client';

import { useState, useCallback } from 'react';
import type { Coordenadas } from '../types/clima';

export interface EstadoGeolocalizacion {
  coordenadas: Coordenadas | null;
  cargando: boolean;
  error: string | null;
  denegado: boolean;
  disponible: boolean;
}

/**
 * Hook para solicitar y gestionar la ubicación geográfica del usuario bajo demanda.
 * Cumple con RF-05 y la Sección 5 (Mejora progresiva: permiso solicitado bajo acción explícita).
 */
export function useGeolocation(): EstadoGeolocalizacion & {
  solicitarUbicacion: () => Promise<Coordenadas | null>;
} {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [denegado, setDenegado] = useState<boolean>(false);

  const disponible = typeof window !== 'undefined' && 'geolocation' in navigator;

  const solicitarUbicacion = useCallback(async (): Promise<Coordenadas | null> => {
    if (!disponible) {
      setError('La geolocalización no está disponible en este navegador');
      return null;
    }

    setCargando(true);
    setError(null);
    setDenegado(false);

    return new Promise<Coordenadas | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const nuevasCoords: Coordenadas = {
            lat: posicion.coords.latitude,
            lng: posicion.coords.longitude,
          };
          setCoordenadas(nuevasCoords);
          setCargando(false);
          resolve(nuevasCoords);
        },
        (err) => {
          setCargando(false);
          if (err.code === err.PERMISSION_DENIED) {
            setDenegado(true);
            setError('Permiso de ubicación denegado. Puede buscar su ciudad manualmente.');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setError('La información de ubicación no está disponible en este momento.');
          } else if (err.code === err.TIMEOUT) {
            setError('Se agotó el tiempo para obtener la ubicación.');
          } else {
            setError('No fue posible obtener su ubicación.');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos de caché en navegador
        }
      );
    });
  }, [disponible]);

  return {
    coordenadas,
    cargando,
    error,
    denegado,
    disponible,
    solicitarUbicacion,
  };
}
