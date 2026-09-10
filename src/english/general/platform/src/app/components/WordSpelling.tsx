import { useRef, useState } from 'react'
import { ArrowRight, Check, Volume2, X } from 'lucide-react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/useSpeech.ts'
import { PROGRESS_MODES, progressStore } from '../progress.ts'
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

/**
 * F2-单词：听音 → 拼写 → 判分，含词群词（Q4），提示分级。
 * 推进规则：答错必须重打到完全正确才能进入下一词；首次对错计入结果。
 * 已通过项（localStorage）不再重复出题。
 */
export function WordSpelling({ lesson }: { lesson: Lesson }) {
  const { supported, speak } = useSpeech()
  const all = collectWords(lesson)
  const total = all.length
  const [queue, setQueue] = useState<WordItem[]>(() => {
    const passed = progressStore.passedSet(lesson.id, PROGRESS_MODES.words)
    return shuffle(all.filter((w) => !passed.has(w.word)))
  })
  const [pos, setPos] = useState(0)
  const [input, setInput] = useState('')
  const [passed, setPassed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [phase, setPhase] = useState<'drill' | 'summary'>(
    queue.length === 0 ? 'summary' : 'drill'
  )
  const countedRef = useRef(false)

  const current = queue[pos]

  const check = () => {
    if (!current || passed) return
    const correct = normalizeText(input) === normalizeText(current.word)
    if (correct) {
      setPassed(true)
      if (!countedRef.current) {
        setResults([...results, { word: current.word, correct: true }])
        countedRef.current = true
      }
      progressStore.markPassed(lesson.id, PROGRESS_MODES.words, current.word)
    } else {
      setPassed(false)
      setRevealed(true)
      if (!countedRef.current) {
        setResults([...results, { word: current.word, correct: false }])
        countedRef.current = true
      }
    }
  }

  const next = () => {
    if (!passed) return
    setInput('')
    setPassed(false)
    setRevealed(false)
    setHintLevel(0)
    countedRef.current = false
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
    setPassed(false)
    setRevealed(false)
    setHintLevel(0)
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
      PROGRESS_MODES.words
    ).size
    return (
      <section className="card">
        <h2>单词拼写完成</h2>
        {results.length === 0 ? (
          <p>本模式 {total} 词已全部通过。重新开始可整轮重练。</p>
        ) : (
          <p>
            本次一次通过率 <strong>{rate}%</strong>（
            {results.length - wrong.length} / {results.length}）
          </p>
        )}
        <p className="hint">
          累计已通过 {passedCount} / {total} 词
        </p>
        {wrong.length > 0 && (
          <p className="verdict bad">
            <X size={14} /> 首次拼错的词：{wrong.map((w) => w.word).join('、')}
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
        {current.group === 'core' ? '课内精讲' : '高频词群'} ·
        拼写完全正确后才能进入下一词
      </p>
      <div className="controls">
        <button
          className="btn primary"
          onClick={() => speak(current.word)}
          disabled={!supported}>
          <Volume2 size={15} /> 再听一次
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
      {hintLevel >= 1 && <p className="word-meta">释义：{current.meaning}</p>}
      {hintLevel >= 2 && (
        <p className="word-meta">
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
        onKeyDown={(e) => e.key === 'Enter' && check()}
        autoFocus
      />
      {revealed && (
        <div className={`verdict ${passed ? 'ok' : 'bad'}`}>
          {passed ? (
            <>
              <Check size={15} /> 正确！
            </>
          ) : (
            <>
              <X size={15} /> 正确拼写：{current.word} —— 请照拼输入后继续
            </>
          )}
          <div className="hint">
            {current.phonetic} {current.meaning} ｜{' '}
            <InlineText text={current.collocations} />
          </div>
        </div>
      )}
      <div className="controls">
        {passed ? (
          <button className="btn primary" onClick={next}>
            {pos + 1 < queue.length ? '下一个' : '看结果'}{' '}
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={check}
            disabled={input.trim() === ''}>
            {revealed ? '重新提交' : '提交'}
          </button>
        )}
      </div>
    </section>
  )
}
