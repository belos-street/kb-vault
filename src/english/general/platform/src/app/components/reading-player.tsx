import { useEffect, useRef, useState } from 'react'
import {
  Languages,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward
} from 'lucide-react'
import type { Lesson } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/use-speech.ts'
import { InlineText } from './inline-text.tsx'

/** F1 课文播放：自然段排版 + 逐句朗读 + 段内高亮 + 单句循环 / 中英对照；语速走全局设置 */
export function ReadingPlayer({ lesson }: { lesson: Lesson }) {
  const { supported, speak, stop } = useSpeech()
  const sentences = lesson.reading.sentences
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [showZh, setShowZh] = useState(false)
  const [speechError, setSpeechError] = useState(false)
  const idxRef = useRef(0)
  const playingRef = useRef(false)
  const loopRef = useRef(false)

  // 播放推进时让当前句保持可见
  useEffect(() => {
    document
      .querySelector('.sent.current')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [idx])

  const speakAt = (i: number) => {
    const s = sentences[i]
    if (!s) {
      playingRef.current = false
      setPlaying(false)
      return
    }
    idxRef.current = i
    setIdx(i)
    speak(s.en, {
      onend: () => {
        if (!playingRef.current) return
        if (loopRef.current) {
          speakAt(i)
          return
        }
        const next = i + 1
        if (next < sentences.length) {
          speakAt(next)
        } else {
          playingRef.current = false
          setPlaying(false)
        }
      },
      // 引擎报错 / 静默失败（缺 TTS 引擎的移动端）时结束连播并提示，避免卡死
      onerror: () => {
        playingRef.current = false
        setPlaying(false)
        setSpeechError(true)
      }
    })
  }

  const play = () => {
    loopRef.current = loop
    playingRef.current = true
    setPlaying(true)
    setSpeechError(false)
    speakAt(idxRef.current)
  }

  const pause = () => {
    playingRef.current = false
    setPlaying(false)
    stop()
  }

  const jumpTo = (i: number) => {
    loopRef.current = loop
    playingRef.current = true
    setPlaying(true)
    setSpeechError(false)
    speakAt(i)
  }

  const step = (d: number) => {
    const next = Math.min(Math.max(idxRef.current + d, 0), sentences.length - 1)
    jumpTo(next)
  }

  const toggleLoop = () => {
    const v = !loop
    setLoop(v)
    loopRef.current = v
  }

  // 自然段分组：schema 缺省时整篇一段（对话体课文由 lesson.json 按发言轮分组）
  const paragraphs = lesson.reading.paragraphs ?? [sentences.map((_, i) => i)]

  return (
    <section className="card">
      <h2>{lesson.reading.title}</h2>
      {!supported && (
        <p className="hint">当前浏览器不支持语音合成，仅可阅读。</p>
      )}
      {supported && speechError && (
        <p className="hint">
          朗读失败：当前设备可能缺少英语语音引擎，可在系统「文字转语音（TTS）」设置中启用引擎后重试，或改用桌面端浏览器。
        </p>
      )}
      <div className="controls">
        <button className="btn" onClick={() => step(-1)} disabled={!supported}>
          <SkipBack size={15} /> 上一句
        </button>
        {playing ? (
          <button className="btn primary" onClick={pause}>
            <Pause size={15} /> 暂停
          </button>
        ) : (
          <button className="btn primary" onClick={play} disabled={!supported}>
            <Play size={15} /> 播放
          </button>
        )}
        <button className="btn" onClick={() => step(1)} disabled={!supported}>
          <SkipForward size={15} /> 下一句
        </button>
        <button
          className={loop ? 'btn ok' : 'btn'}
          onClick={toggleLoop}
          disabled={!supported}>
          <Repeat size={15} /> 单句循环{loop ? '开' : '关'}
        </button>
        <button className="btn" onClick={() => setShowZh(!showZh)}>
          <Languages size={15} /> {showZh ? '隐藏中文' : '显示中文'}
        </button>
      </div>
      <p className="hint">
        第 {idx + 1} / {sentences.length} 句 · 点击句中任意句子跳读
      </p>
      {paragraphs.map((group, gi) => (
        <p key={gi} className="para">
          {group.map((i) => {
            const s = sentences[i]
            if (!s) return null
            return (
              <span key={i}>
                <span
                  className={`sent${i === idx ? ' current' : ''}`}
                  onClick={() => supported && jumpTo(i)}>
                  {s.en}
                </span>
                {showZh && s.zh && <span className="zh"> {s.zh}</span>}{' '}
              </span>
            )
          })}
        </p>
      ))}
      {lesson.reading.keyPoints.length > 0 && (
        <div className="keypoints">
          <h3>关键句解析</h3>
          <ul>
            {lesson.reading.keyPoints.map((k, i) => (
              <li key={i}>
                <InlineText text={k.sentence} /> —— {k.analysis}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
