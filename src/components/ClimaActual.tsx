'use client';

import React from 'react';
import { formatearTemperatura } from '../lib/temperatura';
import type { DatosClima, UnidadTemperatura } from '../types/clima';

interface ClimaActualProps {
  datos: DatosClima;
  nombreCiudad?: string;
  paisCiudad?: string;
  unidad: UnidadTemperatura;
  onSolicitarUbicacion?: () => void;
  cargandoUbicacion?: boolean;
  nivelTitulo?: 1 | 2;
}

/**
 * Componente principal para visualizar las condiciones meteorológicas actuales.
 * Cumple con RF-02, RF-03, RF-05, RF-06 y accesibilidad semántica.
 */
export function ClimaActual({
  datos,
  nombreCiudad = 'Ubicación seleccionada',
  paisCiudad,
  unidad,
  onSolicitarUbicacion,
  cargandoUbicacion = false,
  nivelTitulo = 1,
}: ClimaActualProps) {
  const tempActual =
    unidad === 'celsius' ? datos.temperaturaActualCelsius : datos.temperaturaActualFahrenheit;
  const sensTermica =
    unidad === 'celsius' ? datos.sensacionTermicaCelsius : datos.sensacionTermicaFahrenheit;

  const Encabezado = nivelTitulo === 2 ? 'h2' : 'h1';

  return (
    <section className="tarjeta" aria-labelledby="titulo-clima-actual">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Encabezado
            id="titulo-clima-actual"
            style={{ margin: 0, fontSize: nivelTitulo === 2 ? '1.5rem' : '1.75rem' }}
          >
            {nombreCiudad}
            {paisCiudad ? `, ${paisCiudad}` : ''}
          </Encabezado>
          <p style={{ color: 'var(--texto-atenuado)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Zona horaria: {datos.zonaHoraria} · Coordenadas: {datos.coordenadas.lat}°, {datos.coordenadas.lng}°
          </p>
        </div>

        {onSolicitarUbicacion && (
          <button
            type="button"
            onClick={onSolicitarUbicacion}
            disabled={cargandoUbicacion}
            className="boton-secundario"
            style={{ fontSize: '0.875rem' }}
            aria-label="Obtener clima para mi ubicación actual"
          >
            <span aria-hidden="true">📍</span>
            <span>{cargandoUbicacion ? 'Obteniendo ubicación...' : 'Mi ubicación'}</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          margin: '1.5rem 0',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: 800, lineHeight: 1 }}>
            {formatearTemperatura(tempActual, unidad, false)}
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--texto-secundario)' }}>
            {unidad === 'celsius' ? '°C' : '°F'}
          </span>
        </div>

        <div>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>
            {datos.descripcion}
          </p>
          <p style={{ color: 'var(--texto-secundario)', margin: '0.25rem 0 0 0' }}>
            Sensación térmica: {formatearTemperatura(sensTermica, unidad)}
          </p>
        </div>
      </div>

      {/* Indicador de caché (RF-06) */}
      {datos.desdeCache && (
        <div
          role="note"
          aria-label="Información de caché"
          style={{
            backgroundColor: 'var(--bg-elevado)',
            borderLeft: '3px solid var(--color-primario)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radio-borde)',
            fontSize: '0.8125rem',
            color: 'var(--texto-secundario)',
            marginBottom: '1rem',
          }}
        >
          <span aria-hidden="true">⏱️</span>{' '}
          {datos.antiguedadMinutos === 0
            ? 'Datos obtenidos recientemente desde la caché del servidor.'
            : `Datos de hace ${datos.antiguedadMinutos} ${datos.antiguedadMinutos === 1 ? 'minuto' : 'minutos'}.`}
        </div>
      )}

      {/* Métricas adicionales */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          margin: 0,
          borderTop: '1px solid var(--borde-suave)',
          paddingTop: '1rem',
        }}
      >
        <div style={{ background: 'var(--bg-elevado)', padding: '0.75rem', borderRadius: 'var(--radio-borde)' }}>
          <dt style={{ fontSize: '0.8125rem', color: 'var(--texto-atenuado)' }}>Humedad Relativa</dt>
          <dd style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{datos.humedadRelativa}%</dd>
        </div>
        <div style={{ background: 'var(--bg-elevado)', padding: '0.75rem', borderRadius: 'var(--radio-borde)' }}>
          <dt style={{ fontSize: '0.8125rem', color: 'var(--texto-atenuado)' }}>Velocidad del Viento</dt>
          <dd style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{datos.velocidadVientoKmH} km/h</dd>
        </div>
      </dl>
    </section>
  );
}
