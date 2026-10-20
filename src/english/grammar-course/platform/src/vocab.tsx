import { Inlines } from './inlines.tsx'
import type { Speech } from './use-speech.ts'
import type { Lesson } from './schema/lesson.ts'

// ③ 词汇表（F3）：词卡五要素 + 例句等宽渲染。
// TTS：点词头播放单词；点例句播放例句；点搭配短语播放短语（均只播放，不跳转课文）。
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
              <div
                className={`vc-example${
                  speech.activeKey === `e${i}` ? ' speaking' : ''
                }`}>
                {speech.supported ? (
                  <button
                    className="ex-link"
                    onClick={() => speech.speak(v.example, `e${i}`)}
                    title="点击朗读例句">
                    <Inlines text={v.example} />
                  </button>
                ) : (
                  <Inlines text={v.example} />
                )}
              </div>
              <div className="vc-colloc">
                {v.collocations.map((c, j) => {
                  const collocKey = `c${i}-${j}`
                  return speech.supported ? (
                    <button
                      className={`colloc${
                        speech.activeKey === collocKey ? ' speaking' : ''
                      }`}
                      key={j}
                      onClick={() => speech.speak(c, collocKey)}
                      title="点击朗读短语">
                      {c}
                    </button>
                  ) : (
                    <span className="colloc" key={j}>
                      {c}
                    </span>
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
