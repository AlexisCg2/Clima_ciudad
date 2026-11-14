import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EstadoError, EstadoVacio } from '../../src/components/EstadosUI';
import { ClimaActual } from '../../src/components/ClimaActual';
import { BotonFavorita } from '../../src/components/BotonFavorita';
import { BuscadorCiudades } from '../../src/components/BuscadorCiudades';
import type { DatosClima } from '../../src/types/clima';

const mockDatosClima: DatosClima = {
  coordenadas: { lat: 4.61, lng: -74.08 },
  zonaHoraria: 'America/Bogota',
  obtenidoEn: '2026-11-14T12:00:00.000Z',
  antiguedadMinutos: 0,
  desdeCache: false,
  temperaturaActualCelsius: 18.5,
  temperaturaActualFahrenheit: 65.3,
  sensacionTermicaCelsius: 18.0,
  sensacionTermicaFahrenheit: 64.4,
  humedadRelativa: 65,
  velocidadVientoKmH: 12.0,
  codigoWmo: 0,
  descripcion: 'Cielo despejado',
  icono: '☀️',
  pronostico24Horas: [
    {
      hora: '2026-11-14T13:00:00.000Z',
      temperaturaCelsius: 19.0,
      temperaturaFahrenheit: 66.2,
      sensacionTermicaCelsius: 19.0,
      sensacionTermicaFahrenheit: 66.2,
      codigoWmo: 0,
      descripcion: 'Cielo despejado',
      probabilidadPrecipitacion: 5,
      humedadRelativa: 60,
      velocidadVientoKmH: 10,
    },
  ],
  pronostico7Dias: [
    {
      fecha: '2026-11-14',
      temperaturaMinCelsius: 10.0,
      temperaturaMaxCelsius: 20.0,
      temperaturaMinFahrenheit: 50.0,
      temperaturaMaxFahrenheit: 68.0,
      codigoWmo: 0,
      descripcion: 'Cielo despejado',
      probabilidadPrecipitacionMax: 10,
      amanecer: '2026-11-14T06:00:00.000Z',
      atardecer: '2026-11-14T18:00:00.000Z',
    },
  ],
};

describe('Componentes Accesibles con React Testing Library (WCAG 2.2 AA y Sección 11)', () => {
  // 1. RTL: EstadoError con Reintentar
  it('EstadoError muestra el rol alert, el mensaje de fallo y ejecuta onReintentar', async () => {
    const handleReintentar = vi.fn();
    render(<EstadoError mensaje="Servicio meteorológico no disponible" onReintentar={handleReintentar} />);

    // Consulta por rol semántico accesible (no por clases CSS)
    const alerta = screen.getByRole('alert');
    expect(alerta).toBeInTheDocument();
    expect(screen.getByText('Servicio meteorológico no disponible')).toBeInTheDocument();

    const botonReintentar = screen.getByRole('button', { name: /reintentar/i });
    expect(botonReintentar).toBeInTheDocument();

    await userEvent.click(botonReintentar);
    expect(handleReintentar).toHaveBeenCalledTimes(1);
  });

  // 2. EstadoVacio
  it('EstadoVacio muestra encabezado y descripción accesible', () => {
    render(
      <EstadoVacio
        titulo="No hay ciudades favoritas"
        descripcion="Agregue ciudades para visualizarlas aquí."
      />
    );
    expect(screen.getByRole('heading', { level: 2, name: 'No hay ciudades favoritas' })).toBeInTheDocument();
    expect(screen.getByText('Agregue ciudades para visualizarlas aquí.')).toBeInTheDocument();
  });

  // 3. ClimaActual
  it('ClimaActual renderiza encabezado de ciudad, temperatura y botón accesible de ubicación', async () => {
    const handleUbicacion = vi.fn();
    render(
      <ClimaActual
        datos={mockDatosClima}
        nombreCiudad="Bogotá"
        paisCiudad="Colombia"
        unidad="celsius"
        onSolicitarUbicacion={handleUbicacion}
      />
    );

    // Consulta por rol de título h1
    expect(screen.getByRole('heading', { level: 1, name: /bogotá, colombia/i })).toBeInTheDocument();

    // Consulta por botón de geolocalización accesible
    const botonUbicacion = screen.getByRole('button', { name: /obtener clima para mi ubicación actual/i });
    expect(botonUbicacion).toBeInTheDocument();

    await userEvent.click(botonUbicacion);
    expect(handleUbicacion).toHaveBeenCalledTimes(1);

    // Muestra temperatura en Celsius
    expect(screen.getByText(/18[,.]5/)).toBeInTheDocument();
    expect(screen.getByText(/Sensación térmica:/i)).toBeInTheDocument();
  });

  // 4. BotonFavorita
  it('BotonFavorita gestiona estado aria-pressed y etiquetas accesibles de favoritos', async () => {
    // Mock de fetch para POST /api/ciudades
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'fav-123',
        nombre: 'Medellín',
        pais: 'Colombia',
        lat: 6.25,
        lng: -75.56,
        agregadaEn: new Date().toISOString(),
      }),
    } as unknown as Response);

    const handleCambio = vi.fn();
    render(
      <BotonFavorita
        nombre="Medellín"
        pais="Colombia"
        lat={6.25}
        lng={-75.56}
        esFavoritaInicialmente={false}
        onCambioEstado={handleCambio}
      />
    );

    const boton = screen.getByRole('button', { name: /agregar a favoritas/i });
    expect(boton).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(boton);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/ciudades', expect.objectContaining({ method: 'POST' }));
  });

  // 5. BuscadorCiudades
  it('BuscadorCiudades renderiza combobox con label accesible asociado', () => {
    const handleSeleccion = vi.fn();
    render(<BuscadorCiudades onSeleccionarCiudad={handleSeleccion} />);

    // Comprobación de etiqueta accesible mediante getByLabelText
    const input = screen.getByLabelText('Buscar ciudad por nombre');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });
});
