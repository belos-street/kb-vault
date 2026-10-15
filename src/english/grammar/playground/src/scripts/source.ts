import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Lesson } from '../schema/lesson.ts'
import { parseLesson, type ParseWarning } from './parser.ts'

// 讲义源扫描（T5/T6 共用）：build-data 落盘、reconcile 测试对账都走这里

const here = dirname(fileURLToPath(import.meta.url))
export const grammarDir = join(here, '..', '..', '..') // → src/english/grammar/
export const dataFile = join(here, '..', 'data', 'lessons.json')

const boards = [
  '01-语法体系总览',
  '02-动词体系',
  '03-从句',
  '04-词性与构词',
  '05-句法专题'
]

export interface SourceLoad {
  lessons: Lesson[]
  warnings: ParseWarning[]
}

/** 扫 grammar/ 板块目录解析全部讲义（按讲号排序） */
export function loadLessonsFromSource(): SourceLoad {
  const lessons: Lesson[] = []
  const warnings: ParseWarning[] = []
  for (const board of boards) {
    const files = readdirSync(join(grammarDir, board))
      .filter((f) => /^L\d+.*\.md$/.test(f))
      .sort()
    for (const file of files) {
      const md = readFileSync(join(grammarDir, board, file), 'utf8')
      const index = Number(file.match(/^L(\d+)/)?.[1] ?? 0)
      const { lesson, warnings: w } = parseLesson({
        md,
        board,
        index,
        fileName: file
      })
      lessons.push(lesson)
      warnings.push(...w)
    }
  }
  lessons.sort((a, b) => a.index - b.index)
  return { lessons, warnings }
}
