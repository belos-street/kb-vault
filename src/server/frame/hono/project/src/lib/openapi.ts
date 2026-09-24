import { z } from '@hono/zod-openapi'
import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '../types'
import { validationHook } from './validator'

/** 业务 API 工厂：统一注入 defaultHook（校验失败 → VALIDATION_ERROR 信封） */
export const createOpenAPI = () => new OpenAPIHono<Env>({ defaultHook: validationHook })

/** OpenAPI content 声明辅助 */
export const jsonContent = <T extends z.ZodType>(schema: T) => ({
  'application/json': { schema },
})
