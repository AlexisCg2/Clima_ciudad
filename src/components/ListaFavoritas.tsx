'use client';

import React from 'react';
import Link from 'next/link';
import { LIMITE_MAXIMO_CIUDADES_FAVORITAS, type CiudadFavorita } from '../types/ciudad';

interface ListaFavoritasProps {
  ciudades: CiudadFavorita[];
  onEliminarCiudad: (id: string) => Promise<void>;
  eliminandoId?: string | null;
}

/**
 * Lista de ciudades favoritas con contador (X / 10) y controles accesibles.
 * Cumple con RF-04 y WCAG 2.2 AA.
 */
export function ListaFavoritas({
  ciudades,
  onEliminarCiudad,
  eliminandoId,
}: ListaFavoritasProps) {
  const total = ciudades.length;

  return (
    <section className="tarjeta" aria-labelledby="titulo-mis-favoritas">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h2 id="titulo-mis-favoritas" style={{ fontSize: '1.25rem', margin: 0 }}>
          Mis ciudades favoritas
        </h2>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            padding: '0.25rem 0.5rem',
            backgroundColor: 'var(--bg-elevado)',
            borderRadius: 'var(--radio-borde)',
            color: total >= LIMITE_MAXIMO_CIUDADES_FAVORITAS ? 'var(--color-alerta)' : 'var(--texto-secundario)',
          }}
          aria-label={`Tiene ${total} de un máximo de ${LIMITE_MAXIMO_CIUDADES_FAVORITAS} ciudades favoritas`}
        >
          {total} / {LIMITE_MAXIMO_CIUDADES_FAVORITAS}
        </span>
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
        aria-label="Listado de ciudades favoritas"
      >
        {ciudades.map((c) => {
          const estaEliminando = eliminandoId === c.id;

          return (
            <li
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-elevado)',
                borderRadius: 'var(--radio-borde)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <Link
                  href={`/ciudades/${c.id}?lat=${c.lat}&lng=${c.lng}&nombre=${encodeURIComponent(c.nombre)}&pais=${encodeURIComponent(c.pais)}`}
                  className="nav-enlace"
                  style={{ fontWeight: 700, fontSize: '1.0625rem', padding: 0 }}
                >
                  {c.nombre}, {c.pais}
                </Link>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--texto-atenuado)' }}>
                  Coordenadas: {c.lat.toFixed(2)}°, {c.lng.toFixed(2)}°
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  href={`/ciudades/${c.id}?lat=${c.lat}&lng=${c.lng}&nombre=${encodeURIComponent(c.nombre)}&pais=${encodeURIComponent(c.pais)}`}
                  className="boton-primario"
                  style={{ minHeight: '44px', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                >
                  Ver pronóstico
                </Link>

                <button
                  type="button"
                  onClick={() => onEliminarCiudad(c.id)}
                  disabled={estaEliminando}
                  className="boton-peligro"
                  aria-label={`Eliminar ${c.nombre} de mis ciudades favoritas`}
                >
                  <span aria-hidden="true">🗑️</span>
                  <span>{estaEliminando ? 'Eliminando...' : 'Eliminar'}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
