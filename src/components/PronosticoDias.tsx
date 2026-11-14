'use client';

import React from 'react';
import { formatearTemperatura } from '../lib/temperatura';
import type { PronosticoDia, UnidadTemperatura } from '../types/clima';

interface PronosticoDiasProps {
  dias: PronosticoDia[];
  unidad: UnidadTemperatura;
}

/**
 * Formatea una fecha YYYY-MM-DD en el nombre del día y fecha legible en español.
 */
function formatearDiaSemana(fechaStr: string): { diaSemana: string; fechaCorta: string } {
  try {
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    if (!año || !mes || !dia) return { diaSemana: fechaStr, fechaCorta: '' };

    const fecha = new Date(año, mes - 1, dia);
    const diaSemana = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(fecha);
    const fechaCorta = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(fecha);

    return {
      diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      fechaCorta,
    };
  } catch {
    return { diaSemana: fechaStr, fechaCorta: '' };
  }
}

/**
 * Visualización accesible del pronóstico de 7 días.
 * Cumple con RF-02 y WCAG 2.2 AA (elementos nativos y contraste).
 */
export function PronosticoDias({ dias, unidad }: PronosticoDiasProps) {
  if (!dias || dias.length === 0) {
    return null;
  }

  return (
    <section className="tarjeta" aria-labelledby="titulo-pronostico-dias">
      <h2 id="titulo-pronostico-dias" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Pronóstico de 7 días
      </h2>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {dias.map((d, index) => {
          const { diaSemana, fechaCorta } = formatearDiaSemana(d.fecha);
          const minT = unidad === 'celsius' ? d.temperaturaMinCelsius : d.temperaturaMinFahrenheit;
          const maxT = unidad === 'celsius' ? d.temperaturaMaxCelsius : d.temperaturaMaxFahrenheit;

          return (
            <li
              key={`${d.fecha}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(110px, 1fr) 1.5fr minmax(100px, 1fr)',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-elevado)',
                borderRadius: 'var(--radio-borde)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>{diaSemana}</span>
                <time dateTime={d.fecha} style={{ fontSize: '0.8125rem', color: 'var(--texto-atenuado)' }}>
                  {fechaCorta}
                </time>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{d.descripcion}</span>
                {d.probabilidadPrecipitacionMax > 20 && (
                  <span
                    style={{ fontSize: '0.75rem', color: 'var(--color-primario)', fontWeight: 600 }}
                    aria-label={`Lluvia máxima: ${d.probabilidadPrecipitacionMax}%`}
                  >
                    💧 {d.probabilidadPrecipitacionMax}%
                  </span>
                )}
              </div>

              <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.9375rem' }}>
                <span style={{ color: 'var(--texto-principal)' }}>{formatearTemperatura(maxT, unidad)}</span>
                <span style={{ color: 'var(--texto-atenuado)', marginLeft: '0.5rem', fontWeight: 400 }}>
                  {formatearTemperatura(minT, unidad)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
