import type { GrammarCard } from '../../data/types.ts'

export function GrammarCardView({
  card,
  step,
  unlocked
}: {
  card: GrammarCard
  step: number
  unlocked: boolean
}) {
  return (
    <section className="section" aria-labelledby="section-grammar">
      <div className="section-head">
        <span className="section-num">{String(step).padStart(2, '0')}</span>
        <h2 id="section-grammar">查语法</h2>
        <span className="section-hint">只查卡住的那一条</span>
      </div>

      {unlocked ? (
        <article className="grammar-card">
          <h3>{card.title}</h3>
          <p className="grammar-rule">{card.rule}</p>

          <p className="grammar-label">课文锚句</p>
          <ul className="anchor-list">
            {card.anchors.map((anchor) => (
              <li key={`${anchor.lessonId}-${anchor.text}`}>{anchor.text}</li>
            ))}
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
      ) : (
        <div className="locked-card">
          <p className="locked-title">语法卡还没解锁</p>
          <p>
            先完成上面的输出并提交。语法不是第三节课，而是写完之后用来对照的工具。
          </p>
          <p>
            <a className="backlink" href="#/grammar">
              卡住了？打开语法卡列表，只查这一条。
            </a>
          </p>
        </div>
      )}
    </section>
  )
}
