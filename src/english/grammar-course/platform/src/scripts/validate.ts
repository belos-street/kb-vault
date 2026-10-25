import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lessonsSchema } from '../schema/lesson.ts'
import { dataFile, loadLessonsFromSource } from './source.ts'

// validate（T4）：解析产物 schema 校验 + 不变量断言 + 产物漂移检测
// 口径：md 格式违约 / 解析失败 / schema 不变量破 / 产物漂移 = 红

// 0) syllabus.json outcome 契约（format.md §4：outcome 与 syllabus 一致）
interface SyllabusLesson {
  id: string
  outcome: string
  refs: string[]
}
const syllabusFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'syllabus.json'
)
let syllabus: { units: { lessons: SyllabusLesson[] }[] } = { units: [] }
try {
  syllabus = JSON.parse(readFileSync(syllabusFile, 'utf8'))
} catch (e) {
  console.error(`✖ 无法读取 syllabus.json：${e}`)
  process.exit(1)
}
const syllabusById = new Map<string, SyllabusLesson>()
for (const u of syllabus.units) {
  for (const l of u.lessons) {
    syllabusById.set(l.id, l)
  }
}

// 1) 产物存在且过 schema
let ok = true
let diskParsed: unknown = null
try {
  diskParsed = JSON.parse(readFileSync(dataFile, 'utf8'))
  const parsed = lessonsSchema.safeParse(diskParsed)
  if (!parsed.success) {
    ok = false
    console.error('✖ lessons.json 未过 schema 校验：')
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')} : ${issue.message}`)
    }
  } else {
    diskParsed = parsed.data
  }
} catch (e) {
  ok = false
  console.error(`✖ 无法读取 lessons.json：${e}（先跑 build-data）`)
}

// 2) 现场解析复核（md → 产物一致性锚定于确定性解析）
const { lessons, errors, warnings } = loadLessonsFromSource()
if (errors.length > 0) {
  ok = false
  console.error(`✖ ${errors.length} 条解析错误：`)
  for (const e of errors) {
    console.error(`  [${e.lesson} ${e.where}] ${e.message}`)
  }
}

// 3) 产物漂移检测：现场解析结果与 lessons.json 深比较（dataVersion 集合 + 课数）
if (Array.isArray(diskParsed)) {
  const disk = diskParsed as { id: string; dataVersion: string }[]
  const live = lessons.map((l) => ({ id: l.id, dataVersion: l.dataVersion }))
  if (disk.length !== live.length) {
    ok = false
    console.error(
      `✖ 产物漂移：lessons.json ${disk.length} 课 ≠ 现场解析 ${live.length} 课（md 改了忘跑 build-data？）`
    )
  }
  for (const l of live) {
    const d = disk.find((x) => x.id === l.id)
    if (d === undefined) {
      ok = false
      console.error(
        `✖ 产物漂移：${l.id} 不在 lessons.json 中（先跑 build-data）`
      )
    } else if (d.dataVersion !== l.dataVersion) {
      ok = false
      console.error(
        `✖ 产物漂移：${l.id} dataVersion 不一致（md 改了忘跑 build-data）`
      )
    }
  }
}

// 4) 不变量断言（format.md §4 清单）
// 内容口径计数（阶段性可缺，全量后清零）：口语句译文、释义 2~3 义项
let missingDailyZh = 0
let thinMeaning = 0
for (const l of lessons) {
  const allIds = [...l.practice, ...l.quiz].map((q) => q.id)
  if (new Set(allIds).size !== allIds.length) {
    ok = false
    console.error(`✖ ${l.id} 题号重复`)
  }
  const refs = l.deepDive.refs.map((r) => r.ref)
  for (const r of refs) {
    if (
      !/^G\d{2}$/.test(r) ||
      Number(r.slice(1)) < 1 ||
      Number(r.slice(1)) > 29
    ) {
      ok = false
      console.error(`✖ ${l.id} 深读 ref 越界：${r}`)
    }
  }
  // 深读跳转 URL（T11）：每条必须解析出讲义静态页锚点链接
  for (const r of l.deepDive.refs) {
    if (r.url === undefined || r.url === '') {
      ok = false
      console.error(`✖ ${l.id} 深读 ${r.ref} 缺跳转 URL：${r.title}`)
    } else if (!r.url.startsWith('/kb-vault/english/grammar/')) {
      ok = false
      console.error(`✖ ${l.id} 深读 ${r.ref} 跳转目标非讲义页：${r.url}`)
    }
  }
  for (const q of l.practice) {
    if (q.kind === 'drill') {
      const slotCount = (q.template.match(/_{3,}/g) ?? []).length
      if (slotCount !== q.slots.length) {
        ok = false
        console.error(
          `✖ ${l.id} ${q.id} 槽位数 ${slotCount} ≠ slots ${q.slots.length}`
        )
      }
    }
  }
  // outcome 与 syllabus.json 一致（68 课人工必漏，脚本化）；容句末标点漂移
  const syl = syllabusById.get(l.id)
  const stripTail = (s: string) => s.replace(/[。.]+$/, '').trim()
  if (syl === undefined) {
    ok = false
    console.error(`✖ ${l.id} 不在 syllabus.json 课表中`)
  } else {
    if (stripTail(l.goal) !== stripTail(syl.outcome)) {
      ok = false
      console.error(
        `✖ ${l.id} outcome ≠ syllabus：\n    课: ${l.goal}\n    表: ${syl.outcome}`
      )
    }
    // deepDive refs 覆盖 syllabus refs（P1-2：课表要求的讲义覆盖必须落进深读）
    const deepRefs = new Set(l.deepDive.refs.map((r) => r.ref))
    for (const r of syl.refs) {
      if (!deepRefs.has(r)) {
        ok = false
        console.error(`✖ ${l.id} deepDive 缺 syllabus 要求的 ref：${r}`)
      }
    }
  }

  // 词汇表例句断言（format §3.3）：examples[0] 必须是课文原句（平台点读互链口径），
  // examples[1] 必须是课外句（不得为课文原句复制充数）
  const enSet = new Set(
    l.reading.paragraphs.flatMap((p) => p.sentences.map((s) => s.en.trim()))
  )
  for (const v of l.vocab) {
    const text = v.examples[0]!
    const daily = v.examples[1]!
    if (!enSet.has(text.en.trim())) {
      ok = false
      console.error(`✖ ${l.id} 词汇「${v.word}」课文例句非课文原句：${text.en}`)
    }
    if (enSet.has(daily.en.trim())) {
      ok = false
      console.error(
        `✖ ${l.id} 词汇「${v.word}」课外例句是课文原句：${daily.en}`
      )
    }
    // 内容口径（阶段性可缺，全量后清零）：口语句译文、释义 2~3 义项
    if (daily.zh === undefined) missingDailyZh += 1
    if (v.meaning.split('；').length < 2) thinMeaning += 1
  }
}

// 内容口径对账输出（不红、只汇总——契约 gloss/zh 可逐步补）
if (missingDailyZh > 0) {
  console.warn(`⚠ 口语例句缺译文 ${missingDailyZh} 处（全量后应清零）`)
}
if (thinMeaning > 0) {
  console.warn(`⚠ 释义不足 2 个义项 ${thinMeaning} 条（约定 2~3 常用义项）`)
}

if (ok) {
  console.log(
    `✓ validate：${lessons.length} 课全绿（schema + 不变量 + 产物一致性 + syllabus outcome${warnings.length > 0 ? `，${warnings.length} 条告警` : ''}）`
  )
  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(`  ⚠ [${w.lesson} ${w.where}] ${w.message}`)
    }
  }
} else {
  process.exit(1)
}
