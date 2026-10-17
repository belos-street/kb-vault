import { useState } from 'react'
import { Inlines } from './inlines.tsx'
import { judgeBlank } from './normalize.ts'
import type { LessonProgress, ProgressStore } from './progress.ts'
import type { Lesson, PracticeItem } from './schema/lesson.ts'

// ⑤ 练习三段递进（F4）：理解 choice（机判）→ 操练 drill（机判）→ 产出自判。
// 答案/解析逐题解锁：作答后才展开；禁一键看全。
// drill = 模板句 + 替换槽 + 提示词，逐槽归一化比对、题级全槽对才 ✓。

const GROUPS = [
  { kind: 'choice', head: '理解' },
  { kind: 'drill', head: '操练' },
  { kind: 'produce', head: '产出' }
] as const

export function Practice(props: {
  lesson: Lesson
  progress: LessonProgress
  store: ProgressStore
  onChanged: () => void
}) {
  const { lesson, progress, store, onChanged } = props
  const setVerdict = (id: string, ok: boolean, mode: 'machine' | 'self') => {
    store.setVerdict(lesson.id, lesson.dataVersion, id, { ok, mode })
    onChanged()
  }
  return (
    <div className="practice">
      {GROUPS.map(({ kind, head }) => {
        const items = lesson.practice.filter((p) => p.kind === kind)
        if (items.length === 0) return null
        return (
          <section key={kind}>
            <h3 className="tier-head">{head}</h3>
            {items.map((p) => (
              <QuestionCard
                key={p.id}
                item={p}
                verdict={progress.verdicts[p.id]}
                onVerdict={setVerdict}
              />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function QuestionCard(props: {
  item: PracticeItem
  verdict: { ok: boolean; mode: string } | undefined
  onVerdict: (id: string, ok: boolean, mode: 'machine' | 'self') => void
}) {
  const { item, verdict, onVerdict } = props
  const locked = verdict !== undefined
  return (
    <div className="q-card" id={`q-${item.id}`}>
      <div className="q-head">
        <span className="q-id">{item.id}</span>
        <span className="q-kind">
          {item.kind === 'choice'
            ? '选择'
            : item.kind === 'drill'
              ? '操练'
              : '自判'}
        </span>
        {verdict !== undefined && (
          <span className={`verdict ${verdict.ok ? 'ok' : 'bad'}`}>
            {verdict.ok ? '✓' : '✗'}
          </span>
        )}
      </div>
      {item.kind === 'choice' && (
        <ChoiceAnswer
          item={item}
          locked={locked}
          onVerdict={(ok) => onVerdict(item.id, ok, 'machine')}
        />
      )}
      {item.kind === 'drill' && (
        <DrillAnswer
          item={item}
          locked={locked}
          onVerdict={(ok) => onVerdict(item.id, ok, 'machine')}
        />
      )}
      {item.kind === 'produce' && (
        <ProduceAnswer
          item={item}
          locked={locked}
          onVerdict={(ok) => onVerdict(item.id, ok, 'self')}
        />
      )}
    </div>
  )
}

function ChoiceAnswer(props: {
  item: Extract<PracticeItem, { kind: 'choice' }>
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

function DrillAnswer(props: {
  item: Extract<PracticeItem, { kind: 'drill' }>
  locked: boolean
  onVerdict: (ok: boolean) => void
}) {
  const { item, locked, onVerdict } = props
  const n = item.slots.length
  const [inputs, setInputs] = useState<string[]>(() =>
    Array.from({ length: n }, () => '')
  )
  const [submitted, setSubmitted] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const result = submitted
    ? item.slots.map((acc, i) => judgeBlank(inputs[i] ?? '', acc))
    : null
  // 「不填」合法空（accepts 含 ''）可留空，其余必须填——与 quiz.tsx 同口径
  const hasEmpty = item.slots.some(
    (acc, i) =>
      !acc.some((a) => a.trim() === '') && (inputs[i] ?? '').trim() === ''
  )

  return (
    <>
      <p className="q-stem">
        <Inlines text={item.template} />
      </p>
      <div className="fill-rows">
        {item.slots.map((_, i) => (
          <div className="fill-row" key={i}>
            <label className="fill-label">空 {i + 1}</label>
            <input
              className="fill-input"
              value={inputs[i] ?? ''}
              disabled={locked}
              placeholder={item.hints[i] ?? '输入答案'}
              onChange={(e) => {
                const next = [...inputs]
                next[i] = e.target.value
                setInputs(next)
                setHint(null)
              }}
            />
            {result !== null && (
              <span className={`verdict ${result[i] ? 'ok' : 'bad'}`}>
                {result[i] ? '✓' : '✗'}
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
              onVerdict(
                item.slots.every((acc, i) => judgeBlank(inputs[i] ?? '', acc))
              )
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

function ProduceAnswer(props: {
  item: Extract<PracticeItem, { kind: 'produce' }>
  locked: boolean
  onVerdict: (ok: boolean) => void
}) {
  const { item, locked, onVerdict } = props
  const [showRef, setShowRef] = useState(false)
  return (
    <>
      <p className="q-stem">
        <Inlines text={item.prompt} />
      </p>
      <textarea
        className="self-input"
        rows={3}
        disabled={locked}
        placeholder="写下你的答案（自判题：对照参考后自评）"
      />
      {!locked && !showRef && (
        <button className="btn primary" onClick={() => setShowRef(true)}>
          查看参考
        </button>
      )}
      {showRef && !locked && (
        <>
          <div className="explain">
            <div className="ref-answer">参考答案：</div>
            {item.sample.map((s, i) => (
              <div className="sample" key={i}>
                <Inlines text={s} />
              </div>
            ))}
            <div className="criteria">自判口径：{item.criteria}</div>
          </div>
          <div className="btn-row">
            <span>自评：</span>
            <button className="btn ok" onClick={() => onVerdict(true)}>
              ✓ 我写对了
            </button>
            <button className="btn bad" onClick={() => onVerdict(false)}>
              ✗ 我没写对
            </button>
          </div>
        </>
      )}
    </>
  )
}

function answerText(item: Extract<PracticeItem, { kind: 'drill' }>): string {
  return item.slots.map((acc) => acc.join(' / ')).join('；')
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
