import type { Context, TypedResponse } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

/** 统一信封：成功 { code, data }，失败 { code, message, details? } */
export function ok<T>(c: Context, data: T): TypedResponse<{ code: 'OK'; data: T }, 200, 'json'>
export function ok<T, S extends ContentfulStatusCode>(
  c: Context,
  data: T,
  status: S,
): TypedResponse<{ code: 'OK'; data: T }, S, 'json'>
export function ok<T, S extends ContentfulStatusCode>(c: Context, data: T, status?: S) {
  return c.json({ code: 'OK' as const, data }, (status ?? 200) as S)
}

export const fail = (
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode,
  details?: unknown,
) => c.json(details === undefined ? { code, message } : { code, message, details }, status)
