import 'dotenv/config'
import * as z from 'zod'

const envSchema = z.object({
  // 模型（全链路单模型；无 provider 前缀时按 OpenAI 兼容端点处理）
  DEFAULT_MODEL: z.string().default('deepseek-v4-flash'),
  // 可选：意图分类 / 摘要 / 评估 judge 单独指定，缺省回落 DEFAULT_MODEL
  CLASSIFIER_MODEL: z.string().optional(),

  // 数据库（业务数据 + checkpoint 同库）
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:postgres@localhost:5433/customer_service'),

  // Checkpointer 切换：memory=开发态（进程重启即失）/ postgres=默认持久化
  CHECKPOINTER: z.enum(['memory', 'postgres']).default('postgres'),

  // 中间件参数
  SUMMARIZE_TRIGGER_FRACTION: z.coerce.number().min(0).max(1).default(0.8),
  SUMMARIZE_KEEP_FRACTION: z.coerce.number().min(0).max(1).default(0.3),
  MODEL_CALL_THREAD_LIMIT: z.coerce.number().int().positive().default(25),
  // 模型上下文窗口（summarization 的 fraction 档位需要模型档案；
  // deepseek 类自定义模型名查不到内置档案，必须显式声明）
  MODEL_CONTEXT_WINDOW: z.coerce.number().int().positive().default(131072),
  MODEL_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),

  // 自建 trace / 评估输出
  TRACE_DIR: z.string().default('./data/traces'),
  EVAL_REPORT_DIR: z.string().default('./data/eval')
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
  // 运行时可直接交给 initChatModel 的初始化串
  mainModel: normalizeModel(parsed.data.DEFAULT_MODEL),
  classifierModel: normalizeModel(
    parsed.data.CLASSIFIER_MODEL ?? parsed.data.DEFAULT_MODEL
  )
}
