import { describe, it, expect } from 'vitest';
import { ClienteOpenMeteo } from '../../src/lib/open-meteo';
import { ErrorServicioExterno, ErrorTimeoutServicio, ErrorValidacion } from '../../src/lib/errores';

describe('Cliente Open-Meteo (Fetch Hermético sin Red Externa)', () => {
  const respuestaClimaSimulada = {
    latitude: 4.61,
    longitude: -74.08,
    timezone: 'America/Bogota',
    current: {
      time: '2026-11-14T12:00',
      temperature_2m: 19.5,
      relative_humidity_2m: 65,
      apparent_temperature: 19.0,
      weather_code: 2,
      wind_speed_10m: 12.0,
    },
    hourly: {
      time: ['2026-11-14T12:00', '2026-11-14T13:00'],
      temperature_2m: [19.5, 20.1],
      relative_humidity_2m: [65, 62],
      apparent_temperature: [19.0, 19.8],
      precipitation_probability: [10, 15],
      weather_code: [2, 3],
      wind_speed_10m: [12.0, 14.2],
    },
    daily: {
      time: ['2026-11-14'],
      weather_code: [2],
      temperature_2m_max: [21.0],
      temperature_2m_min: [11.5],
      apparent_temperature_max: [20.5],
      apparent_temperature_min: [11.0],
      precipitation_probability_max: [20],
      sunrise: ['2026-11-14T05:45'],
      sunset: ['2026-11-14T17:45'],
    },
  };

  it('consultarPronostico ejecuta petición con URL y parámetros correctos', async () => {
    let urlLlamada = '';
    const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
      urlLlamada = input.toString();
      return new Response(JSON.stringify(respuestaClimaSimulada), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });
    const res = await cliente.consultarPronostico(4.61, -74.08);

    expect(urlLlamada).toContain('latitude=4.61');
    expect(urlLlamada).toContain('longitude=-74.08');
    expect(res.current.temperature_2m).toBe(19.5);
    expect(res.timezone).toBe('America/Bogota');
  });

  it('consultarPronostico lanza ErrorValidacion si las coordenadas no son números finitos', async () => {
    const cliente = new ClienteOpenMeteo();
    await expect(cliente.consultarPronostico(NaN, 10)).rejects.toThrow(ErrorValidacion);
  });

  it('consultarPronostico lanza ErrorServicioExterno (HTTP 502) si la API externa responde 500', async () => {
    const mockFetch = async (): Promise<Response> => {
      return new Response('Servidor sobrecargado', { status: 503, statusText: 'Service Unavailable' });
    };
    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });

    await expect(cliente.consultarPronostico(4.61, -74.08)).rejects.toThrow(ErrorServicioExterno);
  });

  it('consultarPronostico lanza ErrorTimeoutServicio (HTTP 504) ante timeout o abort', async () => {
    const mockFetch = async (): Promise<Response> => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'TimeoutError';
      throw err;
    };
    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });

    await expect(cliente.consultarPronostico(4.61, -74.08)).rejects.toThrow(ErrorTimeoutServicio);
  });

  it('buscarCiudades valida la longitud del término (2 a 60 caracteres)', async () => {
    const cliente = new ClienteOpenMeteo();
    await expect(cliente.buscarCiudades('a')).rejects.toThrow(ErrorValidacion);
    await expect(cliente.buscarCiudades(' '.repeat(10))).rejects.toThrow(ErrorValidacion);
    await expect(cliente.buscarCiudades('x'.repeat(61))).rejects.toThrow(ErrorValidacion);
  });

  it('buscarCiudades mapea y normaliza resultados geográficos de Open-Meteo', async () => {
    const mockFetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          results: [
            {
              id: 3688689,
              name: 'Bogotá',
              latitude: 4.60971,
              longitude: -74.08175,
              country: 'Colombia',
              country_code: 'CO',
              admin1: 'Bogota D.C.',
              timezone: 'America/Bogota',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });
    const resultados = await cliente.buscarCiudades('Bogota');

    expect(resultados).toHaveLength(1);
    expect(resultados[0]?.nombre).toBe('Bogotá');
    expect(resultados[0]?.pais).toBe('Colombia');
    expect(resultados[0]?.region).toBe('Bogota D.C.');
    expect(resultados[0]?.lat).toBe(4.60971);
  });
});
