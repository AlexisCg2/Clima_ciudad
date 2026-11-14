'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para detectar el estado de conectividad a la red del navegador.
 * Cumple con la Sección 5 de APIs del navegador (navigator.onLine y eventos online/offline).
 *
 * @returns true si el navegador indica conexión activa, false en caso contrario.
 */
export function useOnlineStatus(): boolean {
  const [estaEnLinea, setEstaEnLinea] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const alEstarEnLinea = (): void => setEstaEnLinea(true);
    const alEstarDesconectado = (): void => setEstaEnLinea(false);

    window.addEventListener('online', alEstarEnLinea);
    window.addEventListener('offline', alEstarDesconectado);

    return () => {
      window.removeEventListener('online', alEstarEnLinea);
      window.removeEventListener('offline', alEstarDesconectado);
    };
  }, []);

  return estaEnLinea;
}
