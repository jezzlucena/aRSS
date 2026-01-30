import { Request } from 'express';

/**
 * Type-safe helper to get typed params from a request.
 * Use with Zod-validated params from validateParams middleware.
 *
 * @example
 * const { id } = getTypedParams<{ id: string }>(req);
 */
export function getTypedParams<T>(req: Request): T {
  return req.params as unknown as T;
}

/**
 * Type-safe helper to get typed query from a request.
 * Use with Zod-validated query from validateQuery middleware.
 *
 * @example
 * const { page, limit } = getTypedQuery<ArticleListParams>(req);
 */
export function getTypedQuery<T>(req: Request): T {
  return req.query as unknown as T;
}

/**
 * Type-safe helper to get typed body from a request.
 * Use with Zod-validated body from validate middleware.
 *
 * @example
 * const { email, password } = getTypedBody<LoginInput>(req);
 */
export function getTypedBody<T>(req: Request): T {
  return req.body as T;
}
