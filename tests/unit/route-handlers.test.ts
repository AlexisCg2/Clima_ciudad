import { describe, it, expect } from 'vitest';
import { getClimaHandler } from '../../src/handlers/clima.handler';
import { getBuscarHandler } from '../../src/handlers/buscar.handler';
import { postSesionHandler, deleteSesionHandler } from '../../src/handlers/auth-sesion.handler';
import { getYoHandler } from '../../src/handlers/auth-yo.handler';
import { getCiudadesHandler, postCiudadesHandler, deleteCiudadHandler } from '../../src/handlers/ciudades.handler';

import { ClimaService, RepositorioCacheMemoria } from '../../src/services/clima.service';
import { CiudadesService, RepositorioCiudadesMemoria } from '../../src/services/ciudades.service';
import { ClienteOpenMeteo } from '../../src/lib/open-meteo';
import type { AuthAdminLike } from '../../src/lib/firebase-admin';

describe('Route Handlers de Next.js (Invocación con new Request, Sección 9 y 11)', () => {
  const mockAuthAdmin: AuthAdminLike = {
    async createSessionCookie(idToken) {
      return `sesion_${idToken}`;
    },
    async verifySessionCookie(cookie) {
      if (cookie === 'sesion_valida') {
        return { uid: 'usr_test_1', email: 'test@example.com', rol: 'usuario' };
      }
      throw new Error('Invalida');
    },
    async verifyIdToken() {
      return { uid: 'usr_bearer', email: 'bearer@example.com' };
    },
    async revokeRefreshTokens() {},
  };

  const mockFetchClima = async () =>
    new Response(
      JSON.stringify({
        latitude: 4.61,
        longitude: -74.08,
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
          time: ['2026-11-14T12:00'],
          temperature_2m: [20.0],
          relative_humidity_2m: [60],
          apparent_temperature: [20.0],
          precipitation_probability: [0],
          weather_code: [0],
          wind_speed_10m: [10.0],
        },
        daily: {
          time: ['2026-11-14'],
          weather_code: [0],
          temperature_2m_max: [22.0],
          temperature_2m_min: [12.0],
          apparent_temperature_max: [22.0],
          apparent_temperature_min: [12.0],
          precipitation_probability_max: [0],
          sunrise: ['2026-11-14T05:45'],
          sunset: ['2026-11-14T17:45'],
        },
      }),
      { status: 200 }
    );

  it('GET /api/clima responde 200 con Cache-Control ante coordenadas válidas', async () => {
    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetchClima as typeof fetch });
    const cache = new RepositorioCacheMemoria();
    const servicio = new ClimaService(cliente, cache);

    const req = new Request('http://localhost:3000/api/clima?lat=4.6097&lng=-74.0817');
    const res = await getClimaHandler(req, servicio);

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=900');
    const datos = (await res.json()) as { temperaturaActualCelsius: number; descripcion: string };
    expect(datos.temperaturaActualCelsius).toBe(20.0);
    expect(datos.descripcion).toBe('Cielo despejado');
  });

  it('GET /api/clima responde 400 si faltan coordenadas o están fuera de rango', async () => {
    const reqFalta = new Request('http://localhost:3000/api/clima');
    await expect(getClimaHandler(reqFalta)).rejects.toThrow();

    const reqFueraRango = new Request('http://localhost:3000/api/clima?lat=95&lng=0');
    await expect(getClimaHandler(reqFueraRango)).rejects.toThrow();
  });

  it('GET /api/ciudades/buscar responde 200 con lista de ciudades', async () => {
    const mockFetchGeocoding = async () =>
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1,
              name: 'Bogotá',
              country: 'Colombia',
              country_code: 'CO',
              latitude: 4.6097,
              longitude: -74.0817,
              timezone: 'America/Bogota',
            },
          ],
        }),
        { status: 200 }
      );

    const cliente = new ClienteOpenMeteo({ fetchFn: mockFetchGeocoding as typeof fetch });
    const servicio = new CiudadesService(cliente);

    const req = new Request('http://localhost:3000/api/ciudades/buscar?q=Bogota');
    const res = await getBuscarHandler(req, servicio);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ciudades: Array<{ nombre: string }> };
    expect(body.ciudades).toHaveLength(1);
    expect(body.ciudades[0]?.nombre).toBe('Bogotá');
  });

  it('POST /api/auth/sesion intercambia idToken y responde 204 con Set-Cookie', async () => {
    const req = new Request('http://localhost:3000/api/auth/sesion', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ idToken: 'token_cliente_firebase' }),
    });

    const res = await postSesionHandler(req, mockAuthAdmin);
    expect(res.status).toBe(204);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('sesion=sesion_token_cliente_firebase');
    expect(setCookie).toContain('HttpOnly');
  });

  it('DELETE /api/auth/sesion responde 204 y limpia la cookie de sesión', async () => {
    const req = new Request('http://localhost:3000/api/auth/sesion', {
      method: 'DELETE',
      headers: {
        origin: 'http://localhost:3000',
        cookie: 'sesion=sesion_valida',
      },
    });

    const res = await deleteSesionHandler(req, mockAuthAdmin);
    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('GET /api/auth/yo responde 200 con la identidad del usuario si la sesión es válida', async () => {
    const req = new Request('http://localhost:3000/api/auth/yo', {
      headers: { cookie: 'sesion=sesion_valida' },
    });

    const res = await getYoHandler(req, mockAuthAdmin);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { usuario: { uid: string; correo: string } };
    expect(body.usuario.uid).toBe('usr_test_1');
    expect(body.usuario.correo).toBe('test@example.com');
  });

  it('GET /api/ciudades y POST /api/ciudades administran favoritas del usuario', async () => {
    const repo = new RepositorioCiudadesMemoria();
    const cliente = new ClienteOpenMeteo();
    const servicio = new CiudadesService(cliente, repo);

    // 1. POST /api/ciudades
    const reqPost = new Request('http://localhost:3000/api/ciudades', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        cookie: 'sesion=sesion_valida',
      },
      body: JSON.stringify({
        nombre: 'Cali',
        pais: 'Colombia',
        lat: 3.4516,
        lng: -76.532,
      }),
    });

    const resPost = await postCiudadesHandler(reqPost, servicio, mockAuthAdmin);
    expect(resPost.status).toBe(201);
    const creada = (await resPost.json()) as { id: string; nombre: string };
    expect(creada.nombre).toBe('Cali');
    expect(creada.id).toBeDefined();

    // 2. GET /api/ciudades
    const reqGet = new Request('http://localhost:3000/api/ciudades', {
      headers: { cookie: 'sesion=sesion_valida' },
    });
    const resGet = await getCiudadesHandler(reqGet, servicio, mockAuthAdmin);
    expect(resGet.status).toBe(200);
    const bodyGet = (await resGet.json()) as { ciudades: Array<{ id: string }> };
    expect(bodyGet.ciudades).toHaveLength(1);

    // 3. DELETE /api/ciudades/[id]
    const reqDelete = new Request(`http://localhost:3000/api/ciudades/${creada.id}`, {
      method: 'DELETE',
      headers: {
        origin: 'http://localhost:3000',
        cookie: 'sesion=sesion_valida',
      },
    });
    const resDelete = await deleteCiudadHandler(
      reqDelete,
      { params: { id: creada.id } },
      servicio,
      mockAuthAdmin
    );
    expect(resDelete.status).toBe(204);
  });

  it('POST /api/ciudades rechaza campos no permitidos (Mass Assignment)', async () => {
    const repo = new RepositorioCiudadesMemoria();
    const cliente = new ClienteOpenMeteo();
    const servicio = new CiudadesService(cliente, repo);

    const reqMalicioso = new Request('http://localhost:3000/api/ciudades', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        cookie: 'sesion=sesion_valida',
      },
      body: JSON.stringify({
        nombre: 'Barranquilla',
        pais: 'Colombia',
        lat: 10.9639,
        lng: -74.7964,
        rolInyectado: 'admin',
        uidInyectado: 'root',
      }),
    });

    await expect(postCiudadesHandler(reqMalicioso, servicio, mockAuthAdmin)).rejects.toThrow();
  });
});
