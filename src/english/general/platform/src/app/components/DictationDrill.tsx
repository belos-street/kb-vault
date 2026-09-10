import { useMemo, useState } from 'react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import { diffTokens, isExactDiff } from '../utils/lcs.ts'
import {
  normalizeText,
  shuffle,
  stem,
  tokenize,
  usesAnyWord
} from '../utils/text.ts'

interface Result {
  en: string
  correct: boolean
}

/** F3 句子听写：关键句 + 含精讲词的句子（Q2），大小写与标点不敏感（Q3） */
export function DictationDrill({ lesson }: { lesson: Lesson }) {
  const { supported, speak } = useSpeech()

  const sentences = useMemo(() => {
    const coreSet = new Set(lesson.vocab.core.map((w) => stem(w.word)))
    return lesson.reading.sentences.filter((s) => {
      const isKey = lesson.reading.keyPoints.some((k) => {
        const frag = normalizeText(k.sentence)
        const full = normalizeText(s.en)
        return full.includes(frag) || frag.includes(full)
      })
      return isKey || usesAnyWord(s.en, coreSet)
    })
  }, [lesson])

  const [queue, setQueue] = useState(() => shuffle(sentences))
  const [pos, setPos] = useState(0)
  const [input, setInput] = useState('')
  const [ops, setOps] = useState<ReturnType<typeof diffTokens> | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [phase, setPhase] = useState<'drill' | 'summary'>('drill')

  const current = queue[pos]

  const check = () => {
    if (!current || ops !== null) return
    const diff = diffTokens(tokenize(current.en), tokenize(input))
    setOps(diff)
    setResults([...results, { en: current.en, correct: isExactDiff(diff) }])
  }

  const next = () => {
    setInput('')
    setOps(null)
    if (pos + 1 < queue.length) setPos(pos + 1)
    else setPhase('summary')
  }

  const restart = (items: typeof sentences) => {
    setQueue(shuffle(items))
    setPos(0)
    setInput('')
    setOps(null)
    setResults([])
    setPhase('drill')
  }

  if (phase === 'summary') {
    const wrong = results.filter((r) => !r.correct)
    const rate =
      results.length > 0
        ? Math.round(((results.length - wrong.length) / results.length) * 100)
        : 0
    return (
      <section className="card">
        <h2>听写完成</h2>
        <p>
          正确率 <strong>{rate}%</strong>（{results.length - wrong.length} /{' '}
          {results.length}）
        </p>
        {wrong.length > 0 && (
          <ul>
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
                restart(
                  sentences.filter((s) => wrong.some((r) => r.en === s.en))
                )
              }>
              只重做错句（{wrong.length}）
            </button>
          )}
          <button className="btn" onClick={() => restart(sentences)}>
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
        第 {pos + 1} / {queue.length} 句 · 听完整句后默写（大小写、标点不计错）
      </p>
      <div className="controls">
        <button
          className="btn primary"
          onClick={() => speak(current.en)}
          disabled={!supported}>
          🔊 播放本句
        </button>
        <button
          className="btn"
          onClick={() => speak(current.en)}
          disabled={!supported}>
          🔁 重复播放
        </button>
      </div>
      <textarea
        placeholder="输入你听到的句子"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={ops !== null}
      />
      {ops && (
        <div className={`verdict ${isExactDiff(ops) ? 'ok' : 'bad'}`}>
          {isExactDiff(ops) ? (
            '✅ 完全正确！'
          ) : (
            <div className="diff">
              {ops.map((op, i) => (
                <span key={i} className={op.type}>
                  {op.token}
                </span>
              ))}
            </div>
          )}
          <div className="hint">
            原句：{current.en}
            {current.zh ? ` ｜ 译文：${current.zh}` : ''}
          </div>
        </div>
      )}
      <div className="controls">
        {ops === null ? (
          <button
            className="btn primary"
            onClick={check}
            disabled={input.trim() === ''}>
            检查
          </button>
        ) : (
          <button className="btn primary" onClick={next}>
            {pos + 1 < queue.length ? '下一句 →' : '看结果 →'}
          </button>
        )}
      </div>
    </section>
  )
}
