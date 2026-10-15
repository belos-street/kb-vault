import type {
  Blank,
  Block,
  Lesson,
  Question,
  QuestionKind
} from '../schema/lesson.ts'

// 讲义 md 解析器（T5，requirements §6 参考答案提取口径）
// 七节模板切分 + 题号解析 + 第 7 节答案提取；失败降级自判题并告警。

export interface ParseWarning {
  lesson: string
  question: string
  message: string
  // error = 提取失败 / 题型未知（目标为空）；info = 启发式告警（如成对空复用）
  severity: 'error' | 'info'
}

const KIND_MAP: Record<string, QuestionKind> = {
  选择: 'choice',
  填空: 'fill',
  // 教程标「判断」的题实为对比填空家族（多空、可机判），归入 fill
  判断: 'fill',
  改错: 'correction',
  翻译: 'translation',
  拆句: 'parse',
  辨析: 'analyze'
}

/** 英文例句判定：行内代码内容以大写开头、以句末标点收尾 */
export function isEnglishSentence(code: string): boolean {
  const t = code.trim()
  return /^[A-Z]/.test(t) && /[.!?]$/.test(t)
}

/**
 * 列表项 → 例句块（en/zh 分离）：
 * 形如 `1. **主 + 动**：`The rabbit runs.` —— run 不及物…` 或 `- `The rabbit eats.` —— …`。
 * 至少含一个「英文句」行内代码才成立，否则降级为列表项。
 */
export function tryParseExample(
  body: string
): { label: string; en: string[]; zh: string } | null {
  let text = body
  let label = ''
  const lm = text.match(/^\*\*([^*]+)\*\*：\s*/)
  if (lm?.[1] !== undefined) {
    label = lm[1].trim()
    text = text.slice(lm[0].length)
  }
  const codes = [...text.matchAll(/`([^`]+)`/g)]
    .map((m) => (m[1] ?? '').trim())
    .filter(isEnglishSentence)
  if (codes.length === 0) return null
  const zh = text
    .replace(/`[^`]+`/g, '')
    .replace(/^[：:——\-\s，,]+/, '')
    .trim()
  return { label, en: codes, zh }
}

/** 正文行 → 内容块（表格 / 常见坑 / 引语 / 例句 / 列表，其余合并为段落） */
export function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let listBuf: { ordered: boolean; items: string[] } | null = null
  let exBuf: { label: string; en: string[]; zh: string } | null = null

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ type: 'p', text: para.join('\n') })
      para = []
    }
  }
  const flushList = () => {
    if (listBuf !== null) {
      blocks.push({ type: 'list', ...listBuf })
      listBuf = null
    }
  }
  const flushEx = () => {
    if (exBuf !== null) {
      blocks.push({ type: 'example', ...exBuf })
      exBuf = null
    }
  }
  const flushAll = () => {
    flushPara()
    flushList()
    flushEx()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    if (line === '' || /^(-{3,}|\*{3,})$/.test(line)) {
      flushAll()
      continue
    }
    if (line.startsWith('|')) {
      flushAll()
      const rows: string[][] = []
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        const cells = (lines[i] ?? '')
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim())
        rows.push(cells)
        i++
      }
      i--
      const [head, maybeSep, ...body] = rows
      // 第二行为 `|---|` 分隔线时跳过
      const isSep = (r: string[] | undefined) =>
        r !== undefined && r.every((c) => /^:?-{2,}:?$/.test(c))
      const dataRows = isSep(maybeSep)
        ? body
        : [maybeSep, ...body].filter((r) => r !== undefined)
      blocks.push({
        type: 'table',
        head: head ?? [],
        rows: dataRows as string[][]
      })
      continue
    }
    if (line.startsWith('> ')) {
      flushAll()
      blocks.push({ type: 'quote', text: line.replace(/^>\s*/, '') })
      continue
    }
    // 小节标题：`### 2.1 …` / `## …` 式（七节主标题已被 splitSections 切走）
    const heading = line.match(/^#{2,6}\s+(.*)$/)
    if (heading?.[1] !== undefined) {
      flushAll()
      blocks.push({ type: 'subhead', text: heading[1].trim() })
      continue
    }
    // 常见坑：`- ⚠️ …`（列表形态）或裸 `⚠️ …`；⚠️ 属内容 emoji，原样保留
    const bullet = line.match(/^[-*]\s+(.*)$/)
    const enumM = line.match(/^\d+[.、]\s+(.*)$/)
    let body: string | null = null
    let ordered = false
    if (bullet?.[1] !== undefined) {
      body = bullet[1]
      ordered = false
    } else if (enumM?.[1] !== undefined) {
      body = enumM[1]
      ordered = true
    }
    if (line.startsWith('⚠️') || (body !== null && body.startsWith('⚠️'))) {
      flushAll()
      blocks.push({ type: 'pitfall', text: line.replace(/^[-*]\s+/, '') })
      continue
    }
    if (body !== null) {
      const ex = tryParseExample(body)
      if (ex !== null) {
        // 纯英文句列表项连续出现时合并为一个例句块
        if (
          exBuf !== null &&
          ex.label === '' &&
          ex.zh === '' &&
          exBuf.label === '' &&
          exBuf.zh === ''
        ) {
          exBuf.en.push(...ex.en)
          continue
        }
        flushAll()
        if (ex.label === '' && ex.zh === '') {
          exBuf = ex
        } else {
          blocks.push({ type: 'example', ...ex })
        }
        continue
      }
      // 普通列表项
      flushPara()
      flushEx()
      if (listBuf !== null && listBuf.ordered === ordered) {
        listBuf.items.push(body)
      } else {
        flushList()
        listBuf = { ordered, items: [body] }
      }
      continue
    }
    flushList()
    flushEx()
    para.push(line)
  }
  flushAll()
  return blocks
}

function countBlanks(stem: string): number {
  return (stem.match(/_{3,}/g) ?? []).length
}

/** 内容块拍平成文本（dataVersion 指纹用） */
function blockText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'p' || b.type === 'pitfall' || b.type === 'quote')
        return b.text
      if (b.type === 'subhead') return b.text
      if (b.type === 'example') return [b.label, ...b.en, b.zh].join('\u0001')
      if (b.type === 'list') return b.items.join('\u0001')
      return [...b.head, ...b.rows.flat()].join('\u0001')
    })
    .join('\u0002')
}

/**
 * 解析正文里的答案 token → fill 各空答案。
 * 按正文出现顺序收集加粗片段（按 `；` 展平）；题干含「句型：____」时
 * 额外收集 `句型：X` token（L09 B3 式多空），与空位顺序对齐。
 */
export function extractFillParts(
  body: string,
  opts: { patternTokens?: boolean } = {}
): { parts: string[]; found: boolean } {
  const re = opts.patternTokens
    ? /\*\*([^*]+)\*\*|句型：([^，。；;）)]+)/g
    : /\*\*([^*]+)\*\*/g
  const parts: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const bold = m[1]
    const pattern = m[2]
    if (bold !== undefined) {
      for (const p of bold.split(/[；;]/)) {
        const t = p.trim()
        if (t !== '') parts.push(t)
      }
    } else if (pattern !== undefined) {
      const t = pattern.trim()
      if (t !== '') parts.push(t)
    }
  }
  return { parts, found: parts.length > 0 }
}

/** 答案片段 → 单空可接受答案（「（或 …）」承载变体，「不填」= 空串合法） */
function parseSingleBlank(raw: string): Blank {
  const allowEmpty = /不填/.test(raw)
  const accepts = new Set<string>()
  if (allowEmpty) accepts.add('')
  // 去掉「不填」后取主答案；「（或 X）」变体
  const cleaned = raw.replace(/不填/g, '').trim()
  const orMatch = cleaned.match(/（或\s*([^）]+)）/)
  const main = cleaned
    .replace(/（或\s*[^）]+）/g, '')
    .replace(/[。；]/g, '')
    .trim()
  if (main !== '') accepts.add(main)
  if (orMatch?.[1] !== undefined) {
    for (const alt of orMatch[1].split(/[/、、]/)) {
      const t = alt.trim()
      if (t !== '') accepts.add(t)
    }
  }
  if (accepts.size === 0) accepts.add('')
  return { accepts: [...accepts], allowEmpty }
}

/**
 * 答案片段列表 → fill 各空可接受答案。
 * 片段数 < 空数时余空复用末个答案（成对标点场景，如插入语双 em dash）；
 * 片段数 > 空数时截断。数量不符由调用方告警。
 */
export function buildBlanks(parts: string[], blankCount: number): Blank[] {
  const blanks: Blank[] = []
  for (let i = 0; i < blankCount; i++) {
    const raw = parts[Math.min(i, parts.length - 1)] ?? ''
    blanks.push(parseSingleBlank(raw))
  }
  return blanks
}

/** 第 7 节条目 `- **B1**：**D**。解析…` → 题号 → { answer, body, found } */
export interface AnswerEntry {
  answer: string
  body: string
  found: boolean
}
export function parseAnswers(text: string): Map<string, AnswerEntry> {
  const map = new Map<string, AnswerEntry>()
  for (const { caps, body } of splitEntries(
    text,
    /^- \*\*([BST]\d+)\*\*：/gm
  )) {
    const id = caps[0] ?? ''
    const bold = body.match(/\*\*([^*]+)\*\*/)
    if (bold?.[1] !== undefined) {
      map.set(id, { answer: bold[1].trim(), body, found: true })
    } else {
      map.set(id, { answer: '', body, found: false })
    }
  }
  return map
}

/**
 * 按条目头切分文本（条目体 = 从条目头后到下一条目头前的全部多行内容）。
 * 注意不能用 `$` 断言收尾（m 标志下 `$` 匹配每行行尾，会截断多行条目）。
 * `caps` = 条目头的捕获组（caps[0] = 题号，caps[1..] = 其余组）。
 */
export function splitEntries(
  text: string,
  headRe: RegExp
): { caps: string[]; body: string }[] {
  const heads: { caps: string[]; start: number; bodyStart: number }[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(headRe.source, headRe.flags)
  while ((m = re.exec(text)) !== null) {
    heads.push({
      caps: m.slice(1).map((s) => s ?? ''),
      start: m.index,
      bodyStart: m.index + m[0].length
    })
  }
  return heads.map((h, i) => ({
    caps: h.caps,
    body: text.slice(h.bodyStart, heads[i + 1]?.start ?? text.length).trim()
  }))
}

function splitSections(md: string): { num: number; body: string }[] {
  const parts: { num: number; body: string }[] = []
  const re = /^##\s*(\d+)\.\s*(.+)$/gm
  const heads: { num: number; title: string; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    heads.push({
      num: Number(m[1]),
      title: (m[2] ?? '').trim(),
      start: m.index,
      end: md.length
    })
  }
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i]!
    h.end = heads[i + 1]?.start ?? md.length
    parts.push({
      num: h.num,
      body: md.slice(h.start, h.end).replace(re, '').trim()
    })
  }
  return parts
}

export interface ParseInput {
  md: string
  board: string
  index: number
  fileName: string
}

export function parseLesson(input: ParseInput): {
  lesson: Lesson
  warnings: ParseWarning[]
} {
  const { md, board, index, fileName } = input
  const warnings: ParseWarning[] = []

  // 讲号 / 标题：`# L03：动词分类`
  const titleM = md.match(/^#\s*(L\d+)：\s*(.+)$/m)
  const number = titleM?.[1] ?? ''
  const title = titleM?.[2] ?? fileName

  // 学习目标：`> 学完本讲你能：**…**`
  const goalM = md.match(/^>\s*学完本讲你能：\s*(.+)$/m)
  const goal = (goalM?.[1] ?? '').replace(/\*\*/g, '').trim()

  const sections = splitSections(md)
  const sec = (n: number) => sections.find((s) => s.num === n)?.body ?? ''

  const why = parseBlocks(sec(1).split('\n'))
  const concepts = parseBlocks(sec(2).split('\n'))
  const examples = parseBlocks(sec(3).split('\n'))
  const pitfalls = parseBlocks(sec(4).split('\n'))
  const summary = sec(5).replace(/^>\s*/gm, '').trim()

  // 题干（第 6 节）+ 答案（第 7 节）
  const answers = parseAnswers(sec(7))
  const stemText = sec(6)
  const questions: Question[] = []
  for (const { caps, body: rawStem } of splitEntries(
    stemText,
    /^\*\*([BST]\d+)（([^）]+)）\*\*：/gm
  )) {
    const id = caps[0] ?? ''
    const kindLabel = caps[1] ?? ''

    // 选项行 `- A. xxx`（仅选择题）
    const optRe = /^-\s*([A-D])\.\s*(.+)$/gm
    const options: string[] = []
    let om: RegExpExecArray | null
    while ((om = optRe.exec(rawStem)) !== null) {
      options.push((om[2] ?? '').trim())
    }
    const stemBody = rawStem.replace(optRe, '').trim()
    const kind = KIND_MAP[kindLabel] ?? 'analyze'
    if (KIND_MAP[kindLabel] === undefined) {
      warnings.push({
        lesson: number,
        question: id,
        message: `未知题型标签「${kindLabel}」，按辨析自判处理`,
        severity: 'error'
      })
    }

    const ans = answers.get(id)
    let answer = ''
    let explanation = ''
    let degraded = false
    if (ans === undefined || !ans.found) {
      degraded = true
      answer = ''
      explanation = ans?.body ?? ''
      if (kind === 'choice' || kind === 'fill') {
        warnings.push({
          lesson: number,
          question: id,
          message: '参考答案提取失败，降级为自判题',
          severity: 'error'
        })
      }
    } else {
      answer = ans.answer
      explanation = ans.body
    }

    const blankCount = countBlanks(stemBody)
    let blanks: Blank[] | undefined
    if (kind === 'fill') {
      // 题干含「句型：____」时（L09 B3 式）才收集 `句型：X` token
      const patternTokens = /句型：/.test(stemBody)
      const { parts, found } = extractFillParts(explanation, { patternTokens })
      if (!found) {
        blanks = Array.from({ length: blankCount }, () => ({
          accepts: [''],
          allowEmpty: true
        }))
      } else {
        if (parts.length < blankCount) {
          warnings.push({
            lesson: number,
            question: id,
            message: `答案片段 ${parts.length} 少于空位 ${blankCount}（成对空复用末答案）`,
            severity: 'info'
          })
        }
        blanks = buildBlanks(parts, blankCount)
      }
    }

    questions.push({
      id,
      tier: id[0] as 'B' | 'S' | 'T',
      kind,
      stem: parseBlocks(stemBody.split('\n')),
      ...(kind === 'choice' ? { options } : {}),
      ...(blanks !== undefined ? { blanks } : {}),
      answer,
      explanation,
      degraded
    })
  }

  const lesson: Lesson = {
    key: `${board}-${number}`,
    index,
    number,
    title,
    goal,
    board,
    sections: { why, concepts, examples, pitfalls, summary },
    questions,
    // dataVersion 口径（T4 决策）：题号集合 + 各题（题干 + 答案）指纹。
    // 不含纯讲解段落——改解析文字不误伤进度，改任何一题即整讲判定失效（T12 消费）。
    dataVersion: contentHash(
      questions
        .map((q) => `${q.id}:${blockText(q.stem)}|${q.answer}`)
        .join('\n')
    )
  }
  return { lesson, warnings }
}

// 简易内容指纹（F4 dataVersion）：FNV-1a 32 位 × 2 轮
function contentHash(md: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < md.length; i++) {
    const c = md.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}
