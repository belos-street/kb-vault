import type { Context } from 'hono'
import { z } from 'zod'
import { fail } from './response'

type HookResult = { success: true; data: unknown } | { success: false; error: z.ZodError }

/**
 * 校验失败 → 统一 VALIDATION_ERROR 信封。
 * 用法：作为 OpenAPIHono 的 defaultHook（zValidator hook 同款语义）。
 */
export const validationHook = (result: HookResult, c: Context) => {
  if (!result.success) {
    return fail(c, 'VALIDATION_ERROR', '参数校验失败', 400, z.prettifyError(result.error))
  }
}
