import { manejar } from '../../../../src/lib/api-handler';
import { getBuscarHandler } from '../../../../src/handlers/buscar.handler';

export const runtime = 'nodejs';
export const GET = (request: Request) =>
  manejar((req: Request) => getBuscarHandler(req))(request);
