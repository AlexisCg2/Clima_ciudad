import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="contenedor-principal" style={{ marginTop: '3rem', textAlign: 'center' }}>
      <div className="tarjeta" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <span aria-hidden="true" style={{ fontSize: '3rem' }}>
          🧭
        </span>
        <h1 style={{ fontSize: '1.75rem', marginTop: '1rem' }}>Página no encontrada (404)</h1>
        <p style={{ color: 'var(--texto-secundario)', margin: '1rem auto' }}>
          La ruta que intenta consultar no existe o ha sido movida.
        </p>
        <Link href="/" className="boton-primario" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
