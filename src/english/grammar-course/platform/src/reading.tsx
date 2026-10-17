import { useState } from 'react'
import { Inlines } from './inlines.tsx'
import { sentenceDomId } from './sentence-id.ts'
import type { Lesson, Sentence } from './schema/lesson.ts'

// ② 课文阅读（F2）：逐句中英对照、段落式、高亮句 + note 注解展开。
export function Reading(props: { lesson: Lesson }) {
  const { lesson } = props
  return (
    <section className="section">
      <h2>课文</h2>
      {lesson.reading.paragraphs.map((para, i) => (
        <div className="rpara" key={i}>
          {para.sentences.map((s, j) => (
            <SentenceRow key={j} s={s} domId={sentenceDomId(lesson, i, j)} />
          ))}
        </div>
      ))}
    </section>
  )
}

function SentenceRow(props: { s: Sentence; domId: string }) {
  const { s, domId } = props
  const [open, setOpen] = useState(false)
  const hasNote = s.note !== undefined && s.note !== ''
  return (
    <div id={domId} className={`srow${s.highlight ? ' hl' : ''}`}>
      <div className="sen">
        <Inlines text={s.en} />
        {hasNote && (
          <button
            className="note-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}>
            {open ? '收起注解' : '为什么这么写'}
          </button>
        )}
      </div>
      <div className="szh">{s.zh}</div>
      {hasNote && open && <div className="snote">{s.note}</div>}
    </div>
  )
}
