import { getGrammarCard } from '../content/index.ts'
import type { Block } from '../data/types.ts'
import { ChunkList } from './components/ChunkList.tsx'
import { DrillBlock } from './components/DrillBlock.tsx'
import { ExerciseBlock } from './components/ExerciseBlock.tsx'
import { GrammarCardView } from './components/GrammarCardView.tsx'
import { OutputEditor } from './components/OutputEditor.tsx'
import { PassagePlayer } from './components/PassagePlayer.tsx'
import { VocabList } from './components/VocabList.tsx'

const flowLabels: Record<Block['kind'], string> = {
  passage: '听读',
  vocab: '词汇',
  chunks: '句块',
  output: '先写',
  drill: '拼写',
  grammar: '查语法',
  exercise: '练习',
  p: '讲解',
  h2: '讲解',
  note: '提示',
  list: '讲解'
}

export function flowOf(blocks: Block[]): string[] {
  return blocks.map((block) => flowLabels[block.kind])
}

export function BlockRenderer({
  lessonId,
  blocks,
  submitted,
  onSubmitted
}: {
  lessonId: string
  blocks: Block[]
  submitted: boolean
  onSubmitted: () => void
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const step = index + 1
        switch (block.kind) {
          case 'passage':
            return (
              <PassagePlayer
                key={`passage-${block.title}`}
                title={block.title}
                sentences={block.sentences}
                step={step}
              />
            )
          case 'vocab':
            return (
              <VocabList
                key={`vocab-${step}`}
                items={block.items}
                step={step}
              />
            )
          case 'chunks':
            return (
              <ChunkList
                key={`chunks-${step}`}
                items={block.items}
                step={step}
              />
            )
          case 'output':
            return (
              <OutputEditor
                key={`output-${step}`}
                lessonId={lessonId}
                task={block.task}
                step={step}
                onSubmitted={onSubmitted}
              />
            )
          case 'drill':
            return (
              <DrillBlock
                key={`drill-${step}`}
                lessonId={lessonId}
                items={block.items}
                step={step}
              />
            )
          case 'grammar': {
            const card = getGrammarCard(block.cardId)
            if (!card) {
              return (
                <p className="notice" key={`grammar-${block.cardId}`}>
                  语法卡未注册：{block.cardId}
                </p>
              )
            }
            return (
              <GrammarCardView
                key={`grammar-${card.id}-${step}`}
                card={card}
                step={step}
                unlocked={submitted}
              />
            )
          }
          case 'exercise':
            return (
              <ExerciseBlock
                key={`exercise-${block.title}`}
                lessonId={lessonId}
                title={block.title}
                items={block.items}
                step={step}
              />
            )
          case 'p':
            return (
              <p className="prose" key={`p-${index}`}>
                {block.text}
              </p>
            )
          case 'h2':
            return (
              <h2 className="prose-head" key={`h2-${index}`}>
                {block.text}
              </h2>
            )
          case 'note':
            return (
              <aside className="note" key={`note-${index}`}>
                <p className="note-title">{block.title}</p>
                <p>{block.text}</p>
              </aside>
            )
          case 'list':
            return (
              <ul className="prose-list" key={`list-${index}`}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
        }
      })}
    </>
  )
}
