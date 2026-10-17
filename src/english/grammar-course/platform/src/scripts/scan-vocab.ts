// 词汇台账扫描（bun run ledger）：词形枚举 + 边界正则，精确清点入账/复现
// 台账（lessons/vocab-ledger.md）的「复现记录」由本脚本复算，不得凭印象手填
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Lesson } from '../schema/lesson.ts'

const dataFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'lessons.json'
)
const d = JSON.parse(readFileSync(dataFile, 'utf8')) as Lesson[]

function forms(w: string): string[] {
  const ws = w.toLowerCase()
  const out = new Set<string>([ws])
  if (ws.includes(' ')) {
    const [a, ...rest] = ws.split(' ')
    for (const f of forms(a!)) out.add([f, ...rest].join(' '))
  } else {
    if (/[^aeiou]y$/.test(ws)) out.add(ws.slice(0, -1) + 'ies')
    else out.add(ws + 's')
    if (/e$/.test(ws)) {
      out.add(ws + 'd')
      out.add(ws.slice(0, -1) + 'ing')
    } else {
      out.add(ws + 'ed')
      out.add(ws + 'ing')
      if (/[^aeiou][aeiou][^aeiouwxy]$/.test(ws)) {
        out.add(ws + ws.slice(-1) + 'ed')
        out.add(ws + ws.slice(-1) + 'ing')
      }
    }
  }
  return [...out]
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const map = new Map<
  string,
  {
    word: string
    meaning: string
    pos: string
    entry: string
    occurs: string[]
  }
>()
for (const l of d) {
  const reading = l.reading.paragraphs
    .flatMap((p) => p.sentences.map((s) => s.en.toLowerCase()))
    .join(' \n ')
  for (const v of l.vocab) {
    const key = v.word.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        word: v.word,
        meaning: v.meaning,
        pos: v.pos,
        entry: l.id,
        occurs: []
      })
    }
    const e = map.get(key)!
    for (const f of forms(key)) {
      const re = new RegExp(
        `(^|[^a-z])${esc(f).replace(' ', '\\s+')}([^a-z]|$)`
      )
      if (re.test(reading) && !e.occurs.includes(l.id)) {
        e.occurs.push(l.id)
        break
      }
    }
  }
}

const dup: string[] = []
for (const l of d) {
  for (const v of l.vocab) {
    const e = map.get(v.word.toLowerCase())!
    if (e.entry !== l.id) dup.push(`${v.word}@${l.id}→首现${e.entry}`)
  }
}
console.log('重复入账:', dup.join(' | ') || '无')
for (const e of map.values()) {
  const rec = e.occurs.filter((x) => x !== e.entry)
  console.log(
    `${e.word} | ${e.pos} | ${e.meaning} | 首现 ${e.entry} | 课文复现 ${
      rec.length ? rec.join(',') : '—'
    }`
  )
}
