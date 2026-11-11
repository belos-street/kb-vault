import type { ExerciseItem } from '../data/types.ts'
import {
  saveExerciseResults,
  saveRevealed,
  useExerciseResults,
  useRevealedExercises,
  type ExerciseResult
} from '../lib/exercise-progress.ts'
import { RichText } from './rich-text.tsx'

const levelClass: Record<ExerciseItem['level'], string> = {
  基础: 'basic',
  改造: 'rebuild',
  排障: 'debug',
  设计: 'design'
}

const levelOrder: Record<ExerciseItem['level'], number> = {
  基础: 0,
  改造: 1,
  排障: 2,
  设计: 3
}

export function ExerciseBlock({
  title,
  items
}: {
  title: string
  items: ExerciseItem[]
}) {
  const results = useExerciseResults()
  const revealed = useRevealedExercises()
  const orderedItems = [...items].sort(
    (left, right) => levelOrder[left.level] - levelOrder[right.level]
  )
  const correctCount = items.filter(
    (item) => results[item.id] === 'correct'
  ).length
  const answeredCount = items.filter((item) => results[item.id]).length

  function mark(id: string, result: ExerciseResult) {
    const next = { ...results }
    if (next[id] === result) {
      delete next[id]
    } else {
      next[id] = result
    }
    saveExerciseResults(next)
  }

  function reveal(id: string) {
    if (revealed.has(id)) return
    saveRevealed(new Set([...revealed, id]))
  }

  return (
    <section className="exercise-block">
      <header className="exercise-block-head">
        <div>
          <span className="exercise-block-tag">实践练习</span>
          <strong>{title}</strong>
        </div>
        <span className="exercise-block-score" aria-live="polite">
          {answeredCount > 0
            ? `已答 ${answeredCount}/${items.length} · 答对 ${correctCount}/${items.length}`
            : `${items.length} 题 · 先做后看答案`}
        </span>
      </header>

      {orderedItems.map((item, index) => {
        const result = results[item.id]
        return (
          <article key={item.id} className="exercise-item">
            <div className="exercise-item-head">
              <span
                className={`exercise-level level-${levelClass[item.level]}`}>
                {item.level}
              </span>
              <span className="exercise-index">练习 {index + 1}</span>
            </div>
            <div className="exercise-question">
              <RichText text={item.question} />
            </div>

            <div className="exercise-hint">
              <span className="exercise-hint-label">提示</span>
              <RichText text={item.hint} />
            </div>

            {result || revealed.has(item.id) ? (
              <details className="exercise-details" open>
                <summary>查看答案与解析</summary>
                <div className="exercise-answer">
                  <div>
                    <span className="exercise-answer-label">答案</span>
                    <RichText text={item.answer} />
                  </div>
                  <p>
                    <RichText text={item.solution} />
                  </p>
                </div>
              </details>
            ) : (
              <div className="exercise-answer-locked">
                <span>先自测，再看答案</span>
                <button type="button" onClick={() => reveal(item.id)}>
                  不会，直接看答案
                </button>
              </div>
            )}

            <div className="exercise-check">
              <span>自测</span>
              <button
                type="button"
                className={result === 'correct' ? 'active correct' : ''}
                aria-pressed={result === 'correct'}
                onClick={() => mark(item.id, 'correct')}>
                做对了
              </button>
              <button
                type="button"
                className={result === 'wrong' ? 'active wrong' : ''}
                aria-pressed={result === 'wrong'}
                onClick={() => mark(item.id, 'wrong')}>
                做错了
              </button>
            </div>
          </article>
        )
      })}
    </section>
  )
}
