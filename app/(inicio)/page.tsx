'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HeaderNav } from '../../src/components/HeaderNav';
import { ClimaActual } from '../../src/components/ClimaActual';
import { PronosticoHoras } from '../../src/components/PronosticoHoras';
import { GraficoTemperatura24h } from '../../src/components/GraficoTemperatura24h';
import { PronosticoDias } from '../../src/components/PronosticoDias';
import { BotonFavorita } from '../../src/components/BotonFavorita';
import { EsqueletoCarga, EstadoError } from '../../src/components/EstadosUI';
import { usePreferenciaUnidad } from '../../src/hooks/usePreferenciaUnidad';
import { useGeolocation } from '../../src/hooks/useGeolocation';
import type { DatosClima } from '../../src/types/clima';

// Ubicación predeterminada inicial (Bogotá D.C., Colombia)
const UBICACION_DEFECTO = {
  nombre: 'Bogotá',
  pais: 'Colombia',
  lat: 4.6097,
  lng: -74.0817,
};

export default function PaginaInicio() {
  const { unidad, alternarUnidad } = usePreferenciaUnidad();
  const { solicitarUbicacion, cargando: cargandoGeo, error: errorGeo } = useGeolocation();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: UBICACION_DEFECTO.lat,
    lng: UBICACION_DEFECTO.lng,
  });
  const [nombreCiudad, setNombreCiudad] = useState(UBICACION_DEFECTO.nombre);
  const [paisCiudad, setPaisCiudad] = useState(UBICACION_DEFECTO.pais);

  const [datosClima, setDatosClima] = useState<DatosClima | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarClima = useCallback(async (latitud: number, longitud: number) => {
    setCargando(true);
    setError(null);

    try {
      const res = await fetch(`/api/clima?lat=${latitud}&lng=${longitud}`);
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Error del servidor HTTP ${res.status}`);
      }
      const data = (await res.json()) as DatosClima;
      setDatosClima(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar el pronóstico.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarClima(coords.lat, coords.lng);
  }, [coords.lat, coords.lng, cargarClima]);

  const handleMiUbicacion = async () => {
    const geoCoords = await solicitarUbicacion();
    if (geoCoords) {
      setCoords(geoCoords);
      setNombreCiudad('Mi ubicación actual');
      setPaisCiudad('');
    }
  };

  return (
    <>
      <HeaderNav unidad={unidad} onAlternarUnidad={alternarUnidad} />

      <div className="contenedor-principal">
        {errorGeo && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              backgroundColor: 'var(--bg-elevado)',
              borderLeft: '4px solid var(--color-alerta)',
              borderRadius: 'var(--radio-borde)',
              fontSize: '0.875rem',
            }}
          >
            <span>ℹ️ {errorGeo}</span>
          </div>
        )}

        {cargando && <EsqueletoCarga mensaje="Consultando pronóstico en Open-Meteo..." />}

        {error && !cargando && (
          <EstadoError mensaje={error} onReintentar={() => void cargarClima(coords.lat, coords.lng)} />
        )}

        {datosClima && !cargando && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 auto' }}>
                <ClimaActual
                  datos={datosClima}
                  nombreCiudad={nombreCiudad}
                  paisCiudad={paisCiudad}
                  unidad={unidad}
                  onSolicitarUbicacion={handleMiUbicacion}
                  cargandoUbicacion={cargandoGeo}
                />
              </div>

              <div>
                <BotonFavorita
                  nombre={nombreCiudad}
                  pais={paisCiudad || 'Ubicación'}
                  lat={coords.lat}
                  lng={coords.lng}
                />
              </div>
            </div>

            {/* Pronóstico 24 horas (RF-02) */}
            <PronosticoHoras horas={datosClima.pronostico24Horas} unidad={unidad} />

            {/* Reto Opcional: Gráfico SVG de 24 horas */}
            <GraficoTemperatura24h horas={datosClima.pronostico24Horas} unidad={unidad} />

            {/* Pronóstico 7 días (RF-02) */}
            <PronosticoDias dias={datosClima.pronostico7Dias} unidad={unidad} />
          </div>
        )}
      </div>
    </>
  );
}
