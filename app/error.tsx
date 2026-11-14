'use client';

import React, { useEffect } from 'react';
import { EstadoError } from '../src/components/EstadosUI';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Registro interno de errores para diagnóstico
  }, [error]);

  return (
    <div className="contenedor-principal" style={{ marginTop: '2rem' }}>
      <EstadoError
        mensaje={error.message || 'Ocurrió un error inesperado al procesar la solicitud meteorológica.'}
        onReintentar={reset}
      />
    </div>
  );
}
