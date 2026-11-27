import { grammarCards, listContents } from '../content/index.ts'
import { countWords } from '../data/builders.ts'
import {
  allLessons,
  books,
  findUnitOfLesson,
  liveLessons
} from '../data/syllabus.ts'
import type { Block, LessonContent } from '../data/types.ts'
import { checkAnchorUnit } from '../lib/grammar-rules.ts'
import { grammarCardSchema, lessonContentSchema } from '../schema/content.ts'

const errors: string[] = []

function fail(message: string): void {
  errors.push(message)
}

/** 去掉标点与引号，统一小写；标点替换为空格，保证 token 边界 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”"'’]/g, '')
    .replace(/[.,!?;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 短语匹配：按 token 边界，不允许 by six 命中 by sixteen */
function containsPhrase(haystack: string, needle: string): boolean {
  const target = normalize(needle)
  if (target.length === 0) return false
  return ` ${normalize(haystack)} `.includes(` ${target} `)
}

/** 单词匹配：允许常见屈折变化，regular 可命中 Regulars，refill 可命中 refills */
function containsWord(haystack: string, word: string): boolean {
  const target = normalize(word)
  if (target.length === 0) return false
  const forms = new Set([
    target,
    `${target}s`,
    `${target}es`,
    `${target}ed`,
    `${target}d`,
    `${target}ing`
  ])
  return normalize(haystack)
    .split(' ')
    .some((token) => forms.has(token))
}

function reportSchema(label: string, value: unknown): void {
  const result = lessonContentSchema.safeParse(value)
  if (result.success) return
  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? `.${issue.path.join('.')}` : ''
    fail(`${label}${path}: ${issue.message}`)
  }
}

const metaById = new Map(allLessons.map((lesson) => [lesson.id, lesson]))
const contentById = new Map<string, LessonContent>()

for (const content of listContents()) {
  if (contentById.has(content.id)) fail(`内容 ID 重复：${content.id}`)
  contentById.set(content.id, content)
  if (!metaById.has(content.id)) fail(`内容引用未知讲：${content.id}`)
  if (!findUnitOfLesson(content.id)) fail(`内容 ${content.id} 不在任何单元里`)
}

const seenNumbers = new Set<string>()
for (const lesson of allLessons) {
  if (seenNumbers.has(lesson.number)) fail(`讲编号重复：${lesson.number}`)
  seenNumbers.add(lesson.number)
}

for (const book of books) {
  for (const unit of book.units) {
    const unitTopics = new Set(unit.lessons.map((lesson) => lesson.topic))
    if (unitTopics.size < 3) {
      fail(`${unit.id} 只覆盖 ${unitTopics.size} 类主题，至少需要 3 类`)
    }
  }
}

for (const lesson of liveLessons) {
  if (!contentById.has(lesson.id)) {
    fail(`已上线讲缺少内容：${lesson.id}`)
  }
}

for (const [key, card] of Object.entries(grammarCards)) {
  const result = grammarCardSchema.safeParse(card)
  if (!result.success) {
    for (const issue of result.error.issues) {
      fail(`语法卡 ${card.id}${issue.path.join('.')}: ${issue.message}`)
    }
  }
  if (card.id !== key) {
    fail(`语法卡 id 与注册表键不一致：${key} / ${card.id}`)
  }
  if (card.anchors.length < 3) {
    fail(`语法卡 ${card.id} 只有 ${card.anchors.length} 个锚句，至少 3 个`)
  }
}

const seenChunks = new Map<string, string>()
const seenWords = new Map<string, string>()

for (const [id, content] of contentById) {
  const meta = metaById.get(id)
  if (!meta) continue
  if (!meta.live) {
    fail(`未上线讲不应有内容：${id}`)
  }
  if (meta.topic !== content.topic) {
    fail(`${id} 的 topic 与 syllabus 不一致：${meta.topic} / ${content.topic}`)
  }
  if (meta.title !== content.title) {
    fail(`${id} 的 title 与 syllabus 不一致：${meta.title} / ${content.title}`)
  }

  reportSchema(`讲 ${id}`, content)

  const passages = content.blocks.filter(
    (block): block is Extract<Block, { kind: 'passage' }> =>
      block.kind === 'passage'
  )
  if (passages.length === 0) {
    fail(`${id} 缺少 passage`)
    continue
  }

  const sentences = passages.flatMap((block) => block.sentences)
  const computedWords = sentences.reduce(
    (total, sentence) => total + countWords(sentence.en),
    0
  )
  if (computedWords !== content.inputWords) {
    fail(
      `${id} 的 inputWords 应为 ${computedWords}，实际为 ${content.inputWords}`
    )
  }
  if (computedWords < 150 || computedWords > 250) {
    fail(`${id} 的课文长度 ${computedWords} 词，应在 150~250 之间`)
  }

  const perSession = content.minutes / content.sessions
  if (perSession < 8 || perSession > 15) {
    fail(
      `${id} 的每次时长 ${perSession.toFixed(1)} 分钟，应在 8~15 之间（minutes / sessions）`
    )
  }

  const passageText = sentences.map((sentence) => sentence.en).join(' ')

  const firstOf = (kind: Block['kind']): number =>
    content.blocks.findIndex((block) => block.kind === kind)

  const order: Array<[string, number]> = [
    ['passage', firstOf('passage')],
    ['vocab', firstOf('vocab')],
    ['chunks', firstOf('chunks')],
    ['output', firstOf('output')],
    ['drill', firstOf('drill')],
    ['grammar', firstOf('grammar')],
    ['exercise', firstOf('exercise')]
  ]
  let previous: [string, number] | undefined
  for (const entry of order) {
    if (entry[1] < 0) continue
    if (previous && previous[1] > entry[1]) {
      fail(`${id} 的块顺序错误：${entry[0]} 必须在 ${previous[0]} 之后`)
    }
    previous = entry
  }

  if (firstOf('vocab') < 0) fail(`${id} 缺少 vocab`)
  if (firstOf('output') < 0) fail(`${id} 缺少 output`)
  if (firstOf('drill') < 0) fail(`${id} 缺少 drill`)

  const outputIds = new Set<string>()
  let hasLedgerOutput = false
  for (const block of content.blocks) {
    if (block.kind !== 'output') continue
    if (outputIds.has(block.task.id)) {
      fail(`${id} 的 output id 重复：${block.task.id}`)
    }
    outputIds.add(block.task.id)
    if (block.task.kind !== 'writing') hasLedgerOutput = true
  }
  if (outputIds.size > 0 && !hasLedgerOutput) {
    fail(`${id} 没有 retell / check 输出，台账没有数据源`)
  }

  const chunkItems = content.blocks
    .filter(
      (block): block is Extract<Block, { kind: 'chunks' }> =>
        block.kind === 'chunks'
    )
    .flatMap((block) => block.items)
  if (chunkItems.length < 5) fail(`${id} 的 chunks 少于 5 条`)
  for (const chunk of chunkItems) {
    if (!containsPhrase(passageText, chunk.text)) {
      fail(`${id} 的 chunk 未在课文中出现：${chunk.text}`)
    }
    const key = normalize(chunk.text)
    const owner = seenChunks.get(key)
    if (owner && owner !== id) {
      fail(`chunk 跨讲重复：${chunk.text}（${owner} / ${id}）`)
    }
    seenChunks.set(key, id)
  }

  const vocabItems = content.blocks
    .filter(
      (block): block is Extract<Block, { kind: 'vocab' }> =>
        block.kind === 'vocab'
    )
    .flatMap((block) => block.items)
  if (vocabItems.length < 6) fail(`${id} 的 vocab 少于 6 条`)
  for (const item of vocabItems) {
    if (!containsWord(passageText, item.word)) {
      fail(`${id} 的词汇未在课文中出现：${item.word}`)
    }
    if (!sentences.some((s) => normalize(s.en) === normalize(item.example))) {
      fail(`${id} 的词汇例句不是课文原句：${item.word}`)
    }
    const key = normalize(item.word)
    const owner = seenWords.get(key)
    if (owner && owner !== id) {
      fail(`词汇跨讲重复入账：${item.word}（${owner} / ${id}）`)
    }
    seenWords.set(key, id)
  }

  const drillItems = content.blocks
    .filter(
      (block): block is Extract<Block, { kind: 'drill' }> =>
        block.kind === 'drill'
    )
    .flatMap((block) => block.items)
  if (drillItems.length < 4) fail(`${id} 的 drill 少于 4 题`)
  for (const mode of ['spelling', 'dictation', 'recall'] as const) {
    if (!drillItems.some((item) => item.mode === mode)) {
      fail(`${id} 的 drill 缺少 ${mode} 题`)
    }
  }
  const drillIds = new Set<string>()
  for (const item of drillItems) {
    if (drillIds.has(item.id)) fail(`${id} 的 drill id 重复：${item.id}`)
    drillIds.add(item.id)
    if (item.mode === 'recall') {
      if (!containsPhrase(passageText, item.answer)) {
        fail(`${id} 的 recall 答案未在课文中出现：${item.answer}`)
      }
      continue
    }
    if (!containsPhrase(passageText, item.prompt)) {
      fail(`${id} 的 drill 文本未在课文中出现：${item.prompt}`)
    }
    if (normalize(item.answer) !== normalize(item.prompt)) {
      fail(`${id} 的 drill ${item.id} 的 answer 必须等于 prompt`)
    }
  }

  const grammarBlocks = content.blocks.filter(
    (block): block is Extract<Block, { kind: 'grammar' }> =>
      block.kind === 'grammar'
  )
  for (const block of grammarBlocks) {
    const card = grammarCards[block.cardId]
    if (!card) {
      fail(`${id} 引用了未注册的语法卡：${block.cardId}`)
      continue
    }
    for (const anchor of card.anchors) {
      const anchorContent = contentById.get(anchor.lessonId)
      if (!anchorContent) {
        fail(
          `${id} 的语法卡 ${card.id} 锚句引用了没有内容的讲：${anchor.lessonId}`
        )
        continue
      }
      const anchorIssue = checkAnchorUnit(id, anchor.lessonId, findUnitOfLesson)
      if (anchorIssue) {
        fail(`${id} 的语法卡 ${card.id} ${anchorIssue}`)
      }
      const anchorPassage = anchorContent.blocks
        .filter(
          (candidate): candidate is Extract<Block, { kind: 'passage' }> =>
            candidate.kind === 'passage'
        )
        .flatMap((candidate) => candidate.sentences)
        .map((sentence) => sentence.en)
        .join(' ')
      if (!containsPhrase(anchorPassage, anchor.text)) {
        fail(
          `${id} 的语法卡 ${card.id} 锚句未出现在 ${anchor.lessonId}：${anchor.text}`
        )
      }
    }
  }

  const exerciseItems = content.blocks
    .filter(
      (block): block is Extract<Block, { kind: 'exercise' }> =>
        block.kind === 'exercise'
    )
    .flatMap((block) => block.items)
  const comprehension = exerciseItems.filter(
    (item) => item.focus === 'comprehension'
  )
  if (comprehension.length < 2) {
    fail(`${id} 的理解题少于 2 道，输入词数无法计入`)
  }
  if (!comprehension.some((item) => item.kind !== 'choice')) {
    fail(`${id} 的理解题全是选择题，至少 1 道要写英文（非 choice）`)
  }
  const exerciseIds = new Set<string>()
  for (const item of exerciseItems) {
    if (exerciseIds.has(item.id)) fail(`${id} 的练习 id 重复：${item.id}`)
    exerciseIds.add(item.id)
    if (item.kind === 'choice') {
      if (!item.options) {
        fail(`${id} 的选择题 ${item.id} 缺少选项`)
      } else if (!item.options.includes(item.answer)) {
        fail(`${id} 的选择题 ${item.id} 答案不在选项中`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`✗ 内容校验失败，共 ${errors.length} 项：`)
  errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`)
  })
  process.exit(1)
}

const liveWordTotal = [...contentById.values()].reduce(
  (total, content) => total + content.inputWords,
  0
)
console.log(
  `✓ 内容校验通过：${books.length} 册 / ${allLessons.length} 讲 / ${liveLessons.length} 讲已上线 / 精读共 ${liveWordTotal} 词 / ${Object.keys(grammarCards).length} 张语法卡`
)
