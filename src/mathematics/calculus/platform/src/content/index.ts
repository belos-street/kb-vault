import type { Block } from '../data/types.ts'
import { ch1Content } from './ch1.ts'

// 讲义内容总表：新增章节时在此登记，页面与 Zod 校验共用同一份数据。
export const contents: Record<string, Record<string, Block[]>> = {
  ch1: ch1Content
}
