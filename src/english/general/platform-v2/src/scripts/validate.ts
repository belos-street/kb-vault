import { contents } from '../content/index.ts'
import { countWords } from '../data/builders.ts'
import { allLessons, books, liveLessons } from '../data/syllabus.ts'
import type { Block, LessonContent } from '../data/types.ts'
import { lessonContentSchema } from '../schema/content.ts'

const errors: string[] = []

function fail(message: string): void {
  errors.push(message)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

for (const lessonMap of Object.values(contents)) {
  for (const [id, content] of Object.entries(lessonMap)) {
    if (contentById.has(id)) fail(`内容 ID 重复：${id}`)
    contentById.set(id, content)
  }
}

const seenNumbers = new Set<string>()
for (const lesson of allLessons) {
  if (seenNumbers.has(lesson.number)) fail(`讲编号重复：${lesson.number}`)
  seenNumbers.add(lesson.number)
  if (lesson.targetPatterns.length === 0) fail(`${lesson.id} 缺少目标模式`)
  if (lesson.canDo.length < 2) fail(`${lesson.id} 的 canDo 少于 2 条`)
}

for (const book of books) {
  for (const unit of book.units) {
    const topics = new Set(unit.lessons.map((lesson) => lesson.topic))
    if (topics.size < 3) {
      fail(`${unit.id} 只覆盖 ${topics.size} 类主题，至少需要 3 类`)
    }
  }
}

for (const lesson of liveLessons) {
  if (!contentById.has(lesson.id)) {
    fail(`已上线讲缺少内容：${lesson.id}`)
  }
}

for (const [id, content] of contentById) {
  const meta = metaById.get(id)
  if (!meta) {
    fail(`内容引用未知讲：${id}`)
    continue
  }
  if (!meta.live) {
    fail(`未上线讲不应有内容：${id}`)
  }
  if (meta.topic !== content.topic) {
    fail(`${id} 的 topic 与 syllabus 不一致：${meta.topic} / ${content.topic}`)
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

  const computedWords = passages
    .flatMap((block) => block.sentences)
    .reduce((total, sentence) => total + countWords(sentence.en), 0)
  if (computedWords !== content.inputWords) {
    fail(
      `${id} 的 inputWords 应为 ${computedWords}，实际为 ${content.inputWords}`
    )
  }
  if (computedWords < 150 || computedWords > 250) {
    fail(`${id} 的课文长度 ${computedWords} 词，应在 150~250 之间`)
  }

  const firstOf = (kind: Block['kind']): number =>
    content.blocks.findIndex((block) => block.kind === kind)

  const firstPassage = firstOf('passage')
  const firstVocab = firstOf('vocab')
  const firstChunks = firstOf('chunks')
  const firstOutput = firstOf('output')
  const firstDrill = firstOf('drill')
  const firstGrammar = firstOf('grammar')
  const firstExercise = firstOf('exercise')

  const order: Array<[string, number]> = [
    ['passage', firstPassage],
    ['vocab', firstVocab],
    ['chunks', firstChunks],
    ['output', firstOutput],
    ['drill', firstDrill],
    ['grammar', firstGrammar],
    ['exercise', firstExercise]
  ]
  let previous: [string, number] | undefined
  for (const entry of order) {
    if (entry[1] < 0) continue
    if (previous && previous[1] > entry[1]) {
      fail(`${id} 的块顺序错误：${entry[0]} 必须在 ${previous[0]} 之后`)
    }
    previous = entry
  }

  if (firstVocab < 0) fail(`${id} 缺少 vocab`)
  if (firstOutput < 0) fail(`${id} 缺少 output`)
  if (firstDrill < 0) fail(`${id} 缺少 drill`)

  const passageText = normalize(
    passages
      .flatMap((block) => block.sentences)
      .map((sentence) => sentence.en)
      .join(' ')
  )

  const chunkBlocks = content.blocks.filter(
    (block): block is Extract<Block, { kind: 'chunks' }> =>
      block.kind === 'chunks'
  )
  const chunkItems = chunkBlocks.flatMap((block) => block.items)
  if (chunkItems.length < 5) {
    fail(`${id} 的 chunks 少于 5 条`)
  }

  for (const chunk of chunkItems) {
    if (!passageText.includes(normalize(chunk.text))) {
      fail(`${id} 的 chunk 未在课文中出现：${chunk.text}`)
    }
  }

  const vocabBlocks = content.blocks.filter(
    (block): block is Extract<Block, { kind: 'vocab' }> =>
      block.kind === 'vocab'
  )
  const vocabItems = vocabBlocks.flatMap((block) => block.items)
  if (vocabItems.length < 6) {
    fail(`${id} 的 vocab 少于 6 条`)
  }
  for (const item of vocabItems) {
    if (!passageText.includes(normalize(item.word))) {
      fail(`${id} 的词汇未在课文中出现：${item.word}`)
    }
    if (!passageText.includes(normalize(item.example))) {
      fail(`${id} 的词汇例句不是课文原句：${item.word}`)
    }
  }

  const drillBlocks = content.blocks.filter(
    (block): block is Extract<Block, { kind: 'drill' }> =>
      block.kind === 'drill'
  )
  const drillItems = drillBlocks.flatMap((block) => block.items)
  if (drillItems.length < 4) {
    fail(`${id} 的 drill 少于 4 题`)
  }
  if (!drillItems.some((item) => item.mode === 'spelling')) {
    fail(`${id} 的 drill 缺少 spelling 题`)
  }
  if (!drillItems.some((item) => item.mode === 'dictation')) {
    fail(`${id} 的 drill 缺少 dictation 题`)
  }
  if (!drillItems.some((item) => item.mode === 'recall')) {
    fail(`${id} 的 drill 缺少 recall 题`)
  }
  for (const item of drillItems) {
    if (item.mode === 'recall') {
      if (!passageText.includes(normalize(item.answer))) {
        fail(`${id} 的 recall 答案未在课文中出现：${item.answer}`)
      }
      continue
    }
    if (!passageText.includes(normalize(item.prompt))) {
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
    if (block.card.anchors.length < 2) {
      fail(`${id} 的语法卡 ${block.card.id} 少于 2 个锚句`)
    }
    for (const anchor of block.card.anchors) {
      if (!passageText.includes(normalize(anchor))) {
        fail(`${id} 的语法锚句未在课文中出现：${anchor}`)
      }
    }
  }

  const exerciseBlocks = content.blocks.filter(
    (block): block is Extract<Block, { kind: 'exercise' }> =>
      block.kind === 'exercise'
  )
  for (const block of exerciseBlocks) {
    for (const item of block.items) {
      if (item.kind === 'choice' && !item.options) {
        fail(`${id} 的选择题 ${item.id} 缺少选项`)
      }
      if (item.kind === 'choice' && item.options) {
        if (!item.options.includes(item.answer)) {
          fail(`${id} 的选择题 ${item.id} 答案不在选项中`)
        }
      }
    }
  }
}

const seenChunks = new Map<string, string>()
for (const [id, content] of contentById) {
  for (const block of content.blocks) {
    if (block.kind !== 'chunks') continue
    for (const chunk of block.items) {
      const key = normalize(chunk.text)
      const owner = seenChunks.get(key)
      if (owner && owner !== id) {
        fail(`chunk 跨讲重复：${chunk.text}（${owner} / ${id}）`)
      }
      seenChunks.set(key, id)
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

const totalWords = [...contentById.values()].reduce(
  (total, content) => total + content.inputWords,
  0
)
console.log(
  `✓ 内容校验通过：${books.length} 册 / ${allLessons.length} 讲 / ${liveLessons.length} 讲已上线 / 共 ${totalWords} 词`
)
