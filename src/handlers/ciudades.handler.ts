import { respuestaJson, respuestaVacia } from '../lib/api-handler';
import { requerirUsuario, verificarOrigenCsrf } from '../lib/auth-servidor';
import { ErrorValidacion } from '../lib/errores';
import { ClienteOpenMeteo } from '../lib/open-meteo';
import { RepositorioCiudadesFirestore } from '../repositories/ciudades.repository';
import { CiudadesService } from '../services/ciudades.service';
import type { EntradaCrearCiudadFavorita } from '../types/ciudad';
import type { AuthAdminLike } from '../lib/firebase-admin';

export interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

let servicioCiudadesFavoritasDefecto: CiudadesService | null = null;

function obtenerServicioFavoritas(): CiudadesService {
  if (!servicioCiudadesFavoritasDefecto) {
    const cliente = new ClienteOpenMeteo();
    const repo = new RepositorioCiudadesFirestore();
    servicioCiudadesFavoritasDefecto = new CiudadesService(cliente, repo);
  }
  return servicioCiudadesFavoritasDefecto;
}

/**
 * Lista las ciudades favoritas del usuario autenticado.
 * GET /api/ciudades
 */
export async function getCiudadesHandler(
  request: Request,
  servicioInyectado?: CiudadesService,
  authAdminInyectado?: AuthAdminLike
): Promise<Response> {
  const usuario = await requerirUsuario(request, authAdminInyectado);
  const servicio = servicioInyectado ?? obtenerServicioFavoritas();

  const ciudades = await servicio.listarFavoritas(usuario.uid);

  return respuestaJson(
    { ciudades },
    200,
    { 'Cache-Control': 'no-store' }
  );
}

/**
 * Agrega una nueva ciudad favorita (máximo 10 por usuario, transacción atómica).
 * POST /api/ciudades
 */
export async function postCiudadesHandler(
  request: Request,
  servicioInyectado?: CiudadesService,
  authAdminInyectado?: AuthAdminLike
): Promise<Response> {
  verificarOrigenCsrf(request);
  const usuario = await requerirUsuario(request, authAdminInyectado);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorValidacion('El cuerpo de la petición debe ser un objeto JSON válido');
  }

  const obj = cuerpo as Partial<EntradaCrearCiudadFavorita> & Record<string, unknown>;
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new ErrorValidacion('El cuerpo de la petición debe ser un objeto JSON válido');
  }

  // Prevención de Mass Assignment
  const camposPermitidos = new Set(['nombre', 'pais', 'lat', 'lng']);
  const camposDesconocidos = Object.keys(obj).filter((k) => !camposPermitidos.has(k));
  if (camposDesconocidos.length > 0) {
    throw new ErrorValidacion(
      `Campos no permitidos detectados (Mass Assignment prevenido): ${camposDesconocidos.join(', ')}`
    );
  }

  if (!obj.nombre || typeof obj.nombre !== 'string' || obj.nombre.trim().length === 0) {
    throw new ErrorValidacion('El nombre de la ciudad es obligatorio', [
      { campo: 'nombre', mensaje: 'Obligatorio' },
    ]);
  }

  if (obj.nombre.trim().length > 100) {
    throw new ErrorValidacion('El nombre de la ciudad no puede superar los 100 caracteres', [
      { campo: 'nombre', mensaje: 'Máximo 100 caracteres' },
    ]);
  }

  if (!obj.pais || typeof obj.pais !== 'string' || obj.pais.trim().length === 0) {
    throw new ErrorValidacion('El país es obligatorio', [
      { campo: 'pais', mensaje: 'Obligatorio' },
    ]);
  }

  if (obj.pais.trim().length > 100) {
    throw new ErrorValidacion('El país no puede superar los 100 caracteres', [
      { campo: 'pais', mensaje: 'Máximo 100 caracteres' },
    ]);
  }

  if (obj.lat === undefined || obj.lat === null || !Number.isFinite(obj.lat) || obj.lat < -90 || obj.lat > 90) {
    throw new ErrorValidacion('La latitud debe ser un número finito entre -90 y 90', [
      { campo: 'lat', mensaje: 'Debe estar entre -90 y 90' },
    ]);
  }

  if (obj.lng === undefined || obj.lng === null || !Number.isFinite(obj.lng) || obj.lng < -180 || obj.lng > 180) {
    throw new ErrorValidacion('La longitud debe ser un número finito entre -180 y 180', [
      { campo: 'lng', mensaje: 'Debe estar entre -180 y 180' },
    ]);
  }

  const servicio = servicioInyectado ?? obtenerServicioFavoritas();
  const nuevaFavorita = await servicio.agregarFavorita(usuario.uid, {
    nombre: obj.nombre.trim(),
    pais: obj.pais.trim(),
    lat: obj.lat,
    lng: obj.lng,
  });

  return respuestaJson(nuevaFavorita, 201, {
    'Cache-Control': 'no-store',
  });
}

/**
 * Elimina una ciudad favorita por su identificador.
 * DELETE /api/ciudades/[id]
 */
export async function deleteCiudadHandler(
  request: Request,
  contexto?: RouteContext,
  servicioInyectado?: CiudadesService,
  authAdminInyectado?: AuthAdminLike
): Promise<Response> {
  verificarOrigenCsrf(request);
  const usuario = await requerirUsuario(request, authAdminInyectado);

  if (!contexto || !contexto.params) {
    throw new ErrorValidacion('Parámetros de ruta ausentes');
  }

  const params = await Promise.resolve(contexto.params);
  const ciudadId = params.id;

  if (!ciudadId || typeof ciudadId !== 'string' || ciudadId.trim().length === 0) {
    throw new ErrorValidacion('El identificador de la ciudad es obligatorio', [
      { campo: 'id', mensaje: 'Obligatorio' },
    ]);
  }

  const servicio = servicioInyectado ?? obtenerServicioFavoritas();
  await servicio.eliminarFavorita(usuario.uid, ciudadId.trim());

  return respuestaVacia(204, {
    'Cache-Control': 'no-store',
  });
}
