'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { HeaderNav } from '../../../src/components/HeaderNav';
import { ClimaActual } from '../../../src/components/ClimaActual';
import { PronosticoHoras } from '../../../src/components/PronosticoHoras';
import { GraficoTemperatura24h } from '../../../src/components/GraficoTemperatura24h';
import { PronosticoDias } from '../../../src/components/PronosticoDias';
import { BotonFavorita } from '../../../src/components/BotonFavorita';
import { EsqueletoCarga, EstadoError } from '../../../src/components/EstadosUI';
import { usePreferenciaUnidad } from '../../../src/hooks/usePreferenciaUnidad';
import type { DatosClima, UnidadTemperatura } from '../../../src/types/clima';

interface PaginaDetalleProps {
  params: Promise<{ id: string }>;
}

function ContenidoDetalleCiudad({
  params,
  unidad,
}: {
  params: Promise<{ id: string }>;
  unidad: UnidadTemperatura;
}) {
  const searchParams = useSearchParams();

  const [id, setId] = useState<string>('');
  const [datosClima, setDatosClima] = useState<DatosClima | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parámetros opcionales pasados en la URL
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const nombreParam = searchParams.get('nombre') || 'Ciudad';
  const paisParam = searchParams.get('pais') || '';

  const lat = latParam ? parseFloat(latParam) : 4.6097;
  const lng = lngParam ? parseFloat(lngParam) : -74.0817;

  useEffect(() => {
    void Promise.resolve(params).then((p) => setId(p.id));
  }, [params]);

  const cargarClima = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const res = await fetch(`/api/clima?lat=${lat}&lng=${lng}`);
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || 'Error al obtener el clima de la ciudad');
      }
      const data = (await res.json()) as DatosClima;
      setDatosClima(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar el pronóstico');
    } finally {
      setCargando(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    void cargarClima();
  }, [cargarClima]);

  return (
    <div className="contenedor-principal">
      <nav aria-label="Migas de pan" style={{ marginBottom: '1rem' }}>
        <Link
          href="/ciudades"
          className="boton-secundario"
          style={{ minHeight: '36px', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
        >
          ← Volver a Favoritas
        </Link>
      </nav>

      {cargando && <EsqueletoCarga mensaje={`Cargando pronóstico detallado de ${nombreParam}...`} />}

      {error && !cargando && (
        <EstadoError mensaje={error} onReintentar={() => void cargarClima()} />
      )}

      {datosClima && !cargando && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ flex: '1 1 auto' }}>
              <ClimaActual
                datos={datosClima}
                nombreCiudad={nombreParam}
                paisCiudad={paisParam}
                unidad={unidad}
              />
            </div>

            <div>
              <BotonFavorita
                nombre={nombreParam}
                pais={paisParam || 'Ubicación'}
                lat={lat}
                lng={lng}
                esFavoritaInicialmente={Boolean(id && id !== 'nueva')}
                idFavoritaExistente={id}
              />
            </div>
          </div>

          <PronosticoHoras horas={datosClima.pronostico24Horas} unidad={unidad} />
          <GraficoTemperatura24h horas={datosClima.pronostico24Horas} unidad={unidad} />
          <PronosticoDias dias={datosClima.pronostico7Dias} unidad={unidad} />
        </div>
      )}
    </div>
  );
}

export default function PaginaDetalleCiudad({ params }: PaginaDetalleProps) {
  const { unidad, alternarUnidad } = usePreferenciaUnidad();

  return (
    <>
      <HeaderNav unidad={unidad} onAlternarUnidad={alternarUnidad} />
      <Suspense fallback={<EsqueletoCarga mensaje="Cargando parámetros de la ciudad..." />}>
        <ContenidoDetalleCiudad params={params} unidad={unidad} />
      </Suspense>
    </>
  );
}
