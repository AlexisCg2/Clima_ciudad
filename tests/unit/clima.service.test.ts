import { describe, it, expect } from 'vitest';
import { ClimaService, RepositorioCacheMemoria } from '../../src/services/clima.service';
import { ClienteOpenMeteo, type RespuestaOpenMeteoClima } from '../../src/lib/open-meteo';
import { ErrorValidacion } from '../../src/lib/errores';

describe('Servicio de Dominio ClimaService (Caché 15 min, °C/°F y Normalización)', () => {
  const respuestaOpenMeteoBase: RespuestaOpenMeteoClima = {
    latitude: 4.6097,
    longitude: -74.0817,
    timezone: 'America/Bogota',
    current: {
      time: '2026-11-14T12:00',
      temperature_2m: 20.0,
      relative_humidity_2m: 60,
      apparent_temperature: 20.0,
      weather_code: 0,
      wind_speed_10m: 10.0,
    },
    hourly: {
      time: ['2026-11-14T12:00', '2026-11-14T13:00'],
      temperature_2m: [20.0, 25.0],
      relative_humidity_2m: [60, 55],
      apparent_temperature: [20.0, 25.0],
      precipitation_probability: [0, 5],
      weather_code: [0, 1],
      wind_speed_10m: [10.0, 12.0],
    },
    daily: {
      time: ['2026-11-14'],
      weather_code: [0],
      temperature_2m_max: [25.0],
      temperature_2m_min: [10.0],
      apparent_temperature_max: [25.0],
      apparent_temperature_min: [10.0],
      precipitation_probability_max: [0],
      sunrise: ['2026-11-14T05:45'],
      sunset: ['2026-11-14T17:45'],
    },
  };

  it('calcula conversiones Fahrenheit y mapea descripciones WMO', async () => {
    let llamadas = 0;
    const mockFetch = async (): Promise<Response> => {
      llamadas++;
      return new Response(JSON.stringify(respuestaOpenMeteoBase), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });
    const cache = new RepositorioCacheMemoria();
    const servicio = new ClimaService(cliente, cache);

    const ahora = new Date('2026-11-14T12:00:00.000Z');
    const datos = await servicio.obtenerClima(4.6097, -74.0817, ahora);

    expect(llamadas).toBe(1);
    expect(datos.temperaturaActualCelsius).toBe(20.0);
    expect(datos.temperaturaActualFahrenheit).toBe(68.0); // 20 * 9/5 + 32 = 68
    expect(datos.descripcion).toBe('Cielo despejado');
    expect(datos.icono).toBe('sol');
    expect(datos.desdeCache).toBe(false);
    expect(datos.antiguedadMinutos).toBe(0);

    // Verificación de horas (25 °C -> 77 °F)
    expect(datos.pronostico24Horas[1]?.temperaturaFahrenheit).toBe(77.0);

    // Verificación de días (10 °C min -> 50 °F, 25 °C max -> 77 °F)
    expect(datos.pronostico7Dias[0]?.temperaturaMinFahrenheit).toBe(50.0);
    expect(datos.pronostico7Dias[0]?.temperaturaMaxFahrenheit).toBe(77.0);
  });

  it('segunda llamada dentro de los 15 minutos lee de caché sin invocar a Open-Meteo', async () => {
    let llamadas = 0;
    const mockFetch = async (): Promise<Response> => {
      llamadas++;
      return new Response(JSON.stringify(respuestaOpenMeteoBase), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });
    const cache = new RepositorioCacheMemoria();
    const servicio = new ClimaService(cliente, cache);

    const t0 = new Date('2026-11-14T12:00:00.000Z');
    await servicio.obtenerClima(4.61, -74.08, t0);
    expect(llamadas).toBe(1);

    // Consulta 8 minutos después
    const t8 = new Date('2026-11-14T12:08:00.000Z');
    const datosCache = await servicio.obtenerClima(4.61, -74.08, t8);

    expect(llamadas).toBe(1); // No volvió a llamar a la API
    expect(datosCache.desdeCache).toBe(true);
    expect(datosCache.antiguedadMinutos).toBe(8);
  });

  it('llamada después de 15 minutos detecta caché expirada y refresca desde el conector', async () => {
    let llamadas = 0;
    const mockFetch = async (): Promise<Response> => {
      llamadas++;
      return new Response(JSON.stringify(respuestaOpenMeteoBase), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetch as typeof fetch });
    const cache = new RepositorioCacheMemoria();
    const servicio = new ClimaService(cliente, cache);

    const t0 = new Date('2026-11-14T12:00:00.000Z');
    await servicio.obtenerClima(4.61, -74.08, t0);
    expect(llamadas).toBe(1);

    // Consulta 16 minutos después (expirada)
    const t16 = new Date('2026-11-14T12:16:00.000Z');
    const datosRefrescados = await servicio.obtenerClima(4.61, -74.08, t16);

    expect(llamadas).toBe(2); // Invocó nuevamente al conector
    expect(datosRefrescados.desdeCache).toBe(false);
    expect(datosRefrescados.antiguedadMinutos).toBe(0);
  });

  it('rechaza coordenadas fuera de rango con ErrorValidacion', async () => {
    const cliente = new ClienteOpenMeteo();
    const servicio = new ClimaService(cliente);

    await expect(servicio.obtenerClima(95, 0)).rejects.toThrow(ErrorValidacion);
    await expect(servicio.obtenerClima(0, -185)).rejects.toThrow(ErrorValidacion);
  });
});
