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
  items
}: {
  lessonId: string
  title: string
  items: ExerciseItem[]
}) {
  const initial = getLessonProgress(lessonId).answers
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initial)

  const update = (itemId: string, record: AnswerRecord) => {
    setAnswers((current) => ({ ...current, [itemId]: record }))
    saveAnswer(lessonId, itemId, record)
  }

  return (
    <section className="section" aria-labelledby="section-practice">
      <div className="section-head">
        <span className="section-num">06</span>
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
                <span
                  className={`level level-${item.level === '基础' ? 'basic' : 'plus'}`}>
                  {item.level}
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
                      item.kind === 'annotate' ? '写出成分划分' : '写出答案'
                    }
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setAnswers((current) => {
                        const previous = current[item.id]
                        const next: AnswerRecord =
                          previous?.correct === undefined
                            ? { value: nextValue }
                            : { value: nextValue, correct: previous.correct }
                        return { ...current, [item.id]: next }
                      })
                    }}
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
                      ? '正确'
                      : status === 'wrong'
                        ? '再看一眼'
                        : '已对照'}
                  </p>
                  <p className="feedback-answer">参考：{item.answer}</p>
                  <p className="feedback-solution">{item.solution}</p>
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
