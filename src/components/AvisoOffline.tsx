'use client';

import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Banner de advertencia cuando se pierde la conexión de red (Criterio 2 y Sección 5).
 * Se anuncia a lectores de pantalla mediante aria-live="polite".
 */
export function AvisoOffline() {
  const estaEnLinea = useOnlineStatus();

  if (estaEnLinea) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="banner-offline"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
    >
      <span aria-hidden="true">📡</span>
      <span>Sin conexión a internet. Mostrando los últimos datos guardados.</span>
    </div>
  );
}
