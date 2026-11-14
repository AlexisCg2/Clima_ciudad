'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UnidadTemperatura } from '../types/clima';

interface HeaderNavProps {
  unidad: UnidadTemperatura;
  onAlternarUnidad: () => void;
}

/**
 * Encabezado semántico y barra de navegación accesible.
 * Cumple con landmarks WCAG (<header>, <nav>), foco visible y objetivos táctiles.
 */
export function HeaderNav({ unidad, onAlternarUnidad }: HeaderNavProps) {
  const pathname = usePathname();

  return (
    <header className="encabezado-nav" role="banner">
      <div className="nav-contenedor">
        <Link
          href="/"
          className="nav-enlace"
          style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--texto-principal)' }}
          aria-label="ClimaCiudad - Inicio"
        >
          <span aria-hidden="true">🌤️</span> ClimaCiudad
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="nav-enlaces">
            <li>
              <Link
                href="/"
                className="nav-enlace"
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/buscar"
                className="nav-enlace"
                aria-current={pathname === '/buscar' ? 'page' : undefined}
              >
                Buscar
              </Link>
            </li>
            <li>
              <Link
                href="/ciudades"
                className="nav-enlace"
                aria-current={pathname === '/ciudades' ? 'page' : undefined}
              >
                Favoritas
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={onAlternarUnidad}
                className="boton-secundario"
                style={{ padding: '0.35rem 0.75rem', minHeight: '44px' }}
                aria-label={
                  unidad === 'celsius'
                    ? '°C - Cambiar a grados Fahrenheit'
                    : '°F - Cambiar a grados Celsius'
                }
                title={`Cambiar a ${unidad === 'celsius' ? '°F' : '°C'}`}
              >
                <span aria-hidden="true">{unidad === 'celsius' ? '°C' : '°F'}</span>
                <span className="sr-only">
                  Unidad actual: {unidad === 'celsius' ? 'Celsius' : 'Fahrenheit'}. Pulse para alternar.
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
