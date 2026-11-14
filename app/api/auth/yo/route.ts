import { manejar } from '../../../../src/lib/api-handler';
import { getYoHandler } from '../../../../src/handlers/auth-yo.handler';

export const runtime = 'nodejs';
export const GET = (request: Request) =>
  manejar((req: Request) => getYoHandler(req))(request);
