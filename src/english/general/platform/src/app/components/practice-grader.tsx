import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import type { Lesson, Question } from '../../schema/lesson.ts'
import { progressStore, type Verdict } from '../progress.ts'
import { normalizeText } from '../utils/text.ts'
import { InlineText } from './inline-text.tsx'

const matchesAny = (input: string, answers: string[]) => {
  const n = normalizeText(input)
  // 空归一化（纯标点 / 非 ASCII 输入）不得判对（T10）
  if (n === '') return false
  return answers.some((a) => normalizeText(a) === n)
}

function SelfMark({
  okLabel = '我写对了',
  badLabel = '我没写对',
  onMark
}: {
  okLabel?: string
  badLabel?: string
  onMark: (v: Verdict) => void
}) {
  return (
    <div className="controls">
      <button className="btn ok" onClick={() => onMark('correct')}>
        <Check size={14} /> {okLabel}
      </button>
      <button className="btn bad" onClick={() => onMark('wrong')}>
        <X size={14} /> {badLabel}
      </button>
    </div>
  )
}

function Explanation({ text }: { text: string }) {
  if (text.trim() === '') return null
  return <div className="hint">{text}</div>
}

interface CardCommon {
  verdict: Verdict | undefined
  onVerdict: (v: Verdict) => void
}

function PatternChoiceCard({
  q,
  picked,
  verdict,
  onVerdict
}: CardCommon & {
  q: Extract<Question, { kind: 'pattern-choice' }>
  picked: number | undefined
  onPick: (i: number) => void
}) {
  const done = verdict !== undefined
  return (
    <div>
      <InlineText text={q.stem} />
      <div className="controls">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer
          const isPicked = picked === i
          const cls = !done
            ? 'btn'
            : isAnswer
              ? 'btn ok'
              : isPicked
                ? 'btn bad'
                : 'btn'
          return (
            <button
              key={i}
              className={cls}
              disabled={done}
              onClick={() => {
                onVerdict(isAnswer ? 'correct' : 'wrong')
              }}>
              {opt}
              {done && isAnswer ? ' ←' : ''}
            </button>
          )
        })}
      </div>
      {done && <Explanation text={q.explanation} />}
    </div>
  )
}

function JudgeCard({
  q,
  verdict,
  onVerdict
}: CardCommon & { q: Extract<Question, { kind: 'judge' }> }) {
  const done = verdict !== undefined
  return (
    <div>
      <InlineText text={q.stem} />
      <div className="controls">
        <button
          className="btn"
          disabled={done}
          onClick={() => onVerdict(q.isCorrect ? 'correct' : 'wrong')}>
          判断：句子正确
        </button>
        <button
          className="btn"
          disabled={done}
          onClick={() => onVerdict(!q.isCorrect ? 'correct' : 'wrong')}>
          判断：句子有错
        </button>
      </div>
      {done && (
        <div className={`verdict ${verdict === 'correct' ? 'ok' : 'bad'}`}>
          {q.isCorrect ? '原句正确' : `原句有错，改正：${q.correction ?? ''}`}
          <Explanation text={q.explanation} />
        </div>
      )}
    </div>
  )
}

function InputAnswerCard({
  q,
  input,
  onInput,
  revealed,
  onReveal,
  verdict,
  onVerdict
}: CardCommon & {
  q: Extract<Question, { kind: 'correction' | 'fill' | 'translation' }>
  input: string
  onInput: (v: string) => void
  revealed: boolean
  onReveal: () => void
}) {
  const done = verdict !== undefined
  const answers = q.kind === 'correction' ? [q.reference] : q.answers
  return (
    <div>
      <InlineText text={q.stem} />
      <input
        type="text"
        value={input}
        onChange={(e) => onInput(e.target.value)}
        disabled={done}
      />
      {!done && !revealed && (
        <div className="controls">
          <button
            className="btn primary"
            disabled={input.trim() === ''}
            onClick={() => {
              if (!matchesAny(input, answers)) onReveal()
              else onVerdict('correct')
            }}>
            检查
          </button>
        </div>
      )}
      {(revealed || done) && (
        <div className={`verdict ${verdict === 'correct' ? 'ok' : 'info'}`}>
          参考答案：{answers.join(' ／ ')}
          {verdict === undefined && <SelfMark onMark={onVerdict} />}
          {verdict !== undefined && <Explanation text={q.explanation} />}
        </div>
      )}
    </div>
  )
}

function AnnotateCard({
  q,
  input,
  onInput,
  revealed,
  onReveal,
  verdict,
  onVerdict
}: CardCommon & {
  q: Extract<Question, { kind: 'annotate' }>
  input: string
  onInput: (v: string) => void
  revealed: boolean
  onReveal: () => void
}) {
  return (
    <div>
      <InlineText text={q.stem} />
      <textarea
        placeholder="写出你的标注（可留空，直接对答案）"
        value={input}
        onChange={(e) => onInput(e.target.value)}
        disabled={revealed}
      />
      {!revealed && (
        <div className="controls">
          <button className="btn primary" onClick={onReveal}>
            对答案
          </button>
        </div>
      )}
      {revealed && (
        <div className="verdict info">
          参考：
          <InlineText text={q.answer} />
          {verdict === undefined && (
            <SelfMark
              okLabel="我标对了"
              badLabel="我标错了"
              onMark={onVerdict}
            />
          )}
          {verdict !== undefined && <Explanation text={q.explanation} />}
        </div>
      )}
    </div>
  )
}

function SubjectiveCard({
  q,
  verdict,
  onVerdict
}: CardCommon & { q: Extract<Question, { kind: 'subjective' }> }) {
  return (
    <div>
      <InlineText text={q.stem} />
      <ul className="plain">
        {q.checklist.map((c, i) => (
          <li key={i}>
            <strong>{c.label}</strong>：{c.text}
          </li>
        ))}
      </ul>
      {verdict === undefined && (
        <SelfMark okLabel="达标" badLabel="未达标" onMark={onVerdict} />
      )}
      {verdict !== undefined && (
        <div className={`verdict ${verdict === 'correct' ? 'ok' : 'bad'}`}>
          {verdict === 'correct' ? '已记录：达标' : '已记录：未达标'}
        </div>
      )}
    </div>
  )
}

/** 题型分发：判别联合收窄后转发到对应子组件 */
function QuestionCard({
  q,
  verdict,
  input,
  revealed,
  picked,
  onInput,
  onVerdict,
  onPick,
  onReveal
}: {
  q: Question
  verdict: Verdict | undefined
  input: string
  revealed: boolean
  picked: number | undefined
  onInput: (v: string) => void
  onVerdict: (v: Verdict) => void
  onPick: (i: number) => void
  onReveal: () => void
}) {
  if (q.kind === 'pattern-choice')
    return (
      <PatternChoiceCard
        q={q}
        picked={picked}
        verdict={verdict}
        onVerdict={onVerdict}
        onPick={onPick}
      />
    )
  if (q.kind === 'judge')
    return <JudgeCard q={q} verdict={verdict} onVerdict={onVerdict} />
  if (q.kind === 'correction' || q.kind === 'fill' || q.kind === 'translation')
    return (
      <InputAnswerCard
        q={q}
        input={input}
        onInput={onInput}
        revealed={revealed}
        onReveal={onReveal}
        verdict={verdict}
        onVerdict={onVerdict}
      />
    )
  if (q.kind === 'annotate')
    return (
      <AnnotateCard
        q={q}
        input={input}
        onInput={onInput}
        revealed={revealed}
        onReveal={onReveal}
        verdict={verdict}
        onVerdict={onVerdict}
      />
    )
  return <SubjectiveCard q={q} verdict={verdict} onVerdict={onVerdict} />
}

/** F4 练习判分：basic/advanced 分层，客观题即判，输入题对照 + 自判，主观题自评。判定持久化。 */
export function PracticeGrader({ lesson }: { lesson: Lesson }) {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() =>
    progressStore.practiceVerdicts(lesson.id)
  )
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [picks, setPicks] = useState<Record<string, number>>({})

  const all = lesson.practice.flatMap((g) => g.questions)
  const answered = all.filter((q) => verdicts[q.id] !== undefined)
  const correct = answered.filter((q) => verdicts[q.id] === 'correct').length
  const percent =
    answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0

  const reset = () => {
    setVerdicts({})
    setInputs({})
    setRevealed({})
    setPicks({})
    progressStore.clearPractice(lesson.id)
  }

  return (
    <section className="card">
      <h2>配套练习</h2>
      <p className="hint">
        已答 {answered.length} / {all.length} · 正确率 {percent}%
        {answered.length > 0 && (
          <button className="btn" onClick={reset} style={{ marginLeft: 8 }}>
            <RotateCcw size={14} /> 重置本轮
          </button>
        )}
      </p>
      {lesson.practice.map((g) => (
        <div key={g.id} style={{ marginBottom: 20 }}>
          <h3>
            {g.layer === 'basic' ? '【基础层】' : '【强化层】'} {g.id}.{' '}
            {g.title}
          </h3>
          {g.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <QuestionCard
                q={q}
                verdict={verdicts[q.id]}
                input={inputs[q.id] ?? ''}
                revealed={revealed[q.id] === true}
                picked={picks[q.id]}
                onPick={(i) => setPicks({ ...picks, [q.id]: i })}
                onInput={(v) => setInputs({ ...inputs, [q.id]: v })}
                onVerdict={(v) => {
                  const next = { ...verdicts, [q.id]: v }
                  setVerdicts(next)
                  progressStore.savePractice(lesson.id, next)
                }}
                onReveal={() => setRevealed({ ...revealed, [q.id]: true })}
              />
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
