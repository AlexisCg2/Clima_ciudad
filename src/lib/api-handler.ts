import { serializarError } from './errores';

/**
 * Envoltorio común para Route Handlers de Next.js (Sección 9.2).
 * Captura excepciones, previene caídas no controladas y devuelve respuestas
 * con el formato de error canónico { error, detalles? }.
 */

export type RouteHandler<TContext = unknown> = (
  request: Request,
  contexto?: TContext
) => Promise<Response>;

/**
 * Genera una respuesta JSON estándar.
 */
export function respuestaJson(
  datos: unknown,
  status = 200,
  headersAdicionales: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headersAdicionales,
    },
  });
}

/**
 * Genera una respuesta HTTP 204 sin contenido.
 */
export function respuestaVacia(status = 204, headersAdicionales: HeadersInit = {}): Response {
  return new Response(null, {
    status,
    headers: headersAdicionales,
  });
}

/**
 * Envoltorio unificado para capturar errores y garantizar contratos REST consistentes.
 */
export function manejar<TContext = unknown>(handler: RouteHandler<TContext>): RouteHandler<TContext> {
  return async (request: Request, contexto?: TContext): Promise<Response> => {
    try {
      return await handler(request, contexto);
    } catch (error: unknown) {
      const { codigoHttp, cuerpo } = serializarError(error);

      return new Response(JSON.stringify(cuerpo), {
        status: codigoHttp,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }
  };
}
