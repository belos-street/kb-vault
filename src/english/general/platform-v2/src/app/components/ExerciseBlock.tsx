import { useState } from 'react'
import type { ExerciseItem } from '../../data/types.ts'
import {
  getLessonProgress,
  saveAnswer,
  type AnswerRecord
} from '../../lib/progress.ts'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

type Status = 'idle' | 'correct' | 'wrong' | 'revealed'

function statusOf(record: AnswerRecord | undefined): Status {
  if (!record) return 'idle'
  if (record.correct === true) return 'correct'
  if (record.correct === false) return 'wrong'
  return 'revealed'
}

export function ExerciseBlock({
  lessonId,
  title,
  items,
  step
}: {
  lessonId: string
  title: string
  items: ExerciseItem[]
  step: number
}) {
  const initial = getLessonProgress(lessonId).answers
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initial)

  const update = (itemId: string, record: AnswerRecord) => {
    setAnswers((current) => ({ ...current, [itemId]: record }))
    saveAnswer(lessonId, itemId, record)
  }

  const handleChange = (itemId: string, value: string) => {
    setAnswers((current) => ({ ...current, [itemId]: { value } }))
    saveAnswer(lessonId, itemId, { value })
  }

  return (
    <section className="section" aria-labelledby="section-practice">
      <div className="section-head">
        <span className="section-num">{String(step).padStart(2, '0')}</span>
        <h2 id="section-practice">{title}</h2>
        <span className="section-hint">先回忆，再选择</span>
      </div>

      <ol className="exercise-list">
        {items.map((item) => {
          const record = answers[item.id]
          const status = statusOf(record)
          const value = record?.value ?? ''

          return (
            <li className="exercise" key={item.id}>
              <div className="exercise-head">
                <span className="level">{item.level}</span>
                <span className="level level-focus">
                  {item.focus === 'comprehension' ? '理解' : '形式'}
                </span>
                <p className="exercise-question">{item.question}</p>
              </div>

              {item.kind === 'choice' ? (
                <div className="options">
                  {(item.options ?? []).map((option) => {
                    const picked = value === option
                    const state =
                      picked && status === 'correct'
                        ? ' is-correct'
                        : picked && status === 'wrong'
                          ? ' is-wrong'
                          : ''
                    return (
                      <button
                        key={option}
                        className={`option${state}`}
                        type="button"
                        onClick={() =>
                          update(item.id, {
                            value: option,
                            correct: option === item.answer
                          })
                        }>
                        {option}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="answer-row">
                  <input
                    className="answer-input"
                    value={value}
                    placeholder={
                      item.kind === 'annotate'
                        ? item.focus === 'comprehension'
                          ? '用英文写一句'
                          : '写出成分划分'
                        : '写出答案'
                    }
                    onChange={(event) =>
                      handleChange(item.id, event.target.value)
                    }
                  />
                  {item.kind === 'annotate' ? (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => update(item.id, { value })}>
                      对照参考
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() =>
                        update(item.id, {
                          value,
                          correct: normalize(value) === normalize(item.answer)
                        })
                      }>
                      检查
                    </button>
                  )}
                </div>
              )}

              {status !== 'idle' && (
                <div className={`feedback feedback-${status}`}>
                  <p className="feedback-label">
                    {status === 'correct'
                      ? item.kind === 'annotate'
                        ? '已自评：写到了要点'
                        : '正确'
                      : status === 'wrong'
                        ? item.kind === 'annotate'
                          ? '已自评：没写到'
                          : '再看一眼'
                        : '已对照'}
                  </p>
                  <p className="feedback-answer">参考：{item.answer}</p>
                  <p className="feedback-solution">{item.solution}</p>
                </div>
              )}

              {item.kind === 'annotate' && status === 'revealed' && (
                <div className="self-check">
                  <p className="muted">
                    对照参考，自己判一句：写到了要点吗？这一步决定它算不算通过。
                  </p>
                  <div className="drill-actions">
                    <button
                      className="btn btn-ink"
                      type="button"
                      onClick={() => update(item.id, { value, correct: true })}>
                      写到了要点
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() =>
                        update(item.id, { value, correct: false })
                      }>
                      没写到
                    </button>
                  </div>
                </div>
              )}

              {item.kind === 'annotate' && status === 'idle' && (
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => update(item.id, { value })}>
                  没写出来？直接看参考
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
