import { useMemo, useState } from 'react'
import { ArrowRight, Check, RotateCcw, Volume2 } from 'lucide-react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/use-speech.ts'
import { useDrillQueue, useAutoAdvance } from '../hooks/use-drill-queue.ts'
import { PROGRESS_MODES } from '../progress.ts'
import { diffTokens, isExactDiff } from '../utils/lcs.ts'
import { selectCoreSentences } from '../utils/select.ts'
import { tokenize } from '../utils/text.ts'
import { DiffView } from './diff-view.tsx'

/**
 * F2-听写：核心句（Q2）听音复写（音 → 形），大小写与标点不敏感（Q3）。
 * 推进规则：必须改到 diff 全等才能进下一句；首次对错计入结果。
 */
export function DictationDrill({ lesson }: { lesson: Lesson }) {
  const { supported, speak } = useSpeech()

  const all = useMemo(() => selectCoreSentences(lesson), [lesson])
  const total = all.length
  const drill = useDrillQueue({
    lessonId: lesson.id,
    mode: PROGRESS_MODES.dictation,
    items: all,
    keyOf: (s) => s.en
  })
  const { queue, pos, current, isPassed, results, phase, passedCount } = drill
  const [input, setInput] = useState('')
  const [ops, setOps] = useState<ReturnType<typeof diffTokens> | null>(null)

  const check = () => {
    if (!current || isPassed) return
    const diff = diffTokens(tokenize(current.en), tokenize(input))
    setOps(diff)
    if (isExactDiff(diff)) drill.pass()
    else drill.fail()
  }

  const goNext = () => {
    setInput('')
    setOps(null)
    drill.next()
  }

  const restart = (items: typeof all) => {
    setInput('')
    setOps(null)
    drill.restart(items)
  }

  // 答对：绿色通过态短暂停留后自动进入下一句
  useAutoAdvance(isPassed, goNext)

  if (phase === 'summary') {
    const wrong = results.filter((r) => !r.correct)
    const rate =
      results.length > 0
        ? Math.round(((results.length - wrong.length) / results.length) * 100)
        : 0
    return (
      <section className="card">
        <h2>听写完成</h2>
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
                {r.key}
              </li>
            ))}
          </ul>
        )}
        <div className="controls">
          {wrong.length > 0 && (
            <button
              className="btn primary"
              onClick={() =>
                restart(all.filter((s) => wrong.some((r) => r.key === s.en)))
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
        第 {pos + 1} / {queue.length} 句 · 听完整句后默写 ·
        完全正确后才能进入下一句
      </p>
      <div className="controls">
        <button
          className="btn primary"
          onClick={() => speak(current.en)}
          disabled={!supported}>
          <Volume2 size={15} /> 播放本句
        </button>
        <button
          className="btn"
          onClick={() => speak(current.en)}
          disabled={!supported}>
          <RotateCcw size={15} /> 重复播放
        </button>
      </div>
      <textarea
        placeholder="输入你听到的句子"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPassed}
      />
      {ops && (
        <div className={`verdict ${isPassed ? 'ok' : 'bad'}`}>
          {isPassed ? (
            <>
              <Check size={15} /> 完全正确！
            </>
          ) : (
            <DiffView ops={ops} />
          )}
          <div className="hint">
            原句：{current.en}
            {current.zh ? ` ｜ 译文：${current.zh}` : ''}
          </div>
        </div>
      )}
      <div className="controls">
        {isPassed ? (
          <button className="btn success" onClick={goNext}>
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
        {ops !== null && !isPassed && supported && (
          <button className="btn" onClick={() => speak(current.en)}>
            <RotateCcw size={15} /> 再听一遍原句
          </button>
        )}
      </div>
    </section>
  )
}
