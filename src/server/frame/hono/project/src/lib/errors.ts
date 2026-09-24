import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export const statusByCode: Record<ApiErrorCode, ContentfulStatusCode> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

export const codeByStatus = (status: number): ApiErrorCode => {
  const matched = (Object.keys(statusByCode) as ApiErrorCode[]).find(
    (k) => statusByCode[k] === status,
  )
  return matched ?? 'INTERNAL'
}

/** 业务异常：code 对应统一信封，status 由 code 推导 */
export class ApiError extends HTTPException {
  readonly code: ApiErrorCode
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(statusByCode[code], { message })
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

export const apiError = {
  validation: (message = '参数校验失败', details?: unknown) =>
    new ApiError('VALIDATION_ERROR', message, details),
  unauthorized: (message = '未认证') => new ApiError('UNAUTHORIZED', message),
  forbidden: (message = '无权限') => new ApiError('FORBIDDEN', message),
  notFound: (message = '资源不存在') => new ApiError('NOT_FOUND', message),
  conflict: (message = '资源状态冲突，请刷新后重试') => new ApiError('CONFLICT', message),
  unprocessable: (message = '请求无法处理') => new ApiError('UNPROCESSABLE', message),
  rateLimited: (message = '请求过于频繁') => new ApiError('RATE_LIMITED', message),
  internal: (message = '服务器内部错误') => new ApiError('INTERNAL', message),
}
