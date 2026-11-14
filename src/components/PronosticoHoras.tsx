'use client';

import React from 'react';
import { formatearTemperatura } from '../lib/temperatura';
import type { PronosticoHora, UnidadTemperatura } from '../types/clima';

interface PronosticoHorasProps {
  horas: PronosticoHora[];
  unidad: UnidadTemperatura;
}

/**
 * Formatea una cadena ISO o timestamp de hora según la configuración regional en español.
 */
function formatearHora(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    if (Number.isNaN(fecha.getTime())) {
      return isoString.slice(11, 16);
    }
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha);
  } catch {
    return isoString;
  }
}

/**
 * Visualización del pronóstico de las próximas 24 horas.
 * Cumple con RF-02 y la Sección 5 (Intl.DateTimeFormat para localización accesible).
 */
export function PronosticoHoras({ horas, unidad }: PronosticoHorasProps) {
  if (!horas || horas.length === 0) {
    return null;
  }

  return (
    <section className="tarjeta" aria-labelledby="titulo-pronostico-horas">
      <h2 id="titulo-pronostico-horas" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Próximas 24 horas
      </h2>

      <ol
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          listStyle: 'none',
          margin: 0,
          scrollSnapType: 'x mandatory',
        }}
        tabIndex={0}
        aria-label="Lista cronológica de temperaturas por hora. Use flechas para desplazarse."
      >
        {horas.map((h, index) => {
          const temp = unidad === 'celsius' ? h.temperaturaCelsius : h.temperaturaFahrenheit;
          const horaFormateada = formatearHora(h.hora);

          return (
            <li
              key={`${h.hora}-${index}`}
              style={{
                flex: '0 0 auto',
                minWidth: '95px',
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-elevado)',
                borderRadius: 'var(--radio-borde)',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.35rem',
              }}
            >
              <time dateTime={h.hora} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {horaFormateada}
              </time>

              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--texto-principal)',
                  margin: '0.25rem 0',
                }}
              >
                {formatearTemperatura(temp, unidad)}
              </span>

              <span style={{ fontSize: '0.75rem', color: 'var(--texto-secundario)', minHeight: '2em' }}>
                {h.descripcion}
              </span>

              {h.probabilidadPrecipitacion > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-primario)',
                    fontWeight: 600,
                  }}
                  aria-label={`Probabilidad de lluvia: ${h.probabilidadPrecipitacion}%`}
                >
                  💧 {h.probabilidadPrecipitacion}%
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
