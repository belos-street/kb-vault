import { grammarCards } from '../../content/index.ts'
import { findLesson } from '../../data/syllabus.ts'
import { lessonHref } from '../router.ts'

export function GrammarPage() {
  const cards = Object.values(grammarCards)

  return (
    <main className="shell">
      <header className="masthead">
        <p className="kicker">
          <a className="backlink" href="#/">
            Lexio v2
          </a>
          {' · 查表'}
        </p>
        <h1>语法卡</h1>
        <p className="tagline">
          只查卡住的那一条。没有章节顺序，也不按讲排列。
        </p>
      </header>

      <section className="section">
        <div className="grammar-page">
          {cards.map((card) => (
            <article className="grammar-card" key={card.id}>
              <h3>{card.title}</h3>
              <p className="grammar-rule">{card.rule}</p>

              <p className="grammar-label">课文锚句</p>
              <ul className="anchor-list">
                {card.anchors.map((anchor) => {
                  const lesson = findLesson(anchor.lessonId)
                  return (
                    <li key={`${anchor.lessonId}-${anchor.text}`}>
                      {lesson ? (
                        <a
                          className="backlink"
                          href={lessonHref(anchor.lessonId)}>
                          {anchor.text}
                        </a>
                      ) : (
                        anchor.text
                      )}
                    </li>
                  )
                })}
              </ul>

              <p className="grammar-label">中文 / 方言差异</p>
              <p className="grammar-contrast">{card.contrast}</p>

              <p className="grammar-label">常见错误</p>
              <ul className="error-list">
                {card.commonErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>
          共 {cards.length} 张。跨讲搜索与标签筛选等卡片数 ≥10
          再做；现在只有一个结果，搜索是假功能。
        </p>
      </footer>
    </main>
  )
}
