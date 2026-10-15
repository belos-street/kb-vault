import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { lessonsSchema } from '../schema/lesson.ts'
import { dataFile, loadLessonsFromSource } from '../scripts/source.ts'

// 一致性对账（T6）：讲义 md ↔ lessons.json 防漂移，固化为常驻 CI 测试
// 讲义 md 更新后必须重跑 `bun run build-data`，否则本测试红

const diskRaw = JSON.parse(readFileSync(dataFile, 'utf8'))
const diskParsed = lessonsSchema.safeParse(diskRaw)
const { lessons: fromSource, warnings } = loadLessonsFromSource()

describe('lessons.json 与讲义 md 一致', () => {
  test('lessons.json 通过 schema 校验', () => {
    expect(diskParsed.success).toBe(true)
  })
  test('讲义解析零 error 级告警（提取无失败 / 题型已知）', () => {
    expect(warnings.filter((w) => w.severity === 'error')).toEqual([])
  })
  test('讲数与讲次集合一致', () => {
    const disk = diskParsed.success ? diskParsed.data : []
    expect(disk.length).toBe(fromSource.length)
    expect(disk.map((l) => l.key)).toEqual(fromSource.map((l) => l.key))
  })
  test('每讲数据Version / 题集与 md 现场解析一致（防漂移）', () => {
    const disk = diskParsed.success ? diskParsed.data : []
    for (const live of fromSource) {
      const saved = disk.find((l) => l.key === live.key)
      expect(saved, `${live.key} 缺失`).toBeDefined()
      expect(saved?.dataVersion, `${live.key} dataVersion 漂移`).toBe(
        live.dataVersion
      )
      expect(
        saved?.questions.map((q) => q.id),
        `${live.key} 题号漂移`
      ).toEqual(live.questions.map((q) => q.id))
      expect(
        saved?.questions.map((q) => q.answer),
        `${live.key} 答案漂移`
      ).toEqual(live.questions.map((q) => q.answer))
    }
  })
})

describe('结构不变量', () => {
  const lessons = diskParsed.success ? diskParsed.data : []
  test('复合键唯一（板块标识 + 讲号）', () => {
    const keys = lessons.map((l) => l.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
  test('讲号 L01–L29 连续无重复', () => {
    const indexes = lessons.map((l) => l.index)
    expect(indexes).toEqual(Array.from({ length: 29 }, (_, i) => i + 1))
  })
  test('题号讲内唯一，tier 与题号前缀一致', () => {
    for (const l of lessons) {
      const ids = l.questions.map((q) => q.id)
      expect(new Set(ids).size, `${l.key} 题号重复`).toBe(ids.length)
      for (const q of l.questions) {
        expect(q.tier, `${l.key} ${q.id} tier`).toBe(q.id[0] as 'B' | 'S' | 'T')
      }
    }
  })
  test('fill 题必有 blanks 且空位数与题干空位一致；choice 必有 4 选项', () => {
    for (const l of lessons) {
      for (const q of l.questions) {
        if (q.kind === 'fill') {
          const blankMarks = q.stem
            .filter((b) => b.type === 'p')
            .map((b) => (b.text.match(/_{3,}/g) ?? []).length)
            .reduce((a, b) => a + b, 0)
          expect(q.blanks?.length, `${l.key} ${q.id} blanks 数`).toBe(
            blankMarks
          )
        }
        if (q.kind === 'choice') {
          expect(q.options?.length, `${l.key} ${q.id} 选项数`).toBe(4)
        }
      }
    }
  })
  test('machine 题（choice/fill）不得降级；degraded 题一律按自判消费', () => {
    for (const l of lessons) {
      for (const q of l.questions) {
        if (q.kind === 'choice' || q.kind === 'fill') {
          expect(q.degraded, `${l.key} ${q.id} 机判题降级`).toBe(false)
        }
      }
    }
  })
})
