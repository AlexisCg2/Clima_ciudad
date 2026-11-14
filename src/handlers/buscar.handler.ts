import { respuestaJson } from '../lib/api-handler';
import { ErrorValidacion } from '../lib/errores';
import { ClienteOpenMeteo } from '../lib/open-meteo';
import { CiudadesService } from '../services/ciudades.service';

let servicioCiudadesDefecto: CiudadesService | null = null;

function obtenerServicioCiudades(): CiudadesService {
  if (!servicioCiudadesDefecto) {
    const cliente = new ClienteOpenMeteo();
    servicioCiudadesDefecto = new CiudadesService(cliente);
  }
  return servicioCiudadesDefecto;
}

/**
 * Busca ciudades por nombre en el servicio geográfico.
 * GET /api/ciudades/buscar?q=Bogota&limite=10
 */
export async function getBuscarHandler(
  request: Request,
  servicioInyectado?: CiudadesService
): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  if (!q) {
    throw new ErrorValidacion('El parámetro de búsqueda "q" es obligatorio', [
      { campo: 'q', mensaje: 'Requerido' },
    ]);
  }

  const qLimpio = q.trim();
  if (qLimpio.length < 2 || qLimpio.length > 60) {
    throw new ErrorValidacion('El texto de búsqueda debe tener entre 2 y 60 caracteres', [
      { campo: 'q', mensaje: 'Longitud permitida: 2 a 60 caracteres' },
    ]);
  }

  const limiteParam = url.searchParams.get('limite');
  const limite = limiteParam ? parseInt(limiteParam, 10) : 10;
  const limiteNormalizado = Number.isFinite(limite) ? Math.min(Math.max(limite, 1), 20) : 10;

  const servicio = servicioInyectado ?? obtenerServicioCiudades();
  const ciudades = await servicio.buscar(qLimpio, limiteNormalizado);

  return respuestaJson(
    { ciudades },
    200,
    { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }
  );
}
