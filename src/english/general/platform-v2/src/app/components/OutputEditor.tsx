import { useMemo, useState } from 'react'
import {
  defaultPatternKeyForTag,
  errorTagLabels,
  errorTags,
  findPatternKey,
  type ErrorTag
} from '../../data/tags.ts'
import type { OutputTask } from '../../data/types.ts'
import { suggestTag } from '../../lib/diff-tags.ts'
import { diffTokens } from '../../lib/lcs.ts'
import {
  addLedgerEntry,
  getDraft,
  isTaskSubmitted,
  listLedger,
  markSubmitted,
  saveDraft
} from '../../lib/progress.ts'
import { tokenize } from '../../lib/text.ts'

/** 按换行与句末标点切句，用于逐句对照；不追求语言学正确，只求稳定配对 */
function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}

export function OutputEditor({
  lessonId,
  task,
  step,
  onSubmitted
}: {
  lessonId: string
  task: OutputTask
  step: number
  onSubmitted: () => void
}) {
  const [draft, setDraft] = useState(() => getDraft(lessonId, task.id))
  const [submitted, setSubmitted] = useState(() =>
    isTaskSubmitted(lessonId, task.id)
  )
  const [checked, setChecked] = useState<number[]>([])
  const [chosenTags, setChosenTags] = useState<Record<number, ErrorTag>>({})
  const [ledgerVersion, setLedgerVersion] = useState(0)

  const wordCount =
    draft.trim().length === 0 ? 0 : draft.trim().split(/\s+/).length
  const mineSentences = splitSentences(draft)
  const sampleSentences = splitSentences(task.sample)
  const pairCount = Math.max(mineSentences.length, sampleSentences.length)

  const savedKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const entry of listLedger()) {
      keys.add(`${entry.lessonId}|${entry.mySentence}|${entry.targetSentence}`)
    }
    return keys
  }, [ledgerVersion])

  const canLedger = task.kind !== 'writing'

  const handleChange = (value: string) => {
    setDraft(value)
    // 句子变了，之前按行号选的标签就不再对应，交回预填
    setChosenTags({})
    saveDraft(lessonId, task.id, value)
  }

  const handleSubmit = () => {
    if (draft.trim().length === 0) return
    markSubmitted(lessonId, task.id)
    setSubmitted(true)
    onSubmitted()
  }

  const toggleCheck = (index: number) => {
    setChecked((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    )
  }

  return (
    <section className="section" aria-labelledby="section-write">
      <div className="section-head">
        <span className="section-num">{String(step).padStart(2, '0')}</span>
        <h2 id="section-write">先写</h2>
        <span className="section-hint">不查语法，先写出来</span>
      </div>

      <p className="prompt">{task.prompt}</p>

      <textarea
        className="editor"
        value={draft}
        placeholder="先用英文写，允许错。写完再提交。"
        rows={7}
        onChange={(event) => handleChange(event.target.value)}
      />

      <div className="editor-foot">
        <span className="muted">{wordCount} words</span>
        <button
          className="btn btn-ink"
          type="button"
          onClick={handleSubmit}
          disabled={draft.trim().length === 0}>
          {submitted ? '已提交，继续修改' : '提交，查看参考'}
        </button>
      </div>

      {submitted ? (
        <>
          <div className="sample">
            <p className="sample-label">参考范文</p>
            <pre className="sample-text">{task.sample}</pre>
          </div>

          <div className="compare">
            <p className="sample-label">
              逐句对照（划掉的是你多写的，下划线是参考多出的）
            </p>
            {Array.from({ length: pairCount }, (_, index) => {
              const mine = mineSentences[index]
              const target = sampleSentences[index]
              if (mine === undefined && target === undefined) return null
              const ops =
                mine === undefined
                  ? []
                  : diffTokens(tokenize(target ?? ''), tokenize(mine))
              const suggestion =
                mine !== undefined && target !== undefined
                  ? suggestTag(mine, target)
                  : null
              const chosen = chosenTags[index]
              const tag = chosen ?? suggestion?.tag
              const patternKey = suggestion
                ? chosen === undefined || chosen === suggestion.tag
                  ? suggestion.patternKey
                  : defaultPatternKeyForTag(chosen)
                : undefined
              const saved =
                mine !== undefined &&
                target !== undefined &&
                savedKeys.has(`${lessonId}|${mine}|${target}`)

              return (
                <div className="compare-row" key={`compare-${index}`}>
                  <span className="compare-index">{index + 1}</span>
                  <div>
                    <p className="diff-line">
                      {mine === undefined && target !== undefined ? (
                        <span className="diff-missing">{target}</span>
                      ) : (
                        ops.map((op, opIndex) => (
                          <span
                            className={`diff-${op.type}`}
                            key={`${op.type}-${opIndex}`}>
                            {op.token}{' '}
                          </span>
                        ))
                      )}
                    </p>

                    {canLedger && suggestion && !suggestion.comparable && (
                      <p className="muted">
                        与参考差异过大，只做对照，不入账。
                      </p>
                    )}

                    {canLedger &&
                      suggestion?.comparable &&
                      tag &&
                      patternKey &&
                      mine &&
                      target && (
                        <div className="tag-row">
                          <span className="tag-label">
                            {saved ? '已入账' : '标签'}
                          </span>
                          <select
                            className="tag-select"
                            value={tag}
                            disabled={saved}
                            onChange={(event) =>
                              setChosenTags((current) => ({
                                ...current,
                                [index]: event.target.value as ErrorTag
                              }))
                            }>
                            {errorTags.map((value) => (
                              <option value={value} key={value}>
                                {errorTagLabels[value]}
                              </option>
                            ))}
                          </select>
                          <span className="muted">
                            {findPatternKey(patternKey)?.label} · 预填：
                            {suggestion.reason}
                          </span>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={saved}
                            onClick={() => {
                              addLedgerEntry({
                                lessonId,
                                mySentence: mine,
                                targetSentence: target,
                                tag,
                                patternKey,
                                tagSource:
                                  chosen === undefined ? 'prefill' : 'manual'
                              })
                              setLedgerVersion((value) => value + 1)
                            }}>
                            {saved ? '已入台账' : '记入台账'}
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              )
            })}
            {!canLedger && (
              <p className="muted">
                自由写只做对照与自评，不入台账；本讲的复述任务才产句对。
              </p>
            )}
            <p className="muted">
              {canLedger
                ? '这不是判分：参考只是一种写法。只有两边都有、且不同的句子可以入账。'
                : '这不是判分：参考只是一种写法。自由写不进台账，避免把「换了内容」记成错误。'}
            </p>
          </div>
        </>
      ) : (
        <p className="locked-hint">
          提交后才会出现参考范文、逐句对照和下面的语法卡。先写，再对照。
        </p>
      )}

      <ul className="checklist">
        {task.checklist.map((item, index) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={checked.includes(index)}
                onChange={() => toggleCheck(index)}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
