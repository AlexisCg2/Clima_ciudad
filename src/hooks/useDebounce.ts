'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor hasta que transcurra un tiempo de inactividad.
 * Utilizado para la búsqueda de ciudades con debounce (RF-01).
 *
 * @param valor Valor reactivo a retrasar.
 * @param delayMs Tiempo de espera en milisegundos (por defecto 350 ms).
 * @returns El valor estabilizado.
 */
export function useDebounce<T>(valor: T, delayMs = 350): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setValorDebounced(valor);
    }, delayMs);

    return () => {
      clearTimeout(temporizador);
    };
  }, [valor, delayMs]);

  return valorDebounced;
}
