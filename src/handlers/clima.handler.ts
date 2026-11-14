import { respuestaJson } from '../lib/api-handler';
import { ErrorValidacion } from '../lib/errores';
import { ClienteOpenMeteo } from '../lib/open-meteo';
import { RepositorioCacheFirestore } from '../repositories/cache-clima.repository';
import { ClimaService } from '../services/clima.service';

let servicioClimaDefecto: ClimaService | null = null;

function obtenerServicioClima(): ClimaService {
  if (!servicioClimaDefecto) {
    const cliente = new ClienteOpenMeteo();
    const cache = new RepositorioCacheFirestore();
    servicioClimaDefecto = new ClimaService(cliente, cache);
  }
  return servicioClimaDefecto;
}

/**
 * Consulta el clima actual y pronóstico por horas y días para una coordenada.
 * GET /api/clima?lat=4.6097&lng=-74.0817
 */
export async function getClimaHandler(
  request: Request,
  servicioInyectado?: ClimaService
): Promise<Response> {
  const url = new URL(request.url);
  const latStr = url.searchParams.get('lat');
  const lngStr = url.searchParams.get('lng');

  if (latStr === null || lngStr === null) {
    throw new ErrorValidacion('Los parámetros "lat" y "lng" son requeridos en la consulta', [
      { campo: 'lat', mensaje: latStr === null ? 'Requerido' : 'OK' },
      { campo: 'lng', mensaje: lngStr === null ? 'Requerido' : 'OK' },
    ]);
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new ErrorValidacion('La latitud debe ser un número finito entre -90 y 90 grados', [
      { campo: 'lat', mensaje: 'Debe estar entre -90 y 90' },
    ]);
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new ErrorValidacion('La longitud debe ser un número finito entre -180 y 180 grados', [
      { campo: 'lng', mensaje: 'Debe estar entre -180 y 180' },
    ]);
  }

  const servicio = servicioInyectado ?? obtenerServicioClima();
  const datosClima = await servicio.obtenerClima(lat, lng);

  return respuestaJson(datosClima, 200, {
    'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60',
  });
}
