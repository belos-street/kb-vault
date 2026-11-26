import { useEffect, useState } from 'react'
import type { DrillItem } from '../../data/types.ts'
import { diffTokens, isExactDiff, type DiffOp } from '../../lib/lcs.ts'
import { getLessonProgress, saveDrillResult } from '../../lib/progress.ts'
import { useSpeech } from '../../lib/speech.ts'
import { isTextEqual, tokenize } from '../../lib/text.ts'

type DrillStatus = 'idle' | 'correct' | 'wrong' | 'revealed'

interface SessionResult {
  id: string
  firstTryCorrect: boolean
}

export function DrillBlock({
  lessonId,
  items
}: {
  lessonId: string
  items: DrillItem[]
}) {
  const passed = getLessonProgress(lessonId).drill
  const [queue, setQueue] = useState<DrillItem[]>(() =>
    items.filter((item) => !passed[item.id])
  )
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<DrillStatus>('idle')
  const [diff, setDiff] = useState<DiffOp[]>([])
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [failedOnce, setFailedOnce] = useState<Set<string>>(() => new Set())
  const [results, setResults] = useState<SessionResult[]>([])
  const [finished, setFinished] = useState(queue.length === 0)
  const { supported, speakOne } = useSpeech()

  const current = queue[index]
  const isLast = index === queue.length - 1
  const firstTryCorrectCount = results.filter(
    (result) => result.firstTryCorrect
  ).length

  useEffect(() => {
    if (!current || !supported || current.mode === 'recall') return
    void speakOne(current.prompt, 0, 0.9)
  }, [current, supported, speakOne])

  const resetItem = () => {
    setInput('')
    setStatus('idle')
    setDiff([])
    setRevealed(false)
    setShowHint(false)
  }

  const restart = (nextQueue: DrillItem[]) => {
    setQueue(nextQueue)
    setIndex(0)
    setResults([])
    setFailedOnce(new Set())
    setFinished(nextQueue.length === 0)
    resetItem()
  }

  const check = () => {
    if (!current || status === 'correct') return
    const correct = isTextEqual(input, current.answer)
    setStatus(correct ? 'correct' : 'wrong')
    if (current.mode !== 'spelling') {
      setDiff(diffTokens(tokenize(current.answer), tokenize(input)))
    }
    if (correct) {
      const firstTryCorrect = !failedOnce.has(current.id)
      saveDrillResult(lessonId, current.id, firstTryCorrect)
      setResults((currentResults) => [
        ...currentResults,
        { id: current.id, firstTryCorrect }
      ])
      return
    }
    setFailedOnce((previous) => new Set(previous).add(current.id))
  }

  const reveal = () => {
    if (!current) return
    setRevealed(true)
    setShowHint(true)
    setStatus('revealed')
    setFailedOnce((previous) => new Set(previous).add(current.id))
  }

  const next = () => {
    if (status !== 'correct') return
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    resetItem()
  }

  const retry = (mode: 'wrong' | 'all') => {
    const wrongIds = new Set(
      results.filter((result) => !result.firstTryCorrect).map((r) => r.id)
    )
    const source =
      mode === 'wrong' ? items.filter((item) => wrongIds.has(item.id)) : items
    restart(source)
  }

  if (finished) {
    const wrongCount = results.filter((r) => !r.firstTryCorrect).length
    const rate =
      results.length === 0
        ? 0
        : Math.round(((results.length - wrongCount) / results.length) * 100)
    return (
      <div className="drill-panel">
        <p className="drill-summary-title">
          {results.length === 0
            ? '本讲拼写与听写已全部通过'
            : '本轮拼写与听写完成'}
        </p>
        {results.length > 0 && (
          <p className="drill-summary-line">
            首次正确率 {rate}%（{results.length - wrongCount} / {results.length}
            ）
          </p>
        )}
        {wrongCount > 0 && (
          <p className="drill-summary-wrong">
            首错题：{wrongCount} 条。建议只重做这些，再进下一讲。
          </p>
        )}
        <div className="drill-actions">
          {wrongCount > 0 && (
            <button
              className="btn btn-ink"
              type="button"
              onClick={() => retry('wrong')}>
              只重做首错题（{wrongCount}）
            </button>
          )}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => retry('all')}>
            重新练全部
          </button>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="drill-panel">
        <p className="drill-summary-title">本讲没有可练的拼写题</p>
      </div>
    )
  }

  const isRecall = current.mode === 'recall'
  const isSentence = current.mode !== 'spelling'
  const modeLabel =
    current.mode === 'spelling'
      ? '听音拼写'
      : current.mode === 'dictation'
        ? '听写整句'
        : '看中文写英文'
  const progress = queue.length === 0 ? 0 : (index / queue.length) * 100

  return (
    <div className="drill-panel">
      <div className="drill-progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className="drill-meta">
        <span>
          第 {index + 1} / {queue.length} 题
        </span>
        <span>{modeLabel}</span>
        <span>首次正确 {firstTryCorrectCount}</span>
      </div>

      <div className="drill-controls">
        {!isRecall && (
          <button
            className="btn btn-ink"
            type="button"
            onClick={() => void speakOne(current.prompt, 0, 0.9)}
            disabled={!supported}>
            再听一次
          </button>
        )}
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => setShowHint(true)}
          disabled={showHint}>
          看提示
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={reveal}
          disabled={revealed}>
          看答案（计错）
        </button>
      </div>

      {isRecall && <p className="drill-cue">{current.prompt}</p>}

      {showHint && <p className="drill-hint">{current.hint}</p>}

      {revealed && <p className="drill-answer">参考：{current.answer}</p>}

      {isSentence ? (
        <textarea
          className="editor drill-input"
          rows={3}
          value={input}
          placeholder={isRecall ? '看中文写英文' : '听完整句，写出英文'}
          onChange={(event) => setInput(event.target.value)}
          disabled={status === 'correct'}
        />
      ) : (
        <input
          className="answer-input drill-input"
          value={input}
          placeholder="听音拼写单词"
          onChange={(event) => setInput(event.target.value)}
          disabled={status === 'correct'}
        />
      )}

      <div className="drill-actions">
        <button
          className="btn btn-ink"
          type="button"
          onClick={check}
          disabled={status === 'correct' || input.trim().length === 0}>
          检查
        </button>
        {status === 'correct' && (
          <button className="btn btn-ghost" type="button" onClick={next}>
            {isLast ? '查看结果' : '下一题'}
          </button>
        )}
      </div>

      {status === 'correct' && (
        <p className="drill-feedback correct">正确，继续。</p>
      )}
      {status === 'wrong' && (
        <p className="drill-feedback wrong">还不对。再听一次，改到完全正确。</p>
      )}
      {status === 'revealed' && (
        <p className="drill-feedback revealed">
          已看答案，这题计为首错；请照着打一遍再继续。
        </p>
      )}

      {diff.length > 0 && !isExactDiff(diff) && (
        <p className="diff-line">
          {diff.map((op, opIndex) => (
            <span className={`diff-${op.type}`} key={`${op.type}-${opIndex}`}>
              {op.token}{' '}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
