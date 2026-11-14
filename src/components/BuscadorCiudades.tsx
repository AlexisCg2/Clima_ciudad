'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { CiudadSugerida } from '../types/ciudad';

interface BuscadorCiudadesProps {
  onSeleccionarCiudad: (ciudad: CiudadSugerida) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Buscador accesible de ciudades con debounce y navegación por teclado.
 * Cumple con RF-01, WCAG 2.2 AA (roles combobox/listbox y gestión de foco).
 */
export function BuscadorCiudades({
  onSeleccionarCiudad,
  placeholder = 'Ej. Bogotá, Madrid, Buenos Aires...',
  autoFocus = false,
}: BuscadorCiudadesProps) {
  const [termino, setTermino] = useState('');
  const [sugerencias, setSugerencias] = useState<CiudadSugerida[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indiceFoco, setIndiceFoco] = useState<number>(-1);
  const [abierto, setAbierto] = useState(false);

  const terminoDebounced = useDebounce(termino.trim(), 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (terminoDebounced.length < 2) {
      setSugerencias([]);
      setCargando(false);
      setError(null);
      setAbierto(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    const buscar = async () => {
      try {
        const respuesta = await fetch(`/api/ciudades/buscar?q=${encodeURIComponent(terminoDebounced)}`);
        if (!respuesta.ok) {
          throw new Error('Error al buscar ciudades');
        }
        const datos = (await respuesta.json()) as { ciudades: CiudadSugerida[] };
        if (!cancelado) {
          setSugerencias(datos.ciudades ?? []);
          setAbierto(true);
          setIndiceFoco(-1);
        }
      } catch (err) {
        if (!cancelado) {
          setError('No fue posible consultar el servicio de búsqueda.');
          setSugerencias([]);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void buscar();

    return () => {
      cancelado = true;
    };
  }, [terminoDebounced]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!abierto || sugerencias.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceFoco((prev) => (prev < sugerencias.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceFoco((prev) => (prev > 0 ? prev - 1 : sugerencias.length - 1));
    } else if (e.key === 'Enter') {
      if (indiceFoco >= 0 && sugerencias[indiceFoco]) {
        e.preventDefault();
        seleccionar(sugerencias[indiceFoco]!);
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setIndiceFoco(-1);
    }
  };

  const seleccionar = (ciudad: CiudadSugerida) => {
    onSeleccionarCiudad(ciudad);
    setTermino('');
    setSugerencias([]);
    setAbierto(false);
    setIndiceFoco(-1);
    inputRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
      <form role="search" onSubmit={(e) => e.preventDefault()} style={{ width: '100%' }}>
        <label
          htmlFor="input-busqueda-ciudad"
          style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9375rem' }}
        >
          Buscar ciudad por nombre
        </label>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            id="input-busqueda-ciudad"
            role="combobox"
            type="search"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (sugerencias.length > 0) setAbierto(true);
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="lista-sugerencias-ciudades"
            aria-expanded={abierto}
            aria-activedescendant={indiceFoco >= 0 ? `opcion-ciudad-${indiceFoco}` : undefined}
            style={{
              width: '100%',
              padding: '0.75rem 2.5rem 0.75rem 1rem',
              borderRadius: 'var(--radio-borde)',
              border: '2px solid var(--borde-fuerte)',
              backgroundColor: 'var(--bg-superficie)',
              color: 'var(--texto-principal)',
            }}
          />

          {cargando && (
            <span
              style={{ position: 'absolute', right: '1rem', fontSize: '0.875rem' }}
              aria-hidden="true"
            >
              ⏳
            </span>
          )}
        </div>
      </form>

      {/* Región de anuncio para lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        {cargando && 'Buscando ciudades...'}
        {!cargando && sugerencias.length > 0 && `${sugerencias.length} ciudades encontradas.`}
        {!cargando && terminoDebounced.length >= 2 && sugerencias.length === 0 && 'Sin resultados.'}
      </div>

      {/* Lista desplegable accesible */}
      {abierto && sugerencias.length > 0 && (
        <ul
          id="lista-sugerencias-ciudades"
          ref={listaRef}
          role="listbox"
          aria-label="Sugerencias de ciudades"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-superficie)',
            border: '1px solid var(--borde-suave)',
            borderRadius: 'var(--radio-borde)',
            boxShadow: 'var(--sombra-elevada)',
            listStyle: 'none',
            margin: 0,
            padding: '0.5rem 0',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {sugerencias.map((ciudad, idx) => {
            const esActivo = idx === indiceFoco;
            return (
              <li
                id={`opcion-ciudad-${idx}`}
                key={`${ciudad.id}-${idx}`}
                role="option"
                aria-selected={esActivo}
                onClick={() => seleccionar(ciudad)}
                onMouseEnter={() => setIndiceFoco(idx)}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  backgroundColor: esActivo ? 'var(--bg-elevado)' : 'transparent',
                  borderLeft: esActivo ? '3px solid var(--color-primario)' : '3px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{ciudad.nombre}</span>
                  <span style={{ color: 'var(--texto-atenuado)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                    {ciudad.region ? `${ciudad.region}, ` : ''}
                    {ciudad.pais}
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--texto-atenuado)' }}>
                  {ciudad.lat.toFixed(2)}°, {ciudad.lng.toFixed(2)}°
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--color-peligro)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
