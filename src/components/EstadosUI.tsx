'use client';

import React from 'react';

/**
 * Componente de estado de carga con animación accesible.
 * Cumple con WCAG 2.2 AA (anuncio aria-busy y texto para lectores de pantalla).
 */
export function EsqueletoCarga({ mensaje = 'Cargando información meteorológica...' }: { mensaje?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={mensaje}
      className="tarjeta"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--borde-suave)',
          borderTopColor: 'var(--color-primario)',
          borderRadius: '50%',
          animation: 'giro 1s linear infinite',
        }}
        aria-hidden="true"
      />
      <p style={{ color: 'var(--texto-secundario)', fontWeight: 500 }}>{mensaje}</p>
      <span className="sr-only">Por favor espere mientras se obtienen los datos.</span>
      <style>{`
        @keyframes giro {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Componente de estado de error accesible con botón de reintento.
 * Cumple con el criterio de aceptación 4 (Reintento ante fallos de API).
 */
export function EstadoError({
  mensaje = 'Ocurrió un error al obtener los datos meteorológicos',
  onReintentar,
}: {
  mensaje?: string;
  onReintentar?: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="tarjeta"
      style={{
        borderLeft: '4px solid var(--color-peligro)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>
          ⚠️
        </span>
        <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-peligro)' }}>
          No fue posible cargar el clima
        </h2>
      </div>
      <p style={{ margin: 0, color: 'var(--texto-principal)' }}>{mensaje}</p>
      {onReintentar && (
        <div>
          <button
            type="button"
            onClick={onReintentar}
            className="boton-primario"
            style={{ minHeight: '44px' }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de estado vacío cuando no hay registros o resultados.
 */
export function EstadoVacio({
  titulo = 'No hay datos disponibles',
  descripcion = 'No se encontraron resultados para la consulta realizada.',
  accion,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={titulo}
      className="tarjeta"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>
        🏙️
      </span>
      <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{titulo}</h2>
      <p style={{ color: 'var(--texto-atenuado)', margin: 0 }}>{descripcion}</p>
      {accion && <div style={{ marginTop: '0.5rem' }}>{accion}</div>}
    </div>
  );
}
