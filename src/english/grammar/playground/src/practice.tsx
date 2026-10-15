import { useState } from 'react'
import { Blocks, Inlines } from './block-renderer.tsx'
import { judgeFill } from './normalize.ts'
import {
  isMachineQuestion,
  lessonStats,
  type LessonProgress,
  type ProgressStore
} from './progress.ts'
import type { Blank, Lesson, Question } from './schema/lesson.ts'

// 练习判分（T9 框架 + T10 机判 + T11 自判）
// 全部判定读写走 ProgressStore（T12 换后端零改动）；
// 答案 / 解析带 `**` 原文，渲染必须走 Inlines（与提取同源）。

const KIND_LABEL: Record<Question['kind'], string> = {
  choice: '选择',
  fill: '填空',
  correction: '改错',
  translation: '翻译',
  parse: '拆句',
  analyze: '辨析'
}

const TIER_LABEL = { B: 'B 基础', S: 'S 强化', T: 'T 真题级' } as const

export function Practice(props: {
  lesson: Lesson
  progress: LessonProgress
  store: ProgressStore
  onChanged: () => void
}) {
  const { lesson, progress, store, onChanged } = props
  const stats = lessonStats(lesson, progress.verdicts)
  const done = stats.judged === stats.total

  const setVerdict = (id: string, ok: boolean, mode: 'machine' | 'self') => {
    store.setVerdict(lesson.key, lesson.dataVersion, id, { ok, mode })
    onChanged()
  }

  // B / S 分层分组
  const tiers = (['B', 'S', 'T'] as const).filter((t) =>
    lesson.questions.some((q) => q.tier === t)
  )

  return (
    <div className="practice">
      {tiers.map((tier) => (
        <section key={tier}>
          <h3 className="tier-head">{TIER_LABEL[tier]}</h3>
          {lesson.questions
            .filter((q) => q.tier === tier)
            .map((q) => (
              <QuestionCard
                key={q.id}
                q={q}
                lesson={lesson}
                verdict={progress.verdicts[q.id]}
                onVerdict={setVerdict}
              />
            ))}
        </section>
      ))}

      {done && (
        <div className="summary card">
          <h3>本讲汇总</h3>
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
          {stats.correct < stats.total && (
            <p className="sum-line">
              错题：
              {lesson.questions
                .filter((q) => progress.verdicts[q.id]?.ok === false)
                .map((q, i) => (
                  <a
                    key={q.id}
                    className="lesson-ref"
                    href={`#q-${q.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(`q-${q.id}`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                      })
                    }}>
                    {i > 0 ? ' · ' : ''}
                    {q.id}
                  </a>
                ))}
            </p>
          )}
          <button
            className="btn"
            onClick={() => {
              store.resetLesson(lesson.key)
              onChanged()
            }}>
            重置本轮
          </button>
        </div>
      )}
    </div>
  )
}

function QuestionCard(props: {
  q: Question
  lesson: Lesson
  verdict: { ok: boolean; mode: string } | undefined
  onVerdict: (id: string, ok: boolean, mode: 'machine' | 'self') => void
}) {
  const { q, lesson, verdict, onVerdict } = props
  const locked = verdict !== undefined
  return (
    <div className="q-card" id={`q-${q.id}`}>
      <div className="q-head">
        <span className="q-id">{q.id}</span>
        <span className="q-kind">{KIND_LABEL[q.kind]}</span>
        {verdict !== undefined && (
          <span className={`verdict ${verdict.ok ? 'ok' : 'bad'}`}>
            {verdict.ok ? '✓' : '✗'}
          </span>
        )}
      </div>
      <Blocks blocks={q.stem} ctx={lesson} onGoto={noop} />
      <AnswerArea
        q={q}
        lesson={lesson}
        locked={locked}
        onVerdict={(ok, mode) => onVerdict(q.id, ok, mode)}
      />
      {locked && <Explanation q={q} lesson={lesson} />}
    </div>
  )
}

function Explanation(props: { q: Question; lesson: Lesson }) {
  const { q, lesson } = props
  return (
    <div className="explain">
      <div className="ref-answer">
        参考答案：
        <Inlines text={q.answer} ctx={lesson} onGoto={noop} />
      </div>
      <Inlines text={q.explanation} ctx={lesson} onGoto={noop} />
    </div>
  )
}

function AnswerArea(props: {
  q: Question
  lesson: Lesson
  locked: boolean
  onVerdict: (ok: boolean, mode: 'machine' | 'self') => void
}) {
  const { q, lesson, locked, onVerdict } = props
  const machine = isMachineQuestion(q)

  if (q.kind === 'choice' && machine) {
    return <ChoiceAnswer q={q} locked={locked} onVerdict={onVerdict} />
  }
  if (q.kind === 'fill' && machine && q.blanks !== undefined) {
    return (
      <FillAnswer
        q={q}
        blanks={q.blanks}
        locked={locked}
        onVerdict={onVerdict}
      />
    )
  }
  return (
    <SelfAnswer q={q} lesson={lesson} locked={locked} onVerdict={onVerdict} />
  )
}

function ChoiceAnswer(props: {
  q: Question
  locked: boolean
  onVerdict: (ok: boolean, mode: 'machine') => void
}) {
  const { q, locked, onVerdict } = props
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <ul className="q-options">
      {(q.options ?? []).map((o, i) => {
        const letter = String.fromCharCode(65 + i)
        const isPicked = picked === i
        return (
          <li key={i}>
            <button
              className={`btn opt ${isPicked ? 'picked' : ''}`}
              disabled={locked}
              onClick={() => {
                setPicked(i)
                onVerdict(letter === q.answer.trim().slice(0, 1), 'machine')
              }}>
              <span className="opt-mark">{letter}.</span>
              <span>{o}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function FillAnswer(props: {
  q: Question
  blanks: Blank[]
  locked: boolean
  onVerdict: (ok: boolean, mode: 'machine') => void
}) {
  const { blanks, locked, onVerdict } = props
  const [inputs, setInputs] = useState<string[]>(() => blanks.map(() => ''))
  const [submitted, setSubmitted] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const result = submitted ? judgeFill(inputs, blanks) : null

  // F3 异常条款：空输入不允许提交——但参考答案为「不填」的空（allowEmpty）豁免
  const hasUnanswered = blanks.some(
    (b, i) => !b.allowEmpty && (inputs[i] ?? '').trim() === ''
  )

  return (
    <div className="fill-area">
      <div className="fill-rows">
        {blanks.map((b, i) => (
          <div className="fill-row" key={i}>
            <label className="fill-label">空 {i + 1}</label>
            <input
              className="fill-input"
              value={inputs[i] ?? ''}
              disabled={locked}
              placeholder={b.allowEmpty ? '可留空 / 点 ∅ 表示不填' : '输入答案'}
              onChange={(e) => {
                const next = [...inputs]
                next[i] = e.target.value
                setInputs(next)
                setHint(null) // 开始补填即消失提示，不必等再次提交
              }}
            />
            {b.allowEmpty && !locked && (
              <button
                className="btn icon"
                title="不填"
                onClick={() => {
                  const next = [...inputs]
                  next[i] = ''
                  setInputs(next)
                }}>
                ∅
              </button>
            )}
            {result !== null && (
              <span className={`verdict ${result.perBlank[i] ? 'ok' : 'bad'}`}>
                {result.perBlank[i] ? '✓' : '✗'}
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
              if (hasUnanswered) {
                setHint('请先作答（仅「不填」空可留空）')
                return
              }
              setHint(null)
              const { ok } = judgeFill(inputs, blanks)
              setSubmitted(true)
              onVerdict(ok, 'machine')
            }}>
            提交判分
          </button>
          {hint !== null && <div className="fill-hint">{hint}</div>}
        </>
      )}
    </div>
  )
}

function SelfAnswer(props: {
  q: Question
  lesson: Lesson
  locked: boolean
  onVerdict: (ok: boolean, mode: 'self') => void
}) {
  const { q, lesson, locked, onVerdict } = props
  const [showRef, setShowRef] = useState(false)
  return (
    <div className="self-area">
      <textarea
        className="self-input"
        rows={3}
        disabled={locked}
        placeholder="写下你的答案（自判题：对照参考解析后自评）"
      />
      {!locked && !showRef && (
        <button className="btn primary" onClick={() => setShowRef(true)}>
          查看参考
        </button>
      )}
      {showRef && !locked && (
        <>
          <Explanation q={q} lesson={lesson} />
          <div className="btn-row">
            <span>自评：</span>
            <button className="btn ok" onClick={() => onVerdict(true, 'self')}>
              ✓ 我写对了
            </button>
            <button
              className="btn bad"
              onClick={() => onVerdict(false, 'self')}>
              ✗ 我没写对
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function noop() {
  /* 题干 / 解析内讲次引用暂不跳转 */
}
