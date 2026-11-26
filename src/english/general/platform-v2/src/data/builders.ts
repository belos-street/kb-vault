import type {
  Block,
  Chunk,
  DrillItem,
  ExerciseItem,
  LessonContent,
  LessonInput,
  OutputTask,
  Sentence,
  VocabItem
} from './types.ts'

export function countWords(text: string): number {
  return text
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, ''))
    .filter((token) => token.length > 0).length
}

export function passage(input: {
  title: string
  sentences: Sentence[]
}): Block {
  return { kind: 'passage', ...input }
}

export function vocab(items: VocabItem[]): Block {
  return { kind: 'vocab', items }
}

export function chunks(items: Chunk[]): Block {
  return { kind: 'chunks', items }
}

export function drill(items: DrillItem[]): Block {
  return { kind: 'drill', items }
}

export function output(task: OutputTask): Block {
  return { kind: 'output', task }
}

/** 只引注册表里的卡片 id，不内联整张卡 */
export function grammar(cardId: string): Block {
  return { kind: 'grammar', cardId }
}

export function exercise(title: string, items: ExerciseItem[]): Block {
  return { kind: 'exercise', title, items }
}

export function defineLesson(input: LessonInput): LessonContent {
  const inputWords = input.blocks
    .filter((block) => block.kind === 'passage')
    .flatMap((block) => block.sentences)
    .reduce((total, sentence) => total + countWords(sentence.en), 0)

  return { ...input, inputWords }
}
