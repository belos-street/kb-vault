import { useState } from 'react'
import { Inlines } from './inlines.tsx'
import { judgeBlank } from './normalize.ts'
import {
  lessonQuestions,
  lessonStats,
  type LessonProgress,
  type ProgressStore
} from './progress.ts'
import type { Lesson, QuizItem } from './schema/lesson.ts'

// ⑥ 小测（F5）：4~6 题全机判（choice / fill），本课点 + 间隔复习题。
// 判分 + 逐题解锁；汇总（机判/自判分列 + 错题清单跳原题 + 重置本轮）。

export function Quiz(props: {
  lesson: Lesson
  progress: LessonProgress
  store: ProgressStore
  onChanged: () => void
}) {
  const { lesson, progress, store, onChanged } = props
  const setVerdict = (id: string, ok: boolean) => {
    store.setVerdict(lesson.id, lesson.dataVersion, id, { ok, mode: 'machine' })
    onChanged()
  }
  return (
    <section className="section">
      <h2>小测</h2>
      <div className="practice">
        {lesson.quiz.map((q) => (
          <QuizCard
            key={q.id}
            item={q}
            verdict={progress.verdicts[q.id]}
            onVerdict={setVerdict}
          />
        ))}
      </div>
    </section>
  )
}

function QuizCard(props: {
  item: QuizItem
  verdict: { ok: boolean } | undefined
  onVerdict: (id: string, ok: boolean) => void
}) {
  const { item, verdict, onVerdict } = props
  const locked = verdict !== undefined
  return (
    <div className="q-card" id={`q-${item.id}`}>
      <div className="q-head">
        <span className="q-id">{item.id}</span>
        <span className="q-kind">
          {item.kind === 'choice' ? '选择' : '填空'}
        </span>
        {verdict !== undefined && (
          <span className={`verdict ${verdict.ok ? 'ok' : 'bad'}`}>
            {verdict.ok ? '✓' : '✗'}
          </span>
        )}
      </div>
      {item.kind === 'choice' ? (
        <ChoiceQuiz
          item={item}
          locked={locked}
          onVerdict={(ok) => onVerdict(item.id, ok)}
        />
      ) : (
        <FillQuiz
          item={item}
          locked={locked}
          onVerdict={(ok) => onVerdict(item.id, ok)}
        />
      )}
    </div>
  )
}

function ChoiceQuiz(props: {
  item: Extract<QuizItem, { kind: 'choice' }>
  locked: boolean
  onVerdict: (ok: boolean) => void
}) {
  const { item, locked, onVerdict } = props
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <>
      <p className="q-stem">
        <Inlines text={item.stem} />
      </p>
      <ul className="q-options">
        {item.options.map((o, i) => {
          const letter = String.fromCharCode(65 + i)
          const isPicked = picked === i
          return (
            <li key={i}>
              <button
                className={`btn opt ${isPicked ? 'picked' : ''}`}
                disabled={locked}
                onClick={() => {
                  setPicked(i)
                  onVerdict(letter === item.answer.trim().slice(0, 1))
                }}>
                <span className="opt-mark">{letter}.</span>
                <Inlines text={o} />
              </button>
            </li>
          )
        })}
      </ul>
      {locked && <Explain text={item.explanation} answer={item.answer} />}
    </>
  )
}

function FillQuiz(props: {
  item: Extract<QuizItem, { kind: 'fill' }>
  locked: boolean
  onVerdict: (ok: boolean) => void
}) {
  const { item, locked, onVerdict } = props
  const n = item.blanks.length
  const [inputs, setInputs] = useState<string[]>(() =>
    Array.from({ length: n }, () => '')
  )
  const [submitted, setSubmitted] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const perBlank = item.blanks.map((acc, i) => judgeBlank(inputs[i] ?? '', acc))
  const hasEmpty = item.blanks.some(
    (acc, i) =>
      // 「不填」合法空（accepts 含 ''）可留空，其余必须填
      !acc.some((a) => a.trim() === '') && (inputs[i] ?? '').trim() === ''
  )

  return (
    <>
      <p className="q-stem">
        <Inlines text={item.stem} />
      </p>
      <div className="fill-rows">
        {item.blanks.map((_, i) => (
          <div className="fill-row" key={i}>
            <label className="fill-label">空 {i + 1}</label>
            <input
              className="fill-input"
              value={inputs[i] ?? ''}
              disabled={locked}
              placeholder="输入答案"
              onChange={(e) => {
                const next = [...inputs]
                next[i] = e.target.value
                setInputs(next)
                setHint(null)
              }}
            />
            {submitted && (
              <span className={`verdict ${perBlank[i] ? 'ok' : 'bad'}`}>
                {perBlank[i] ? '✓' : '✗'}
              </span>
            )}
          </div>
        ))}
      </div>
      {!locked && (
        <>
          <button
            className="btn primary"
            onClick={() => {
              if (hasEmpty) {
                setHint('请先填完所有空（仅「不填」空可留空）')
                return
              }
              setHint(null)
              setSubmitted(true)
              onVerdict(perBlank.every(Boolean))
            }}>
            提交判分
          </button>
          {hint !== null && <div className="fill-hint">{hint}</div>}
        </>
      )}
      {locked && <Explain text={item.explanation} answer={answerText(item)} />}
    </>
  )
}

function answerText(item: Extract<QuizItem, { kind: 'fill' }>): string {
  return item.blanks.map((acc) => acc.join(' / ')).join('；')
}

function Explain(props: { text: string; answer: string }) {
  return (
    <div className="explain">
      <div className="ref-answer">
        参考答案：
        <Inlines text={props.answer} />
      </div>
      <Inlines text={props.text} />
    </div>
  )
}

// ── 汇总（F5）：机判/自判分列 + 错题清单跳原题 + 重置本轮 ──
export function Summary(props: {
  lesson: Lesson
  progress: LessonProgress
  store: ProgressStore
  onChanged: () => void
}) {
  const { lesson, progress, store, onChanged } = props
  const stats = lessonStats(lesson, progress.verdicts)
  const done = stats.judged > 0 && stats.judged === stats.total
  const wrong = lessonQuestions(lesson).filter(
    (q) => progress.verdicts[q.id]?.ok === false
  )
  return (
    <div className="summary">
      <h3>本课汇总</h3>
      <p className="sum-line">
        机判{' '}
        <strong>
          {stats.machineCorrect}/{stats.machineTotal}
        </strong>
        {' · '}
        自判{' '}
        <strong>
          {stats.selfCorrect}/{stats.selfTotal}
        </strong>
        {' · '}
        合计 {stats.correct}/{stats.total}
      </p>
      {wrong.length > 0 && (
        <p className="sum-line">
          错题：
          {wrong.map((q, i) => (
            <a
              key={q.id}
              className="lesson-ref"
              href={`#q-${q.id}`}
              onClick={(e) => {
                e.preventDefault()
                document
                  .getElementById(`q-${q.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}>
              {i > 0 ? ' · ' : ''}
              {q.id}
            </a>
          ))}
        </p>
      )}
      {done && <p className="sum-line done-mark">全部完成，可进入下一课。</p>}
      <button
        className="btn"
        onClick={() => {
          store.resetLesson(lesson.id)
          onChanged()
        }}>
        重置本轮
      </button>
    </div>
  )
}
