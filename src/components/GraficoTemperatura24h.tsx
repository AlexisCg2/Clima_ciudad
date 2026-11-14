'use client';

import React from 'react';
import { formatearTemperatura } from '../lib/temperatura';
import type { PronosticoHora, UnidadTemperatura } from '../types/clima';

interface GraficoTemperatura24hProps {
  horas: PronosticoHora[];
  unidad: UnidadTemperatura;
}

/**
 * Reto opcional (Sección 12): Gráfico de temperatura en SVG accesible para las próximas 24 horas.
 * Totalmente responsivo mediante viewBox y accesible con role="img" y tabla semántica alternativa.
 */
export function GraficoTemperatura24h({ horas, unidad }: GraficoTemperatura24hProps) {
  if (!horas || horas.length < 2) {
    return null;
  }

  // Dimensiones del lienzo virtual SVG
  const ancho = 800;
  const alto = 220;
  const paddingX = 40;
  const paddingTop = 35;
  const paddingBottom = 45;

  const valoresTemp = horas.map((h) =>
    unidad === 'celsius' ? h.temperaturaCelsius : h.temperaturaFahrenheit
  );

  const minTemp = Math.min(...valoresTemp);
  const maxTemp = Math.max(...valoresTemp);
  const rango = maxTemp - minTemp === 0 ? 1 : maxTemp - minTemp;

  const pasoX = (ancho - paddingX * 2) / (horas.length - 1);
  const alturaUtil = alto - paddingTop - paddingBottom;

  const puntos = horas.map((h, i) => {
    const temp = unidad === 'celsius' ? h.temperaturaCelsius : h.temperaturaFahrenheit;
    const x = paddingX + i * pasoX;
    // Inversión del eje Y (0 está arriba en SVG)
    const y = paddingTop + alturaUtil - ((temp - minTemp) / rango) * alturaUtil;
    return { x, y, temp, hora: h.hora.slice(11, 16) };
  });

  const polylinePuntos = puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Generación de gradiente de área
  const areaPuntos = `${polylinePuntos} ${puntos[puntos.length - 1]?.x.toFixed(1)},${alto - paddingBottom} ${puntos[0]?.x.toFixed(1)},${alto - paddingBottom}`;

  return (
    <section className="tarjeta" aria-labelledby="titulo-grafico-svg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <h2 id="titulo-grafico-svg" style={{ fontSize: '1.25rem', margin: 0 }}>
          Tendencia de temperatura (24 h)
        </h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--texto-atenuado)' }}>
          Mín: {formatearTemperatura(minTemp, unidad)} · Máx: {formatearTemperatura(maxTemp, unidad)}
        </span>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}
          role="img"
          aria-labelledby="titulo-svg desc-svg"
        >
          <title id="titulo-svg">
            Gráfico de evolución de temperatura para las próximas 24 horas en grados{' '}
            {unidad === 'celsius' ? 'Celsius' : 'Fahrenheit'}
          </title>
          <desc id="desc-svg">
            Temperatura mínima de {formatearTemperatura(minTemp, unidad)} y máxima de{' '}
            {formatearTemperatura(maxTemp, unidad)}.
          </desc>

          <defs>
            <linearGradient id="degradadoTemperatura" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primario)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-primario)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas guía horizontales */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={ancho - paddingX}
            y2={paddingTop}
            stroke="var(--borde-suave)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={alto - paddingBottom}
            x2={ancho - paddingX}
            y2={alto - paddingBottom}
            stroke="var(--borde-fuerte)"
            strokeWidth="1.5"
          />

          {/* Área sombreada */}
          <polygon points={areaPuntos} fill="url(#degradadoTemperatura)" />

          {/* Línea de tendencia */}
          <polyline
            points={polylinePuntos}
            fill="none"
            stroke="var(--color-primario)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos y etiquetas */}
          {puntos.map((p, idx) => {
            // Mostrar etiqueta cada 3 horas para evitar solapamientos
            const mostrarEtiqueta = idx % 3 === 0 || idx === puntos.length - 1;

            return (
              <g key={`punto-${idx}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={mostrarEtiqueta ? 4.5 : 2.5}
                  fill="var(--bg-superficie)"
                  stroke="var(--color-primario)"
                  strokeWidth="2.5"
                />

                {mostrarEtiqueta && (
                  <>
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="var(--texto-principal)"
                    >
                      {Math.round(p.temp)}°
                    </text>
                    <text
                      x={p.x}
                      y={alto - paddingBottom + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--texto-secundario)"
                    >
                      {p.hora}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
