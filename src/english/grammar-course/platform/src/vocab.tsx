import { Inlines } from './inlines.tsx'
import type { Speech } from './use-speech.ts'
import type { Lesson } from './schema/lesson.ts'

// ③ 词汇表（F3 + T22）：词卡五要素 + 双例句 + 搭配附例。
// examples[0] = 课文原句、examples[1] = 课外口语例句（「口语」小标签区分）。
// TTS：点词头播放单词；点两句例句播放例句；点搭配短语播短语、点搭配例句播例句。
export function Vocab(props: { lesson: Lesson; speech: Speech }) {
  const { lesson, speech } = props
  return (
    <section className="section">
      <h2>词汇表</h2>
      <ul className="vlist">
        {lesson.vocab.map((v, i) => {
          const wordKey = `v${i}`
          return (
            <li className="vcard" key={i}>
              <div
                className={`vc-head${
                  speech.supported ? ' clickable' : ''
                }${speech.activeKey === wordKey ? ' speaking' : ''}`}
                onClick={
                  speech.supported
                    ? () => speech.speak(v.word, wordKey)
                    : undefined
                }
                title={speech.supported ? '点击朗读单词' : undefined}>
                <span className="vc-word">{v.word}</span>
                <span className="vc-phon">{v.phonetic}</span>
                <span className="vc-pos">{v.pos}</span>
                <span className="vc-mean">{v.meaning}</span>
              </div>
              {v.examples.map((ex, k) => {
                const exKey = `e${i}-${k}`
                const daily = k === 1
                return (
                  <div
                    key={k}
                    className={`vc-example${daily ? ' vc-daily' : ''}${
                      speech.activeKey === exKey ? ' speaking' : ''
                    }`}>
                    {speech.supported ? (
                      <button
                        className="ex-link"
                        onClick={() => speech.speak(ex, exKey)}
                        title={daily ? '点击朗读口语例句' : '点击朗读课文例句'}>
                        {daily && <span className="vc-tag">口语</span>}
                        <Inlines text={ex} />
                      </button>
                    ) : (
                      <>
                        {daily && <span className="vc-tag">口语</span>}
                        <Inlines text={ex} />
                      </>
                    )}
                  </div>
                )
              })}
              <div className="vc-colloc">
                {v.collocations.map((c, j) => {
                  const phraseKey = `c${i}-${j}`
                  const exKey = `x${i}-${j}`
                  return (
                    <div className="colloc-item" key={j}>
                      {speech.supported ? (
                        <button
                          className={`colloc${
                            speech.activeKey === phraseKey ? ' speaking' : ''
                          }`}
                          onClick={() => speech.speak(c.phrase, phraseKey)}
                          title="点击朗读搭配短语">
                          {c.phrase}
                        </button>
                      ) : (
                        <span className="colloc">{c.phrase}</span>
                      )}
                      {speech.supported ? (
                        <button
                          className={`colloc-ex${
                            speech.activeKey === exKey ? ' speaking' : ''
                          }`}
                          onClick={() => speech.speak(c.example, exKey)}
                          title="点击朗读搭配例句">
                          {c.example}
                        </button>
                      ) : (
                        <span className="colloc-ex">{c.example}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
