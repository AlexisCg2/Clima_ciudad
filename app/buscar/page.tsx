'use client';

import React, { useState } from 'react';
import { HeaderNav } from '../../src/components/HeaderNav';
import { BuscadorCiudades } from '../../src/components/BuscadorCiudades';
import { ClimaActual } from '../../src/components/ClimaActual';
import { BotonFavorita } from '../../src/components/BotonFavorita';
import { PronosticoHoras } from '../../src/components/PronosticoHoras';
import { PronosticoDias } from '../../src/components/PronosticoDias';
import { EsqueletoCarga, EstadoError } from '../../src/components/EstadosUI';
import { usePreferenciaUnidad } from '../../src/hooks/usePreferenciaUnidad';
import type { CiudadSugerida } from '../../src/types/ciudad';
import type { DatosClima } from '../../src/types/clima';

export default function PaginaBuscar() {
  const { unidad, alternarUnidad } = usePreferenciaUnidad();
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<CiudadSugerida | null>(null);
  const [datosClima, setDatosClima] = useState<DatosClima | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeleccionarCiudad = async (ciudad: CiudadSugerida) => {
    setCiudadSeleccionada(ciudad);
    setCargando(true);
    setError(null);

    try {
      const res = await fetch(`/api/clima?lat=${ciudad.lat}&lng=${ciudad.lng}`);
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || 'Error al obtener el pronóstico de la ciudad');
      }
      const data = (await res.json()) as DatosClima;
      setDatosClima(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar el clima');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <HeaderNav unidad={unidad} onAlternarUnidad={alternarUnidad} />

      <div className="contenedor-principal">
        <div style={{ marginBottom: '2rem' }}>
          <h1>Buscar Ciudades en el Mundo</h1>
          <p style={{ color: 'var(--texto-secundario)' }}>
            Escriba al menos 2 letras para buscar ciudades mediante el servicio de geocodificación de Open-Meteo.
          </p>

          <BuscadorCiudades onSeleccionarCiudad={handleSeleccionarCiudad} autoFocus />
        </div>

        {cargando && <EsqueletoCarga mensaje={`Consultando clima de ${ciudadSeleccionada?.nombre}...`} />}

        {error && !cargando && (
          <EstadoError
            mensaje={error}
            onReintentar={() => ciudadSeleccionada && void handleSeleccionarCiudad(ciudadSeleccionada)}
          />
        )}

        {ciudadSeleccionada && datosClima && !cargando && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 auto' }}>
                <ClimaActual
                  datos={datosClima}
                  nombreCiudad={ciudadSeleccionada.nombre}
                  paisCiudad={ciudadSeleccionada.pais}
                  unidad={unidad}
                  nivelTitulo={2}
                />
              </div>

              <div>
                <BotonFavorita
                  nombre={ciudadSeleccionada.nombre}
                  pais={ciudadSeleccionada.pais}
                  lat={ciudadSeleccionada.lat}
                  lng={ciudadSeleccionada.lng}
                />
              </div>
            </div>

            <PronosticoHoras horas={datosClima.pronostico24Horas} unidad={unidad} />
            <PronosticoDias dias={datosClima.pronostico7Dias} unidad={unidad} />
          </div>
        )}
      </div>
    </>
  );
}
