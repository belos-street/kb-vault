import type { Block, Chapter, LessonMeta } from '../data/types.ts'
import { BlockRenderer } from './block-renderer.tsx'
import { RichText } from './rich-text.tsx'

function DepthBadge({ depth }: { depth: LessonMeta['depth'] }) {
  const tone = depth === '精讲' ? 'deep' : depth === '速过' ? 'fast' : 'intro'
  return <span className={`depth-badge depth-${tone}`}>{depth}</span>
}

export function LessonView({
  lesson,
  chapter,
  blocks,
  done,
  prev,
  next,
  onHome,
  onNavigate,
  onToggleDone
}: {
  lesson: LessonMeta
  chapter: Chapter
  blocks: Block[] | undefined
  done: boolean
  prev: LessonMeta | undefined
  next: LessonMeta | undefined
  onHome: () => void
  onNavigate: (id: string) => void
  onToggleDone: () => void
}) {
  const sections = (blocks ?? []).flatMap((block, index) =>
    block.kind === 'h2' ? [{ index, text: block.text }] : []
  )

  return (
    <article className="lesson">
      <nav className="crumb" aria-label="面包屑">
        <button type="button" onClick={onHome}>
          课程地图
        </button>
        <span>/</span>
        <span>{chapter.title}</span>
        <span>/</span>
        <span>{lesson.number}</span>
      </nav>

      <header className="lesson-head">
        <div className="lesson-kicker">
          {chapter.label} · 第 {lesson.number} 篇
        </div>
        <div className="lesson-title-row">
          <h1>{lesson.title}</h1>
          <DepthBadge depth={lesson.depth} />
        </div>
        <p className="lesson-tagline">{lesson.tagline}</p>
        <div className="lesson-meta-row">
          <span>{lesson.minutes} 分钟</span>
          <span>{lesson.points.length} 个知识点</span>
          <span className={lesson.live ? 'meta-live' : 'meta-pending'}>
            {lesson.live ? '已上线' : '待更新'}
          </span>
          <span className={done ? 'meta-done' : ''}>
            {done ? '✓ 已完成' : '未完成'}
          </span>
        </div>
      </header>

      <section className="contract-card" aria-label="本篇五栏执行卡">
        <div className="contract-head">
          <span>本篇执行卡</span>
          <span className="contract-hint">只加一个变量</span>
        </div>
        <div className="contract-grid">
          <div className="contract-item contract-variable">
            <span className="contract-label">本篇变量</span>
            <strong>{lesson.variable}</strong>
          </div>
          <div className="contract-item">
            <span className="contract-label">不改什么</span>
            <strong>{lesson.unchanged}</strong>
          </div>
          <div className="contract-item">
            <span className="contract-label">产物</span>
            <strong>{lesson.artifact}</strong>
          </div>
          <div className="contract-item contract-wide">
            <span className="contract-label">
              {lesson.assertions.length > 0
                ? `${lesson.assertions.length} 条验收`
                : '验收'}
            </span>
            {lesson.assertions.length > 0 ? (
              <ul className="contract-list">
                {lesson.assertions.map((item, index) => (
                  <li key={index}>
                    <span className="contract-index">{index + 1}</span>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="contract-empty">待更新</p>
            )}
          </div>
          <div className="contract-item contract-wide">
            <span className="contract-label">面试可答</span>
            {lesson.interview.length > 0 ? (
              <ul className="contract-list contract-interview">
                {lesson.interview.map((item, index) => (
                  <li key={index}>
                    <span className="contract-index contract-q">Q</span>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="contract-empty">待更新</p>
            )}
          </div>
        </div>
      </section>

      <section className="points-card">
        <h2>本讲知识点</h2>
        <ul>
          {lesson.points.map((point, index) => (
            <li key={index}>
              <span className="point-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <RichText text={point} />
            </li>
          ))}
        </ul>
      </section>

      {sections.length >= 3 ? (
        <nav className="lesson-toc" aria-label="本讲小节">
          <span className="lesson-toc-label">本讲小节</span>
          {sections.map((section) => (
            <a
              key={section.index}
              href={`#section-${section.index}`}
              onClick={(event) => {
                event.preventDefault()
                document
                  .getElementById(`section-${section.index}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}>
              <RichText text={section.text} />
            </a>
          ))}
        </nav>
      ) : null}

      {blocks ? (
        <div className="lesson-body">
          {blocks.map((block, index) => (
            <BlockRenderer key={index} block={block} blockIndex={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-mark">{'{ }'}</div>
          <h2>本篇讲义正在整理</h2>
          <p>
            大纲、执行卡与知识点已经就位。阶段一 1.1–1.4、阶段二 2.1–2.6 与 3.1
            已上线，其余篇目按阶段补齐。
          </p>
        </div>
      )}

      <footer className="lesson-foot">
        {blocks ? (
          <button
            type="button"
            className={`complete-btn${done ? ' done' : ''}`}
            onClick={onToggleDone}>
            {done ? '✓ 已完成本篇' : '标记本篇为已完成'}
          </button>
        ) : null}

        <div className="pager">
          {prev ? (
            <button type="button" onClick={() => onNavigate(prev.id)}>
              <span>← 上一篇</span>
              <strong>
                {prev.number} {prev.title}
              </strong>
            </button>
          ) : (
            <span className="pager-empty" />
          )}
          {next ? (
            <button type="button" onClick={() => onNavigate(next.id)}>
              <span>下一篇 →</span>
              <strong>
                {next.number} {next.title}
              </strong>
            </button>
          ) : (
            <span className="pager-empty" />
          )}
        </div>
      </footer>
    </article>
  )
}
