import { useRef, useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { Inlines } from './inlines.tsx'
import { sentenceDomId } from './sentence-id.ts'
import type { Speech } from './use-speech.ts'
import type { Lesson, Sentence } from './schema/lesson.ts'

// ② 课文阅读（F2）：逐句中英对照、段落式、高亮句 + note 注解展开。
// TTS：点句播放单句；「自动播放」逐句连播（滚动跟随 + 当前句高亮）。
export function Reading(props: { lesson: Lesson; speech: Speech }) {
  const { lesson, speech } = props
  const flat = flatten(lesson)
  const autoRef = useRef(false)
  const [auto, setAuto] = useState(false)

  const playFrom = (i: number) => {
    if (!autoRef.current || i >= flat.length) {
      autoRef.current = false
      setAuto(false)
      return
    }
    const s = flat[i]
    if (s === undefined) return
    scrollTo(s.domId)
    speech.speak(s.en, s.domId, {
      onend: () => {
        window.setTimeout(() => playFrom(i + 1), 350)
      },
      onerror: () => {
        autoRef.current = false
        setAuto(false)
      }
    })
  }

  const toggleAuto = () => {
    if (auto) {
      autoRef.current = false
      setAuto(false)
      speech.stop()
      return
    }
    autoRef.current = true
    setAuto(true)
    playFrom(0)
  }

  const playOne = (s: Sentence, domId: string) => {
    autoRef.current = false
    setAuto(false)
    speech.speak(s.en, domId)
  }

  return (
    <section className="section">
      <h2>
        课文
        {speech.supported && (
          <button className="btn tts-btn" onClick={toggleAuto}>
            {auto ? '■ 停止' : '▶ 自动播放'}
          </button>
        )}
      </h2>
      {lesson.reading.paragraphs.map((para, i) => (
        <div className="rpara" key={i}>
          {para.sentences.map((s, j) => {
            const domId = sentenceDomId(lesson, i, j)
            return (
              <SentenceRow
                key={j}
                s={s}
                domId={domId}
                speaking={speech.activeKey === domId}
                onPlay={() => playOne(s, domId)}
                speechSupported={speech.supported}
              />
            )
          })}
        </div>
      ))}
    </section>
  )
}

function flatten(lesson: Lesson): Array<{ en: string; domId: string }> {
  const out: Array<{ en: string; domId: string }> = []
  lesson.reading.paragraphs.forEach((para, pi) => {
    para.sentences.forEach((s, si) => {
      out.push({ en: s.en, domId: sentenceDomId(lesson, pi, si) })
    })
  })
  return out
}

function scrollTo(domId: string): void {
  const el = document.getElementById(domId)
  if (el === null) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function SentenceRow(props: {
  s: Sentence
  domId: string
  speaking: boolean
  onPlay: () => void
  speechSupported: boolean
}) {
  const { s, domId, speaking, onPlay, speechSupported } = props
  const [open, setOpen] = useState(false)
  const hasNote = s.note !== undefined && s.note !== ''
  return (
    <div
      id={domId}
      className={`srow${s.highlight ? ' hl' : ''}${speaking ? ' speaking' : ''}`}>
      <div
        className={`sen${speechSupported ? ' clickable' : ''}`}
        onClick={speechSupported ? onPlay : undefined}
        title={speechSupported ? '点击朗读' : undefined}>
        <Inlines text={s.en} />
        {hasNote && (
          <button
            className={`note-toggle${open ? ' open' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            aria-expanded={open}
            aria-label={open ? '收起注解' : '为什么这么写'}
            title={open ? '收起注解' : '为什么这么写'}>
            {open ? <X size={14} /> : <Lightbulb size={14} />}
          </button>
        )}
      </div>
      <div className="szh">{s.zh}</div>
      {hasNote && open && <div className="snote">{s.note}</div>}
    </div>
  )
}
