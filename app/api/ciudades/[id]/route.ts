import { manejar } from '../../../../src/lib/api-handler';
import { deleteCiudadHandler } from '../../../../src/handlers/ciudades.handler';

export const runtime = 'nodejs';
export const DELETE = (
  request: Request,
  context: { params: Promise<{ id: string }> }
) =>
  manejar((req: Request) => deleteCiudadHandler(req, context))(request);
