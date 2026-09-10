import { useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Eye, RotateCcw, Volume2 } from 'lucide-react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import { PROGRESS_MODES, progressStore } from '../progress.ts'
import { diffTokens, isExactDiff } from '../utils/lcs.ts'
import { initialHint, selectCoreSentences } from '../utils/select.ts'
import { shuffle, tokenize } from '../utils/text.ts'
import { DiffView } from './DiffView.tsx'

interface Result {
  en: string
  correct: boolean
}

/**
 * F2-句子默写：看中文写英文（意 → 形）。
 * 推进规则：必须改到 diff 全等才能进下一句；首次对错计入结果。
 * 困时可「看原句」求助（首次计错），看完后重打到完全正确才放行。
 * 已通过项（localStorage）不再重复出题。
 */
export function SentenceSpelling({ lesson }: { lesson: Lesson }) {
  const { supported, speak } = useSpeech()

  const all = useMemo(() => selectCoreSentences(lesson), [lesson])
  const total = all.length
  const [queue, setQueue] = useState(() => {
    const passed = progressStore.passedSet(lesson.id, PROGRESS_MODES.sentences)
    return shuffle(all.filter((s) => !passed.has(s.en)))
  })
  const [pos, setPos] = useState(0)
  const [input, setInput] = useState('')
  const [ops, setOps] = useState<ReturnType<typeof diffTokens> | null>(null)
  const [passed, setPassed] = useState(false)
  const [surrendered, setSurrendered] = useState(false)
  const [hint, setHint] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [phase, setPhase] = useState<'drill' | 'summary'>(
    queue.length === 0 ? 'summary' : 'drill'
  )
  const countedRef = useRef(false)

  const current = queue[pos]

  const check = () => {
    if (!current || passed) return
    const diff = diffTokens(tokenize(current.en), tokenize(input))
    setOps(diff)
    const ok = isExactDiff(diff)
    if (ok) {
      setPassed(true)
      if (!countedRef.current) {
        setResults([...results, { en: current.en, correct: true }])
        countedRef.current = true
      }
      progressStore.markPassed(lesson.id, PROGRESS_MODES.sentences, current.en)
    } else {
      setPassed(false)
      if (!countedRef.current) {
        setResults([...results, { en: current.en, correct: false }])
        countedRef.current = true
      }
    }
  }

  const giveUp = () => {
    if (!current || countedRef.current) return
    setSurrendered(true)
    setHint(true)
    setResults([...results, { en: current.en, correct: false }])
    countedRef.current = true
  }

  const next = () => {
    if (!passed) return
    setInput('')
    setOps(null)
    setPassed(false)
    setSurrendered(false)
    setHint(false)
    countedRef.current = false
    if (pos + 1 < queue.length) setPos(pos + 1)
    else setPhase('summary')
  }

  const restart = (items: typeof all) => {
    setQueue(shuffle(items))
    setPos(0)
    setInput('')
    setOps(null)
    setPassed(false)
    setSurrendered(false)
    setHint(false)
    setResults([])
    setPhase('drill')
    countedRef.current = false
  }

  if (phase === 'summary') {
    const wrong = results.filter((r) => !r.correct)
    const rate =
      results.length > 0
        ? Math.round(((results.length - wrong.length) / results.length) * 100)
        : 0
    const passedCount = progressStore.passedSet(
      lesson.id,
      PROGRESS_MODES.sentences
    ).size
    return (
      <section className="card">
        <h2>句子默写完成</h2>
        {results.length === 0 ? (
          <p>本模式 {total} 句已全部通过。重新开始可整轮重练。</p>
        ) : (
          <p>
            本次一次通过率 <strong>{rate}%</strong>（
            {results.length - wrong.length} / {results.length}）
          </p>
        )}
        <p className="hint">
          累计已通过 {passedCount} / {total} 句
        </p>
        {wrong.length > 0 && (
          <ul className="plain">
            {wrong.map((r, i) => (
              <li key={i} className="hint">
                {r.en}
              </li>
            ))}
          </ul>
        )}
        <div className="controls">
          {wrong.length > 0 && (
            <button
              className="btn primary"
              onClick={() =>
                restart(all.filter((s) => wrong.some((r) => r.en === s.en)))
              }>
              只重做错句（{wrong.length}）
            </button>
          )}
          <button className="btn" onClick={() => restart(all)}>
            重新开始
          </button>
        </div>
      </section>
    )
  }

  if (!current) return null

  return (
    <section className="card">
      <div className="progress">
        <div style={{ width: `${(pos / queue.length) * 100}%` }} />
      </div>
      <p className="hint">
        第 {pos + 1} / {queue.length} 句 · 看中文默写英文 ·
        完全正确后才能进入下一句
      </p>
      <p className="prompt-zh">
        {current.zh ?? '（本句无中文译文，请听音频默写）'}
      </p>
      <div className="controls">
        <button className="btn" onClick={() => setHint(true)} disabled={hint}>
          看首字母提示
        </button>
        <button className="btn bad" onClick={giveUp} disabled={surrendered}>
          <Eye size={15} /> 看原句（计错）
        </button>
        <button
          className="btn"
          onClick={() => speak(current.en)}
          disabled={!supported}>
          <Volume2 size={15} /> 听发音
        </button>
      </div>
      {hint && (
        <p className="hint mono">
          {surrendered ? current.en : initialHint(current.en)}
        </p>
      )}
      <textarea
        placeholder="默写完整英文句子"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={passed}
      />
      {ops && (
        <div className={`verdict ${passed ? 'ok' : 'bad'}`}>
          {passed ? (
            <>
              <Check size={15} /> 完全正确！
            </>
          ) : (
            <DiffView ops={ops} />
          )}
          <div className="hint">原句：{current.en}</div>
        </div>
      )}
      <div className="controls">
        {passed ? (
          <button className="btn primary" onClick={next}>
            {pos + 1 < queue.length ? '下一句' : '看结果'}{' '}
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={check}
            disabled={input.trim() === ''}>
            {ops !== null ? '重新提交' : '检查'}
          </button>
        )}
        {ops !== null && !passed && supported && (
          <button className="btn" onClick={() => speak(current.en)}>
            <RotateCcw size={15} /> 再听一遍原句
          </button>
        )}
      </div>
    </section>
  )
}
