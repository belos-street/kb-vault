import { useState } from 'react'
import type { Sentence } from '../../data/types.ts'
import { useSpeech } from '../../lib/speech.ts'

export function PassagePlayer({
  title,
  sentences,
  step
}: {
  title: string
  sentences: Sentence[]
  step: number
}) {
  const [showText, setShowText] = useState(false)
  const [showZh, setShowZh] = useState(false)
  const [rate, setRate] = useState(0.9)
  const {
    supported,
    speaking,
    currentIndex,
    playAll,
    speakOne,
    stop,
    voices,
    voiceURI,
    setVoice
  } = useSpeech()

  const translation = sentences.map((sentence) => sentence.zh).join('')

  const handlePlayAll = () => {
    if (speaking) {
      stop()
      return
    }
    void playAll(
      sentences.map((sentence) => sentence.en),
      rate
    )
  }

  const handleSentence = (index: number) => {
    stop()
    const sentence = sentences[index]
    if (!sentence) return
    void speakOne(sentence.en, index, rate)
  }

  return (
    <section className="section" aria-labelledby="section-read">
      <div className="section-head">
        <span className="section-num">{String(step).padStart(2, '0')}</span>
        <h2 id="section-read">听读</h2>
        <span className="section-hint">先听一遍，再看文本</span>
      </div>

      <div className="reader-toolbar">
        <button className="btn btn-ink" type="button" onClick={handlePlayAll}>
          {speaking ? '停止' : '播放全文'}
        </button>
        <label className="rate">
          <span>语速 {rate.toFixed(1)}x</span>
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.1"
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
          />
        </label>
        {voices.length > 0 && (
          <label className="rate">
            <span>音色</span>
            <select
              className="tag-select voice-select"
              value={voiceURI || voices[0]?.voiceURI || ''}
              onChange={(event) => setVoice(event.target.value)}>
              {voices.map((voice) => (
                <option value={voice.voiceURI} key={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => setShowText((value) => !value)}>
          {showText ? '隐藏文本' : '看文本'}
        </button>
        {showText && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setShowZh((value) => !value)}>
            {showZh ? '隐藏中文' : '显示中文'}
          </button>
        )}
      </div>

      {!supported && (
        <p className="notice">
          当前浏览器不支持语音朗读，可直接阅读文本；建议换 Chrome 或 Edge。
        </p>
      )}

      {showText ? (
        <>
          <article className="passage">
            <h3 className="passage-title">{title}</h3>
            <ol className="sentence-list">
              {sentences.map((sentence, index) => (
                <li key={sentence.en}>
                  <button
                    className={`sentence${currentIndex === index ? ' is-speaking' : ''}`}
                    type="button"
                    onClick={() => handleSentence(index)}>
                    <span className="sentence-en">{sentence.en}</span>
                    {showZh && (
                      <span className="sentence-zh">{sentence.zh}</span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </article>

          <details className="translation">
            <summary>整段参考译文</summary>
            <p>{translation}</p>
          </details>
        </>
      ) : (
        <div className="blind-listen">
          <p>文本已隐藏。先听一遍，再点「看文本」。</p>
        </div>
      )}
    </section>
  )
}
