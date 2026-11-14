'use client';

import React, { useState } from 'react';
import type { CiudadFavorita } from '../types/ciudad';

interface BotonFavoritaProps {
  nombre: string;
  pais: string;
  lat: number;
  lng: number;
  esFavoritaInicialmente?: boolean;
  idFavoritaExistente?: string;
  onCambioEstado?: (esFavorita: boolean, favorita?: CiudadFavorita) => void;
}

/**
 * Botón accesible para agregar o quitar una ciudad de favoritos (RF-04).
 * Cumple con WCAG (aria-pressed, feedback en lectores de pantalla y control de límite de 10).
 */
export function BotonFavorita({
  nombre,
  pais,
  lat,
  lng,
  esFavoritaInicialmente = false,
  idFavoritaExistente,
  onCambioEstado,
}: BotonFavoritaProps) {
  const [esFavorita, setEsFavorita] = useState(esFavoritaInicialmente);
  const [idFavorita, setIdFavorita] = useState<string | undefined>(idFavoritaExistente);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFavorita = async () => {
    setCargando(true);
    setError(null);

    try {
      if (esFavorita && idFavorita) {
        // Eliminar de favoritos (DELETE /api/ciudades/[id])
        const res = await fetch(`/api/ciudades/${idFavorita}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error ?? 'No fue posible eliminar la ciudad de favoritos');
        }

        setEsFavorita(false);
        setIdFavorita(undefined);
        onCambioEstado?.(false);
      } else {
        // Agregar a favoritos (POST /api/ciudades)
        const res = await fetch('/api/ciudades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombre, pais, lat, lng }),
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error ?? 'No fue posible guardar la ciudad en favoritos');
        }

        const nueva = (await res.json()) as CiudadFavorita;
        setEsFavorita(true);
        setIdFavorita(nueva.id);
        onCambioEstado?.(true, nueva);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar favoritos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={toggleFavorita}
        disabled={cargando}
        aria-pressed={esFavorita}
        aria-label={
          esFavorita
            ? `En mis favoritas: eliminar ${nombre}`
            : `Agregar a favoritas: guardar ${nombre} (máximo 10)`
        }
        className={esFavorita ? 'boton-secundario' : 'boton-primario'}
        style={{
          minHeight: '44px',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        }}
      >
        <span aria-hidden="true">{esFavorita ? '⭐' : '☆'}</span>
        <span>
          {cargando
            ? 'Guardando...'
            : esFavorita
            ? 'En mis favoritas'
            : 'Agregar a favoritas'}
        </span>
      </button>

      {error && (
        <span
          role="alert"
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-peligro)',
            fontWeight: 600,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
