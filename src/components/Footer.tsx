import React from 'react';

/**
 * Pie de página semántico con atribución y cumplimiento de accesibilidad.
 */
export function Footer() {
  return (
    <footer className="pie-pagina" role="contentinfo">
      <div className="contenedor-principal">
        <p style={{ margin: '0 auto', fontSize: '0.875rem' }}>
          <strong>09 · Clima por ciudad</strong> — Pronóstico meteorológico con caché compartida y accesibilidad WCAG 2.2 AA.
        </p>
        <p style={{ margin: '0.5rem auto 0', fontSize: '0.8125rem' }}>
          Datos meteorológicos provistos por{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primario)', textDecoration: 'underline' }}
          >
            Open-Meteo
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
