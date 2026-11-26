import { useState } from 'react'
import { findContent } from '../content/index.ts'
import { findLesson, findUnitOfLesson } from '../data/syllabus.ts'
import { getLessonProgress } from '../lib/progress.ts'
import type { Block } from '../data/types.ts'
import { topicLabels } from '../data/types.ts'
import { ChunkList } from './components/ChunkList.tsx'
import { DrillBlock } from './components/DrillBlock.tsx'
import { ExerciseBlock } from './components/ExerciseBlock.tsx'
import { GrammarCardView } from './components/GrammarCardView.tsx'
import { OutputEditor } from './components/OutputEditor.tsx'
import { PassagePlayer } from './components/PassagePlayer.tsx'
import { VocabList } from './components/VocabList.tsx'

function findBlock<K extends Block['kind']>(
  blocks: Block[],
  kind: K
): Extract<Block, { kind: K }> | undefined {
  return blocks.find((block) => block.kind === kind) as
    | Extract<Block, { kind: K }>
    | undefined
}

const LESSON_ID = 'p01'

export function App() {
  const content = findContent(LESSON_ID)
  const meta = findLesson(LESSON_ID)
  const location = findUnitOfLesson(LESSON_ID)
  const [submitted, setSubmitted] = useState(
    () => getLessonProgress(LESSON_ID).submitted
  )

  if (!content || !meta || !location) {
    return <main className="shell">课程数据缺失。</main>
  }

  const passageBlock = findBlock(content.blocks, 'passage')
  const vocabBlock = findBlock(content.blocks, 'vocab')
  const chunkBlock = findBlock(content.blocks, 'chunks')
  const outputBlock = findBlock(content.blocks, 'output')
  const drillBlock = findBlock(content.blocks, 'drill')
  const grammarBlock = findBlock(content.blocks, 'grammar')
  const exerciseBlock = findBlock(content.blocks, 'exercise')

  if (
    !passageBlock ||
    !vocabBlock ||
    !chunkBlock ||
    !outputBlock ||
    !drillBlock ||
    !grammarBlock ||
    !exerciseBlock
  ) {
    return <main className="shell">本讲内容不完整。</main>
  }

  return (
    <main className="shell">
      <header className="masthead">
        <p className="kicker">
          Lexio v2 · {location.book.title} · {location.unit.title}
        </p>
        <h1>{content.title}</h1>
        <p className="tagline">{meta.tagline}</p>
        <div className="meta-row">
          <span>{content.minutes} 分钟</span>
          <span>{content.inputWords} 词</span>
          <span>{topicLabels[content.topic]}</span>
          <span>{meta.number}</span>
        </div>
      </header>

      <nav className="flow" aria-label="本讲顺序">
        <span>听读</span>
        <span>词汇 / 句块</span>
        <span>先写</span>
        <span>查语法</span>
        <span>拼写</span>
        <span>练习</span>
      </nav>

      <PassagePlayer
        title={passageBlock.title}
        sentences={passageBlock.sentences}
        translation={passageBlock.translation}
      />

      <section className="section" aria-labelledby="section-vocab">
        <div className="section-head">
          <span className="section-num">02</span>
          <h2 id="section-vocab">词汇与句块</h2>
          <span className="section-hint">读完速览，不背表</span>
        </div>

        <h3 className="subhead">词汇</h3>
        <VocabList items={vocabBlock.items} />

        <h3 className="subhead">句块</h3>
        <ChunkList items={chunkBlock.items} />
      </section>

      <OutputEditor
        lessonId={LESSON_ID}
        task={outputBlock.task}
        onSubmitted={() => setSubmitted(true)}
      />

      <GrammarCardView card={grammarBlock.card} unlocked={submitted} />

      <section className="section" aria-labelledby="section-drill">
        <div className="section-head">
          <span className="section-num">05</span>
          <h2 id="section-drill">拼写与听写</h2>
          <span className="section-hint">听音 → 写出，全对才推进</span>
        </div>
        <DrillBlock lessonId={LESSON_ID} items={drillBlock.items} />
      </section>

      <ExerciseBlock
        lessonId={LESSON_ID}
        title={exerciseBlock.title}
        items={exerciseBlock.items}
      />

      <footer className="footer">
        <p>
          下一讲：The Night Bus（待上线）。先把这一讲的输入、输出和错因跑完。
        </p>
      </footer>
    </main>
  )
}
