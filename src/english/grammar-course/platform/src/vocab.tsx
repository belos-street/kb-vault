import { Inlines } from './inlines.tsx'
import { sentenceDomId } from './sentence-id.ts'
import type { Lesson } from './schema/lesson.ts'

// ③ 词汇表（F3）：词卡五要素 + 例句等宽渲染。
// 例句与课文互链：点例句滚动定位到课文原句（reading 句带 domId）。
export function Vocab(props: { lesson: Lesson }) {
  const { lesson } = props
  // 课文句 domId 索引：例句全称匹配 → 定位
  const sentenceIndex = buildSentenceIndex(lesson)
  return (
    <section className="section">
      <h2>词汇表</h2>
      <ul className="vlist">
        {lesson.vocab.map((v, i) => {
          const target = sentenceIndex.get(v.example)
          return (
            <li className="vcard" key={i}>
              <div className="vc-head">
                <span className="vc-word">{v.word}</span>
                <span className="vc-phon">{v.phonetic}</span>
                <span className="vc-pos">{v.pos}</span>
                <span className="vc-mean">{v.meaning}</span>
              </div>
              <div className="vc-example">
                {target !== undefined ? (
                  <button
                    className="ex-link"
                    onClick={() => scrollToSentence(target)}
                    title="定位课文原句">
                    <Inlines text={v.example} />
                  </button>
                ) : (
                  <Inlines text={v.example} />
                )}
              </div>
              <div className="vc-colloc">
                {v.collocations.map((c, j) => (
                  <span className="colloc" key={j}>
                    {c}
                  </span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function buildSentenceIndex(lesson: Lesson): Map<string, string> {
  const idx = new Map<string, string>()
  lesson.reading.paragraphs.forEach((para, pi) => {
    para.sentences.forEach((s, si) => {
      idx.set(s.en, sentenceDomId(lesson, pi, si))
    })
  })
  return idx
}

function scrollToSentence(domId: string): void {
  const el = document.getElementById(domId)
  if (el === null) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('flash')
  window.setTimeout(() => el.classList.remove('flash'), 1200)
}
