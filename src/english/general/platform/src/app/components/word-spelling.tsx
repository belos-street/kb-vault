import { useEffect, useState } from 'react'
import { ArrowRight, Check, Volume2, X } from 'lucide-react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/use-speech.ts'
import { useDrillQueue, useAutoAdvance } from '../hooks/use-drill-queue.ts'
import { PROGRESS_MODES } from '../progress.ts'
import { normalizeText } from '../utils/text.ts'
import { ledgerMeaning } from '../vocab-ledger.ts'
import { InlineText } from './inline-text.tsx'

interface WordItem {
  word: string
  phonetic: string
  meaning: string
  example: string
  collocations: string
  group: 'core' | 'group'
}

function collectWords(lesson: Lesson): WordItem[] {
  return [
    ...lesson.vocab.core.map((w) => ({ ...w, group: 'core' as const })),
    ...lesson.vocab.wordGroups.map((w) => ({
      word: w.word,
      phonetic: '',
      // 词群词无释义字段：优先同讲核心词表，再查词汇台账，最后兜底
      meaning:
        lesson.vocab.core.find((c) => c.word === w.word)?.meaning ??
        ledgerMeaning(w.word) ??
        '词群动词',
      example: w.sentence,
      collocations: w.collocations,
      group: 'group' as const
    }))
  ]
}

/**
 * F2-单词：听音 → 拼写 → 判分，含词群词（Q4），提示分级。
 * 推进规则：答错必须重打到完全正确才能进入下一词；首次对错计入结果。
 */
export function WordSpelling({ lesson }: { lesson: Lesson }) {
  const { supported, speak } = useSpeech()
  const total = collectWords(lesson).length
  const drill = useDrillQueue<WordItem>({
    lessonId: lesson.id,
    mode: PROGRESS_MODES.words,
    items: collectWords(lesson),
    keyOf: (w) => w.word
  })
  const { queue, pos, current, isPassed, results, phase, passedCount } = drill
  const [input, setInput] = useState('')
  const [isRevealed, setRevealed] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)

  const check = () => {
    if (!current || isPassed) return
    if (normalizeText(input) === normalizeText(current.word)) {
      drill.pass()
    } else {
      drill.fail()
      setRevealed(true)
    }
  }

  const goNext = () => {
    setInput('')
    setRevealed(false)
    setHintLevel(0)
    drill.next()
  }

  const restart = (items: WordItem[]) => {
    setInput('')
    setRevealed(false)
    setHintLevel(0)
    drill.restart(items)
  }

  // 答对：绿色通过态短暂停留后自动进入下一词
  useAutoAdvance(isPassed, goNext)

  // 换词即自动朗读一次（含首词），无需手动点「再听一次」
  useEffect(() => {
    if (current && supported) speak(current.word)
  }, [current, supported, speak])

  if (phase === 'summary') {
    const wrong = results.filter((r) => !r.correct)
    const rate =
      results.length > 0
        ? Math.round(((results.length - wrong.length) / results.length) * 100)
        : 0
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
            <X size={14} /> 首次拼错的词：{wrong.map((r) => r.key).join('、')}
          </p>
        )}
        <div className="controls">
          {wrong.length > 0 && (
            <button
              className="btn primary"
              onClick={() =>
                restart(
                  collectWords(lesson).filter((w) =>
                    wrong.some((r) => r.key === w.word)
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
        <div style={{ width: `${((passedCount + pos) / total) * 100}%` }} />
      </div>
      <p className="hint">
        本轮第 {pos + 1} / {queue.length} 词 · 总进度 {passedCount} / {total} 词
        · {current.group === 'core' ? '课内精讲' : '高频词群'} ·
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
      {isRevealed && (
        <div className={`verdict ${isPassed ? 'ok' : 'bad'}`}>
          {isPassed ? (
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
        {isPassed ? (
          <button className="btn success" onClick={goNext}>
            {pos + 1 < queue.length ? '下一个' : '看结果'}{' '}
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={check}
            disabled={input.trim() === ''}>
            {isRevealed ? '重新提交' : '提交'}
          </button>
        )}
      </div>
    </section>
  )
}
