import React from 'react';
import { EsqueletoCarga } from '../src/components/EstadosUI';

export default function Loading() {
  return (
    <div className="contenedor-principal" style={{ marginTop: '2rem' }}>
      <EsqueletoCarga mensaje="Cargando pronóstico del clima..." />
    </div>
  );
}
