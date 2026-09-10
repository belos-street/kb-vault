import { useState } from 'react'
import type { Lesson, Question } from '../../schema/lesson.ts'
import { normalizeText } from '../utils/text.ts'
import { InlineText } from './InlineText.tsx'

type Verdict = 'correct' | 'wrong'

const matchesAny = (input: string, answers: string[]) => {
  const n = normalizeText(input)
  return answers.some((a) => normalizeText(a) === n)
}

function SelfMark({
  okLabel = '✓ 我写对了',
  badLabel = '✗ 我没写对',
  onMark
}: {
  okLabel?: string
  badLabel?: string
  onMark: (v: Verdict) => void
}) {
  return (
    <div className="controls">
      <button className="btn ok" onClick={() => onMark('correct')}>
        {okLabel}
      </button>
      <button className="btn bad" onClick={() => onMark('wrong')}>
        {badLabel}
      </button>
    </div>
  )
}

function Explanation({ text }: { text: string }) {
  if (text.trim() === '') return null
  return <div className="hint">{text}</div>
}

/** 单题渲染：kind 判别联合分派；verdict 由父组件按题 id 记账 */
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
  const done = verdict !== undefined

  if (q.kind === 'pattern-choice') {
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
                  onPick(i)
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

  if (q.kind === 'judge') {
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

  if (
    q.kind === 'correction' ||
    q.kind === 'fill' ||
    q.kind === 'translation'
  ) {
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

  if (q.kind === 'annotate') {
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
                okLabel="✓ 我标对了"
                badLabel="✗ 我标错了"
                onMark={onVerdict}
              />
            )}
            {verdict !== undefined && <Explanation text={q.explanation} />}
          </div>
        )}
      </div>
    )
  }

  // subjective
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
        <SelfMark okLabel="✓ 达标" badLabel="✗ 未达标" onMark={onVerdict} />
      )}
      {verdict !== undefined && (
        <div className={`verdict ${verdict === 'correct' ? 'ok' : 'bad'}`}>
          {verdict === 'correct' ? '已记录：达标' : '已记录：未达标'}
        </div>
      )}
    </div>
  )
}

/** F4 练习判分：basic/advanced 分层，客观题即判，输入题对照 + 自判，主观题自评 */
export function PracticeGrader({ lesson }: { lesson: Lesson }) {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
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
  }

  return (
    <section className="card">
      <h2>配套练习</h2>
      <p className="hint">
        已答 {answered.length} / {all.length} · 正确率 {percent}%
        {answered.length > 0 && (
          <button className="btn" onClick={reset} style={{ marginLeft: 8 }}>
            重置本轮
          </button>
        )}
      </p>
      {lesson.practice.map((g) => (
        <GroupBlock
          key={g.id}
          group={g}
          verdicts={verdicts}
          inputs={inputs}
          revealed={revealed}
          picks={picks}
          onInput={(id, v) => setInputs({ ...inputs, [id]: v })}
          onVerdict={(id, v) => setVerdicts({ ...verdicts, [id]: v })}
          onReveal={(id) => setRevealed({ ...revealed, [id]: true })}
          onPick={(id, i) => setPicks({ ...picks, [id]: i })}
        />
      ))}
    </section>
  )
}

function GroupBlock({
  group,
  verdicts,
  inputs,
  revealed,
  picks,
  onInput,
  onVerdict,
  onReveal,
  onPick
}: {
  group: Lesson['practice'][number]
  verdicts: Record<string, Verdict>
  inputs: Record<string, string>
  revealed: Record<string, boolean>
  picks: Record<string, number>
  onInput: (id: string, v: string) => void
  onVerdict: (id: string, v: Verdict) => void
  onReveal: (id: string) => void
  onPick: (id: string, i: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3>
        {group.layer === 'basic' ? '【基础层】' : '【强化层】'} {group.id}.{' '}
        {group.title}
      </h3>
      {group.questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 16 }}>
          <QuestionCard
            q={q}
            verdict={verdicts[q.id]}
            input={inputs[q.id] ?? ''}
            revealed={revealed[q.id] === true}
            picked={picks[q.id]}
            onInput={(v) => onInput(q.id, v)}
            onVerdict={(v) => onVerdict(q.id, v)}
            onReveal={() => onReveal(q.id)}
            onPick={(i) => onPick(q.id, i)}
          />
        </div>
      ))}
    </div>
  )
}
