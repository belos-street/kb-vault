import type { Block } from '../data/types.ts'
import { lesson11 } from './lesson-1-1.ts'
import { lesson12 } from './lesson-1-2.ts'
import { lesson13 } from './lesson-1-3.ts'
import { lesson14 } from './lesson-1-4.ts'
import { lesson21 } from './lesson-2-1.ts'
import { lesson22 } from './lesson-2-2.ts'
import { lesson23 } from './lesson-2-3.ts'
import { lesson24 } from './lesson-2-4.ts'
import { lesson25 } from './lesson-2-5.ts'
import { lesson26 } from './lesson-2-6.ts'
import { lesson31 } from './lesson-3-1.ts'

// 讲义总表：新增讲次时在此登记，页面与 Zod 校验共用同一份数据。
export const contents: Record<string, Record<string, Block[]>> = {
  s1: {
    's1-1': lesson11,
    's1-2': lesson12,
    's1-3': lesson13,
    's1-4': lesson14
  },
  s2: {
    's2-1': lesson21,
    's2-2': lesson22,
    's2-3': lesson23,
    's2-4': lesson24,
    's2-5': lesson25,
    's2-6': lesson26
  },
  s3: { 's3-1': lesson31 }
}
