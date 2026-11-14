'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UnidadTemperatura } from '../types/clima';

const CLAVE_ALMACENAMIENTO = 'clima_unidad_temp';

/**
 * Hook para administrar y persistir la preferencia de unidad de temperatura (°C o °F).
 * Cumple con RF-03 y el criterio de aceptación 3 ("la preferencia se recuerda").
 * Soporta inicialización desde URL (?unidad=c o ?unidad=f) y persistencia en localStorage.
 */
export function usePreferenciaUnidad(unidadInicial: UnidadTemperatura = 'celsius'): {
  unidad: UnidadTemperatura;
  cambiarUnidad: (nuevaUnidad: UnidadTemperatura) => void;
  alternarUnidad: () => void;
} {
  const [unidad, setUnidad] = useState<UnidadTemperatura>(unidadInicial);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 1. Prioridad: Parámetro en URL (?unidad=c o ?unidad=f)
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('unidad')?.toLowerCase();
    if (param === 'f' || param === 'fahrenheit') {
      setUnidad('fahrenheit');
      return;
    }
    if (param === 'c' || param === 'celsius') {
      setUnidad('celsius');
      return;
    }

    // 2. Persistencia en localStorage
    try {
      const guardada = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (guardada === 'fahrenheit' || guardada === 'celsius') {
        setUnidad(guardada);
      }
    } catch {
      // Ignorar fallos de almacenamiento en entornos restringidos
    }
  }, []);

  const cambiarUnidad = useCallback((nuevaUnidad: UnidadTemperatura): void => {
    setUnidad(nuevaUnidad);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO, nuevaUnidad);
      } catch {
        // Ignorar
      }
    }
  }, []);

  const alternarUnidad = useCallback((): void => {
    setUnidad((prev) => {
      const siguiente: UnidadTemperatura = prev === 'celsius' ? 'fahrenheit' : 'celsius';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CLAVE_ALMACENAMIENTO, siguiente);
        } catch {
          // Ignorar
        }
      }
      return siguiente;
    });
  }, []);

  return { unidad, cambiarUnidad, alternarUnidad };
}
