import 'dotenv/config'
import * as z from 'zod'

const envSchema = z.object({
  // 模型（OpenAI 兼容端点；无 provider 前缀时按 openai: 处理）
  DEFAULT_MODEL: z.string().default('deepseek-v4-flash'),
  // 图表专家 / 路由 / RAG 打分用的低成本档，缺省回落 DEFAULT_MODEL
  CHART_MODEL: z.string().optional(),

  // 数据与报告
  ANALYTICS_DB_PATH: z.string().default('./data/analytics.db'),
  REPORTS_DIR: z.string().default('./data/reports'),
  MCP_SERVER_ENTRY: z.string().default('./mcp-server/index.ts'),
  SQL_MAX_ROWS: z.coerce.number().int().positive().default(500)
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('\n')
  console.error(`[config] 环境变量校验失败：\n${detail}`)
  process.exit(1)
}

// 无 provider 前缀的模型串按 OpenAI 兼容端点处理（deepseek-v4-flash → openai:deepseek-v4-flash）
function normalizeModel(model: string): string {
  return model.includes(':') ? model : `openai:${model}`
}

export const config = {
  ...parsed.data,
  mainModel: normalizeModel(parsed.data.DEFAULT_MODEL),
  chartModel: normalizeModel(
    parsed.data.CHART_MODEL || parsed.data.DEFAULT_MODEL
  )
}
