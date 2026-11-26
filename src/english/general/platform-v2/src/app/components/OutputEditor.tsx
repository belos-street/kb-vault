import { useState } from 'react'
import type { OutputTask } from '../../data/types.ts'
import {
  getLessonProgress,
  markSubmitted,
  saveDraft
} from '../../lib/progress.ts'

export function OutputEditor({
  lessonId,
  task,
  onSubmitted
}: {
  lessonId: string
  task: OutputTask
  onSubmitted: () => void
}) {
  const initial = getLessonProgress(lessonId)
  const [draft, setDraft] = useState(initial.draft)
  const [submitted, setSubmitted] = useState(initial.submitted)
  const [checked, setChecked] = useState<number[]>([])

  const wordCount =
    draft.trim().length === 0 ? 0 : draft.trim().split(/\s+/).length

  const handleChange = (value: string) => {
    setDraft(value)
    saveDraft(lessonId, value)
  }

  const handleSubmit = () => {
    if (draft.trim().length === 0) return
    markSubmitted(lessonId)
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
        <span className="section-num">03</span>
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
        <div className="sample">
          <p className="sample-label">参考范文</p>
          <pre className="sample-text">{task.sample}</pre>
        </div>
      ) : (
        <p className="locked-hint">
          提交后才会出现参考范文和下面的语法卡。先写，再对照。
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
