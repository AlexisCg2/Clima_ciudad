import { manejar } from '../../../src/lib/api-handler';
import { getClimaHandler } from '../../../src/handlers/clima.handler';

export const runtime = 'nodejs';
export const GET = (request: Request) =>
  manejar((req: Request) => getClimaHandler(req))(request);
