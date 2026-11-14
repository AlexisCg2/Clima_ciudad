'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HeaderNav } from '../../src/components/HeaderNav';
import { ListaFavoritas } from '../../src/components/ListaFavoritas';
import { EsqueletoCarga, EstadoError, EstadoVacio } from '../../src/components/EstadosUI';
import { usePreferenciaUnidad } from '../../src/hooks/usePreferenciaUnidad';
import type { CiudadFavorita } from '../../src/types/ciudad';

export default function PaginaCiudades() {
  const { unidad, alternarUnidad } = usePreferenciaUnidad();

  const [ciudades, setCiudades] = useState<CiudadFavorita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargarFavoritas = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/ciudades');
      if (res.status === 401) {
        // Usuario sin sesión activa
        setCiudades([]);
        setError('Debe iniciar sesión para guardar y consultar sus ciudades favoritas.');
        return;
      }
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || 'Error al obtener sus ciudades favoritas');
      }
      const data = (await res.json()) as { ciudades: CiudadFavorita[] };
      setCiudades(data.ciudades ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de comunicación con el servidor');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarFavoritas();
  }, [cargarFavoritas]);

  const handleEliminar = async (id: string) => {
    setEliminandoId(id);
    try {
      const res = await fetch(`/api/ciudades/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || 'No se pudo eliminar la ciudad');
      }
      setCiudades((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <>
      <HeaderNav unidad={unidad} onAlternarUnidad={alternarUnidad} />

      <div className="contenedor-principal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Ciudades Favoritas</h1>
            <p style={{ color: 'var(--texto-secundario)', margin: 0 }}>
              Consulte rápidamente el pronóstico de sus ciudades guardadas (hasta 10 favoritas).
            </p>
          </div>

          <Link href="/buscar" className="boton-primario">
            <span aria-hidden="true">➕</span> Buscar nueva ciudad
          </Link>
        </div>

        {cargando && <EsqueletoCarga mensaje="Cargando su lista de favoritas..." />}

        {error && !cargando && (
          <EstadoError mensaje={error} onReintentar={() => void cargarFavoritas()} />
        )}

        {!cargando && !error && ciudades.length === 0 && (
          <EstadoVacio
            titulo="No tiene ciudades favoritas guardadas"
            descripcion="Busque una ciudad por su nombre y pulse en «Agregar a favoritas» para tenerla siempre a mano."
            accion={
              <Link href="/buscar" className="boton-primario">
                Buscar ciudades ahora
              </Link>
            }
          />
        )}

        {!cargando && !error && ciudades.length > 0 && (
          <ListaFavoritas
            ciudades={ciudades}
            onEliminarCiudad={handleEliminar}
            eliminandoId={eliminandoId}
          />
        )}
      </div>
    </>
  );
}
