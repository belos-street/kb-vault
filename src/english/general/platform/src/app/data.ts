import raw from '../../../book-01-foundation/01-句子工程/L01-句子成分与五大句型/lesson.json'
import { lessonSchema, type Lesson } from '../schema/lesson.ts'

// 构建期即校验：lesson.json 不合 schema 直接构建失败
export const lesson: Lesson = lessonSchema.parse(raw)

/** 当前 v1 固定单讲；F5 课程导航接入后改为清单 */
export const lessons: Lesson[] = [lesson]
