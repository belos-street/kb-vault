import { useState } from 'react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import { normalizeText, shuffle } from '../utils/text.ts'
import { InlineText } from './InlineText.tsx'

interface WordItem {
  word: string
  phonetic: string
  meaning: string
  example: string
  collocations: string
  group: 'core' | 'group'
}

interface Result {
  word: string
  correct: boolean
}

function collectWords(lesson: Lesson): WordItem[] {
  return [
    ...lesson.vocab.core.map((w) => ({ ...w, group: 'core' as const })),
    ...lesson.vocab.wordGroups.map((w) => ({
      word: w.word,
      phonetic: '',
      meaning: '词群动词',
      example: w.sentence,
      collocations: w.collocations,
      group: 'group' as const
    }))
  ]
}

/** F2 单词拼写：听音 → 拼写 → 判分，含词群词（Q4），提示分级 */
export function SpellingDrill({ lesson }: { lesson: Lesson }) {
  const { supported, speak } = useSpeech()
  const [queue, setQueue] = useState<WordItem[]>(() =>
    shuffle(collectWords(lesson))
  )
  const [pos, setPos] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState<null | boolean>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [phase, setPhase] = useState<'drill' | 'summary'>('drill')

  const current = queue[pos]

  const check = () => {
    if (!current || checked !== null) return
    const correct = normalizeText(input) === normalizeText(current.word)
    setChecked(correct)
    setResults([...results, { word: current.word, correct }])
  }

  const next = () => {
    setInput('')
    setChecked(null)
    setHintLevel(0)
    if (pos + 1 < queue.length) {
      setPos(pos + 1)
    } else {
      setPhase('summary')
    }
  }

  const restart = (items: WordItem[]) => {
    setQueue(shuffle(items))
    setPos(0)
    setInput('')
    setChecked(null)
    setHintLevel(0)
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
        <h2>拼写完成</h2>
        <p>
          正确率 <strong>{rate}%</strong>（{results.length - wrong.length} /{' '}
          {results.length}）
        </p>
        {wrong.length > 0 && (
          <p className="verdict bad">
            错词：{wrong.map((w) => w.word).join('、')}
          </p>
        )}
        <div className="controls">
          {wrong.length > 0 && (
            <button
              className="btn primary"
              onClick={() =>
                restart(
                  collectWords(lesson).filter((w) =>
                    wrong.some((r) => r.word === w.word)
                  )
                )
              }>
              只重做错词（{wrong.length}）
            </button>
          )}
          <button className="btn" onClick={() => restart(collectWords(lesson))}>
            重新开始
          </button>
        </div>
      </section>
    )
  }

  if (!current) return null
  const firstLetter = current.word.charAt(0)

  return (
    <section className="card">
      <div className="progress">
        <div style={{ width: `${(pos / queue.length) * 100}%` }} />
      </div>
      <p className="hint">
        第 {pos + 1} / {queue.length} 词 ·{' '}
        {current.group === 'core' ? '课内精讲' : '高频词群'}
      </p>
      <div className="controls">
        <button
          className="btn primary"
          onClick={() => speak(current.word)}
          disabled={!supported}>
          🔊 再听一次
        </button>
        <button
          className="btn"
          onClick={() => setHintLevel(1)}
          disabled={hintLevel >= 1}>
          看释义
        </button>
        <button
          className="btn"
          onClick={() => setHintLevel(2)}
          disabled={hintLevel >= 2}>
          看首字母
        </button>
        <button
          className="btn"
          onClick={() => setHintLevel(3)}
          disabled={hintLevel >= 3}>
          看例句
        </button>
      </div>
      {hintLevel >= 1 && <p>释义：{current.meaning}</p>}
      {hintLevel >= 2 && (
        <p>
          首字母：<strong>{firstLetter}___</strong>
        </p>
      )}
      {hintLevel >= 3 && (
        <p className="hint">
          例句：
          <InlineText text={current.example} />
        </p>
      )}
      <input
        type="text"
        placeholder="听音拼写，回车提交"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) =>
          e.key === 'Enter' && (checked === null ? check() : next())
        }
        autoFocus
      />
      {checked !== null && (
        <div className={`verdict ${checked ? 'ok' : 'bad'}`}>
          {checked ? '✅ 正确！' : `❌ 正确拼写：${current.word}`}
          <div className="hint">
            {current.phonetic} {current.meaning} ｜{' '}
            <InlineText text={current.collocations} />
          </div>
        </div>
      )}
      <div className="controls">
        {checked === null ? (
          <button
            className="btn primary"
            onClick={check}
            disabled={input.trim() === ''}>
            提交
          </button>
        ) : (
          <button className="btn primary" onClick={next}>
            {pos + 1 < queue.length ? '下一个 →' : '看结果 →'}
          </button>
        )}
      </div>
    </section>
  )
}
