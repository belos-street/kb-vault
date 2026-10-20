import type {
  DeepDiveItem,
  Lesson,
  Note,
  Paragraph,
  PracticeItem,
  QuizItem,
  Sentence,
  VocabItem
} from '../schema/lesson.ts'

// lesson.md 解析器（T3，lessons/lesson-format.md = 解析契约）
// 固定七件套模板（^## N. 标题）切分 + 题号解析 + 文末答案区提取。
// 硬失败（结构 / 题号 / 答案缺失）由调用方收集为 errors → 构建红。

export interface ParseIssue {
  lesson: string
  where: string
  message: string
}

export interface ParseResult {
  lesson: Lesson
  errors: ParseIssue[]
  warnings: ParseIssue[]
}

function err(lesson: string, where: string, message: string): ParseIssue {
  return { lesson, where, message }
}

/** 内容指纹（dataVersion：题号集合 + 题干/答案），FNV-1a 32 位 × 2 轮 */
function contentHash(text: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

/** 七节切分：`## N. 标题` → { num, title, body } */
function splitSections(
  md: string
): Map<number, { title: string; body: string }> {
  const out = new Map<number, { title: string; body: string }>()
  const re = /^##\s*(\d+)\.\s*(.+)$/gm
  const heads: {
    num: number
    title: string
    start: number
    bodyStart: number
  }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    heads.push({
      num: Number(m[1]),
      title: (m[2] ?? '').trim(),
      start: m.index,
      bodyStart: m.index + m[0].length
    })
  }
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i]!
    const body = md.slice(h.bodyStart, heads[i + 1]?.start ?? md.length).trim()
    out.set(h.num, { title: h.title, body })
  }
  return out
}

// ── 课文（§2）：`- en{★ note}` + 缩进 zh，空行分段 ──

function parseReading(body: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  let current: Sentence[] = []
  let pendingEn: { en: string; note?: string } | null = null

  const flush = () => {
    if (current.length > 0) {
      paragraphs.push({ sentences: current })
      current = []
    }
  }

  for (const raw of body.split('\n')) {
    const line = raw.trimEnd()
    if (line.trim() === '') {
      flush()
      continue
    }
    const enM = line.trim().match(/^-\s*(.+)$/)
    if (enM?.[1] !== undefined) {
      // 英文句（可带 {★ 注解}）
      let text = enM[1].trim()
      let note: string | undefined
      const hl = text.match(/\{★\s*([^}]*)\}/)
      if (hl !== null) {
        note = (hl[1] ?? '').trim()
        text = text.replace(/\s*\{★\s*[^}]*\}/, '').trim()
      }
      pendingEn = {
        en: text,
        ...(note !== undefined && note !== '' ? { note } : {})
      }
      continue
    }
    // 中文译文行（缩进两空格）
    const zh = line.trim()
    if (zh !== '' && pendingEn !== null) {
      current.push({
        en: pendingEn.en,
        zh,
        highlight: pendingEn.note !== undefined,
        ...(pendingEn.note !== undefined ? { note: pendingEn.note } : {})
      })
      pendingEn = null
    }
  }
  flush()
  return paragraphs
}

// ── 词汇表（§3）：7 列表格（课文例句 | 课外例句 | 搭配「短语 = 例句；…」）──

function parseCollocations(
  lessonId: string,
  word: string,
  cell: string,
  errors: ParseIssue[]
): VocabItem['collocations'] {
  const items: VocabItem['collocations'] = []
  for (const part of cell.split(/；/)) {
    const seg = part.trim()
    if (seg === '') continue
    const eq = seg.indexOf('=')
    if (eq < 0) {
      errors.push(
        err(lessonId, 'vocab', `「${word}」搭配缺「短语 = 例句」格式：${seg}`)
      )
      continue
    }
    const phrase = seg.slice(0, eq).trim()
    const example = seg.slice(eq + 1).trim()
    if (phrase === '' || example === '') {
      errors.push(
        err(lessonId, 'vocab', `「${word}」搭配短语或例句为空：${seg}`)
      )
      continue
    }
    items.push({ phrase, example })
  }
  if (items.length < 2 || items.length > 3) {
    errors.push(
      err(
        lessonId,
        'vocab',
        `「${word}」搭配 ${items.length} 项（约定 2~3 项）`
      )
    )
  }
  return items
}

function parseVocab(
  lessonId: string,
  body: string,
  errors: ParseIssue[]
): VocabItem[] {
  const items: VocabItem[] = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line.startsWith('|')) continue
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
    if (cells.length < 7) continue
    // 跳过分隔行与表头
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
    if (cells[0] === 'word') continue
    const word = cells[0]!
    items.push({
      word,
      phonetic: cells[1]!,
      pos: cells[2]!,
      meaning: cells[3]!,
      // [0] 课文原句（validate 断言 ∈ reading）、[1] 课外口语句（∉ reading）
      examples: [cells[4]!, cells[5]!],
      collocations: parseCollocations(lessonId, word, cells[6] ?? '', errors)
    })
  }
  return items
}

// ── 精讲（§4）：规则段落 + 列表例句 ──

function parseNotes(
  lessonId: string,
  body: string,
  errors: ParseIssue[]
): Note[] {
  const ruleParts: string[] = []
  const examples: string[] = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (line === '' || /^-{3,}$/.test(line)) continue
    const li = line.match(/^-\s+(.+)$/)
    if (li?.[1] !== undefined) {
      examples.push(li[1].trim())
    } else if (!line.startsWith('#')) {
      ruleParts.push(line)
    }
  }
  // §3.4 要求规则 + 2~3 例句——例句行缺失 = 硬失败（不塞占位文本进数据）
  if (examples.length < 2) {
    errors.push(
      err(
        lessonId,
        'notes',
        `精讲例句仅 ${examples.length} 条（约定 2~3 条列表例句）`
      )
    )
  }
  return [{ rule: ruleParts.join('\n'), examples }]
}

// ── 题干/选项通用 ──

interface RawQuestion {
  id: string
  label: string
  body: string
}

/** 按 `**ID（标签）**：` 切题 */
function splitQuestions(text: string): RawQuestion[] {
  const re = /^\*\*([A-Z]\d+)（([^）]+)）\*\*：/gm
  const heads: {
    id: string
    label: string
    bodyStart: number
    start: number
  }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    heads.push({
      id: m[1]!,
      label: m[2]!,
      start: m.index,
      bodyStart: m.index + m[0].length
    })
  }
  return heads.map((h, i) => ({
    id: h.id,
    label: h.label,
    // 小节标题（### 5.1 等）与节间分隔线（---）是段落标记不是题干内容，剥离
    body: text
      .slice(h.bodyStart, heads[i + 1]?.start ?? text.length)
      .split('\n')
      .filter((l) => {
        const t = l.trim()
        return !/^#{2,3}\s/.test(t) && !/^-{3,}$/.test(t)
      })
      .join('\n')
      .trim()
  }))
}

function splitOptions(body: string): {
  stem: string
  options: string[]
} {
  const optRe = /^-\s*([A-D])\.\s*(.+)$/gm
  const options: string[] = []
  let m: RegExpExecArray | null
  while ((m = optRe.exec(body)) !== null) {
    options.push((m[2] ?? '').trim())
  }
  const stem = body.replace(optRe, '').trim()
  return { stem, options }
}

// ── 答案区（§8）：`- **ID**：…` 切分，首加粗 = 参考答案 ──

export interface AnswerEntry {
  id: string
  answer: string
  explanation: string
  found: boolean
}

export function parseAnswerSection(text: string): Map<string, AnswerEntry> {
  const map = new Map<string, AnswerEntry>()
  const re = /^- \*\*([A-Z]\d+)\*\*：/gm
  const heads: { id: string; bodyStart: number; start: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    heads.push({
      id: m[1]!,
      start: m.index,
      bodyStart: m.index + m[0].length
    })
  }
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i]!
    const body = text
      .slice(h.bodyStart, heads[i + 1]?.start ?? text.length)
      .split('\n')
      .filter((l) => {
        const t = l.trim()
        return !/^#{2,3}\s/.test(t) && !/^-{3,}$/.test(t)
      })
      .join('\n')
      .trim()
    const bold = body.match(/\*\*([^*]+)\*\*/)
    if (bold?.[1] !== undefined) {
      map.set(h.id, {
        id: h.id,
        answer: bold[1].trim(),
        explanation: body,
        found: true
      })
    } else {
      map.set(h.id, { id: h.id, answer: '', explanation: body, found: false })
    }
  }
  return map
}

/** 多空/多槽答案：`；` 分空，「（或 …）」变体，「不填」= 空串合法 */
export function splitAccepts(raw: string): string[] {
  const cleaned = raw.replace(/不填/g, '').trim()
  const ors = cleaned.match(/（或\s*([^）]+)）/)
  const main = cleaned
    .replace(/（或\s*[^）]+）/g, '')
    .replace(/[。；;]$/g, '')
    .trim()
  const out = new Set<string>()
  if (main !== '') out.add(main)
  if (ors?.[1] !== undefined) {
    for (const alt of ors[1].split(/[/、]/)) {
      const t = alt.trim()
      if (t !== '') out.add(t)
    }
  }
  if (/不填/.test(raw)) out.add('')
  return [...out]
}

// ── 练习（§5）──

function parsePractice(
  lessonId: string,
  body: string,
  answers: Map<string, AnswerEntry>,
  errors: ParseIssue[]
): PracticeItem[] {
  const items: PracticeItem[] = []
  for (const q of splitQuestions(body)) {
    const a = answers.get(q.id)
    if (a === undefined || !a.found) {
      errors.push(err(lessonId, q.id, '答案区缺失或未提取到参考答案'))
    }
    const ans = a?.found === true ? a.answer : ''
    const explanation = a?.explanation ?? ''
    if (q.id.startsWith('B') || (q.id.startsWith('S') && q.label === '选择')) {
      const { stem, options } = splitOptions(q.body)
      items.push({
        kind: 'choice',
        id: q.id,
        stem,
        options,
        answer: ans.trim().slice(0, 1),
        explanation
      })
    } else if (q.id.startsWith('P')) {
      // 操练：template + （提示：…）
      const hintM = q.body.match(/（提示：([^）]+)）/)
      const hints = (hintM?.[1] ?? '')
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter((s) => s !== '')
      const template = q.body.replace(/\s*（提示：[^）]+）/, '').trim()
      const slotCount = (template.match(/_{3,}/g) ?? []).length
      const slotParts = ans.split(/[；;]/).map((s) => s.trim())
      const slots: string[][] = []
      for (let i = 0; i < slotCount; i++) {
        slots.push(splitAccepts(slotParts[i] ?? ''))
        if (slots[i]!.length === 0) {
          errors.push(err(lessonId, q.id, `槽 ${i + 1} 未提取到可接受答案`))
        }
      }
      if (hints.length !== slotCount) {
        errors.push(
          err(
            lessonId,
            q.id,
            `提示词数 ${hints.length} 与槽位数 ${slotCount} 不符`
          )
        )
      }
      items.push({
        kind: 'drill',
        id: q.id,
        template,
        hints,
        slots,
        explanation
      })
    } else {
      // 产出（S 域）：参考：**句1 / 句2**（口径）
      const bold = ans.match(/\*\*([^*]+)\*\*/)
      const sampleRaw = bold?.[1] ?? ans
      const sample = sampleRaw
        .split(/\s+\/\s+|；/)
        .map((s) => s.trim())
        .filter((s) => s !== '')
      // §8 括号首短语 = 自判口径（如「句型对即可」），到 —— 或 ）为止，整段不入 criteria
      const critM = explanation.match(/（([^—）]+)(?:——|）)/)
      const criteria = critM?.[1]?.trim() ?? '句型对即可'
      if (sample.length === 0) {
        errors.push(err(lessonId, q.id, '未提取到参考样例（sample）'))
      }
      items.push({
        kind: 'produce',
        id: q.id,
        prompt: q.body.trim(),
        sample,
        criteria
      })
    }
  }
  return items
}

// ── 小测（§6）──

function parseQuiz(
  lessonId: string,
  body: string,
  answers: Map<string, AnswerEntry>,
  errors: ParseIssue[]
): QuizItem[] {
  const items: QuizItem[] = []
  for (const q of splitQuestions(body)) {
    const a = answers.get(q.id)
    if (a === undefined || !a.found) {
      errors.push(err(lessonId, q.id, '答案区缺失或未提取到参考答案'))
    }
    const ans = a?.found === true ? a.answer : ''
    const explanation = a?.explanation ?? ''
    const blankCount = (q.body.match(/_{3,}/g) ?? []).length
    if (blankCount > 0 || q.label === '填空') {
      const parts = ans.split(/[；;]/).map((s) => s.trim())
      // 空位数与答案段数必须对齐：少写答案 ≠ 「不填」合法空（口径与 drill 一致）
      if (ans !== '' && parts.length < Math.max(blankCount, 1)) {
        errors.push(
          err(
            lessonId,
            q.id,
            `空位 ${Math.max(blankCount, 1)} 个但答案段仅 ${parts.length} 段（缺答案 ≠ 不填空）`
          )
        )
      }
      const blanks: string[][] = []
      for (let i = 0; i < Math.max(blankCount, 1); i++) {
        const accepts = splitAccepts(parts[i] ?? '')
        if (accepts.length === 0 && (parts[i] ?? '') !== '') {
          errors.push(err(lessonId, q.id, `空 ${i + 1} 未提取到可接受答案`))
        }
        blanks.push(accepts.length > 0 ? accepts : [''])
      }
      items.push({
        kind: 'fill',
        id: q.id,
        stem: q.body.trim(),
        blanks,
        explanation
      })
    } else {
      const { stem, options } = splitOptions(q.body)
      items.push({
        kind: 'choice',
        id: q.id,
        stem,
        options,
        answer: ans.trim().slice(0, 1),
        explanation
      })
    }
  }
  return items
}

// ── 深读（§7）：`- Gnn：title —— hint` ──

function parseDeepDive(
  lessonId: string,
  body: string,
  errors: ParseIssue[]
): DeepDiveItem[] {
  const items: DeepDiveItem[] = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (line === '' || /^-{3,}$/.test(line)) continue
    const li = line.match(/^-\s*(.+)$/)
    if (li?.[1] === undefined) continue
    const text = li[1].trim()
    const refM = text.match(/^(G\d{2})：\s*(.+)$/)
    if (refM?.[1] === undefined) {
      errors.push(
        err(lessonId, 'deepDive', `无法解析深读条目：${text.slice(0, 30)}`)
      )
      continue
    }
    const rest = refM[2] ?? ''
    const parts = rest.split(/\s+——\s+|——/)
    const title = (parts[0] ?? '').trim()
    const hint = (parts[1] ?? '').trim()
    if (title === '' || hint === '') {
      errors.push(
        err(lessonId, 'deepDive', `深读条目缺 title/hint：${refM[1]}`)
      )
      continue
    }
    items.push({ ref: refM[1], title, hint })
  }
  return items
}

// ── 主入口 ──

export function parseLesson(md: string): ParseResult {
  const errors: ParseIssue[] = []
  const warnings: ParseIssue[] = []

  // 标题行：`# U01L03：〈标题〉`
  const headM = md.match(/^#\s*(U\d{2}L\d{2})：\s*(.+)$/m)
  const id = headM?.[1] ?? ''
  const title = (headM?.[2] ?? '').trim()
  if (id === '') errors.push(err('?', 'title', '缺少 `# UxxLnn：标题` 标题行'))

  // 引语 outcome：`> 学完本课你能：…`
  const goalM = md.match(/^>\s*学完本课你能：\s*(.+)$/m)
  const goal = (goalM?.[1] ?? '').replace(/\*\*/g, '').trim()
  if (goal === '') errors.push(err(id, 'goal', '缺少「学完本课你能」引语'))

  const sections = splitSections(md)
  const sec = (n: number) => sections.get(n)?.body ?? ''
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
    if (!sections.has(n)) errors.push(err(id, `§${n}`, `缺少第 ${n} 节`))
  }

  // ① 本课目标（剥引用符 / 加粗 / 节间分隔线）
  const objective = sec(1)
    .replace(/^>\s*/gm, '')
    .replace(/\*\*/g, '')
    .split('\n')
    .filter((l) => !/^-{3,}$/.test(l.trim()))
    .join('\n')
    .trim()

  // ② 课文
  const paragraphs = parseReading(sec(2))
  const sentences = paragraphs.flatMap((p) => p.sentences)
  const highlights = sentences.filter((s) => s.highlight).length
  if (sentences.length === 0) errors.push(err(id, 'reading', '课文为空'))
  if (highlights < 3 || highlights > 5) {
    warnings.push(err(id, 'reading', `高亮句 ${highlights} 处（约定 3~5 处）`))
  }

  // ③ 词汇表
  const vocab = parseVocab(id, sec(3), errors)
  if (vocab.length < 8 || vocab.length > 12) {
    errors.push(err(id, 'vocab', `词汇 ${vocab.length} 个（约定 8~12）`))
  }
  // 课外例句不得为课文原句（复制课文句充数 = 填错列）
  const enSet = new Set(sentences.map((s) => s.en.trim()))
  for (const v of vocab) {
    const daily = v.examples[1]!.trim()
    if (enSet.has(daily)) {
      errors.push(err(id, 'vocab', `「${v.word}」课外例句是课文原句：${daily}`))
    }
  }

  // ④ 精讲
  const notes = parseNotes(id, sec(4), errors)

  // ⑤⑥ 答案区 + 题
  const answers = parseAnswerSection(sec(8))
  const practice = parsePractice(id, sec(5), answers, errors)
  const quiz = parseQuiz(id, sec(6), answers, errors)

  // 孤儿答案检测：答案区有条目但无对应题 = 题被静默丢弃（如题号标签格式变体）→ 硬失败
  const consumed = new Set([...practice, ...quiz].map((q) => q.id))
  for (const aid of answers.keys()) {
    if (!consumed.has(aid)) {
      errors.push(
        err(
          id,
          aid,
          '答案区有此条目但未解析到对应题（题号标签格式不匹配，题被静默丢弃）'
        )
      )
    }
  }

  // ⑦ 深读
  const deepRefs = parseDeepDive(id, sec(7), errors)
  if (deepRefs.length === 0) errors.push(err(id, 'deepDive', '深读 refs 为空'))

  // dataVersion：题号集合 + 题干/答案指纹（不含讲解文字）
  const fp = [
    ...practice.map((p) => {
      const stem =
        p.kind === 'drill'
          ? p.template
          : p.kind === 'choice'
            ? p.stem
            : p.prompt
      const a =
        p.kind === 'choice'
          ? p.answer
          : p.kind === 'drill'
            ? p.slots.flat().join(',')
            : p.sample.join(',')
      return `${p.id}:${stem}|${a}`
    }),
    ...quiz.map((q) => {
      const a = q.kind === 'choice' ? q.answer : q.blanks.flat().join(',')
      return `${q.id}:${q.stem}|${a}`
    })
  ].join('\n')

  const lesson: Lesson = {
    id,
    title,
    objective,
    goal,
    reading: { paragraphs },
    vocab,
    notes,
    practice,
    quiz,
    deepDive: { refs: deepRefs },
    dataVersion: contentHash(fp)
  }
  return { lesson, errors, warnings }
}
