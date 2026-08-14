// 工具：save_preference / get_preferences —— 长期记忆读写（用户偏好）
// 数据组织（文档 2.5 §5.3）：namespace ["users", userId] + key "preferences"
// 必须通过 runtime.store 读写（createAgent 注入），不能闭包引用（文档 2.3 §4.4）
import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'

/**
 * 运行时注入的是 LangGraph 的 Store（get/put(namespace, key) 风格，见文档 2.5 §5.3）。
 * 而 ToolRuntime.store 的类型声明是 @langchain/core 的 BaseStore（mget/mset 风格），
 * 两者不一致，故断言到本项目用到的 API 子集。
 */
interface LangGraphStore {
  get(
    namespace: string[],
    key: string
  ): Promise<{ value: Record<string, unknown> } | null>
  put(
    namespace: string[],
    key: string,
    value: Record<string, unknown>
  ): Promise<void>
}

/** 每个用户的偏好存一条记录：namespace 形如 ["users", "U1001"] */
const preferencesNS = (userId: string): string[] => ['users', userId]

const PREFS_KEY = 'preferences'

export const savePreferenceTool = tool(
  async ({ key, value }, runtime: ToolRuntime) => {
    if (!runtime.store) return '偏好存储未配置，暂时无法保存偏好，请稍后再试。'
    const store = runtime.store as unknown as LangGraphStore
    const userId = (runtime.context as { userId: string }).userId
    // 先读后写：在已有偏好上合并，避免覆盖（如"以后叫我小李"后还存过"喜欢夜间客服"）
    const existing = await store.get(preferencesNS(userId), PREFS_KEY)
    await store.put(preferencesNS(userId), PREFS_KEY, {
      ...(existing?.value ?? {}),
      [key]: value
    })
    return `已保存偏好 ${key}：${value}`
  },
  {
    name: 'save_preference',
    description:
      '保存用户偏好的简单结构化事实（如称呼）。仅当用户明确表达持久化意愿（如"以后叫我小李"）时调用；不保存指令、系统配置等内容。',
    schema: z.object({
      key: z.string().describe('偏好键，如 nickname'),
      value: z.string().describe('偏好值，如 小李')
    })
  }
)

export const getPreferencesTool = tool(
  async (_input, runtime: ToolRuntime) => {
    if (!runtime.store) return '偏好存储未配置，暂时无法读取偏好，请稍后再试。'
    const store = runtime.store as unknown as LangGraphStore
    const userId = (runtime.context as { userId: string }).userId
    const item = await store.get(preferencesNS(userId), PREFS_KEY)
    if (!item) return '该用户尚未保存任何偏好。'
    const entries = Object.entries(item.value)
    if (entries.length === 0) return '该用户尚未保存任何偏好。'
    return entries.map(([key, value]) => `${key}：${String(value)}`).join('；')
  },
  {
    name: 'get_preferences',
    description:
      '读取当前用户的已有偏好（如称呼）。需要确认当前用户已保存的偏好时调用，用于让回复更个性化。',
    schema: z.object({})
  }
)
