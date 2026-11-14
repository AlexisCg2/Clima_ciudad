import { manejar } from '../../../../src/lib/api-handler';
import {
  postSesionHandler,
  deleteSesionHandler,
} from '../../../../src/handlers/auth-sesion.handler';

export const runtime = 'nodejs';
export const POST = (request: Request) =>
  manejar((req: Request) => postSesionHandler(req))(request);
export const DELETE = (request: Request) =>
  manejar((req: Request) => deleteSesionHandler(req))(request);
