import { manejar } from '../../../src/lib/api-handler';
import {
  getCiudadesHandler,
  postCiudadesHandler,
} from '../../../src/handlers/ciudades.handler';

export const runtime = 'nodejs';
export const GET = (request: Request) =>
  manejar((req: Request) => getCiudadesHandler(req))(request);
export const POST = (request: Request) =>
  manejar((req: Request) => postCiudadesHandler(req))(request);
