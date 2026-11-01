import type { Block, Chapter, LessonMeta } from '../data/types.ts'
import { priorityLabels } from '../data/priorities.ts'
import { BlockRenderer } from './block-renderer.tsx'
import { MathText } from './math.tsx'
import { Stars } from './stars.tsx'

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
          {chapter.label} · 第 {lesson.number} 讲
        </div>
        <div className="lesson-title-row">
          <h1>{lesson.title}</h1>
          <span className="lesson-priority">
            <Stars priority={lesson.priority} size="md" />
            <em>{priorityLabels[lesson.priority]}</em>
          </span>
        </div>
        <p className="lesson-tagline">{lesson.tagline}</p>
        <div className="lesson-meta-row">
          <span>{lesson.minutes} 分钟</span>
          <span>{lesson.points.length} 个知识点</span>
          <span className={done ? 'meta-done' : ''}>
            {done ? '✓ 已完成' : '未完成'}
          </span>
        </div>
      </header>

      <section className="points-card">
        <h2>本讲知识点</h2>
        <ul>
          {lesson.points.map((point, index) => (
            <li key={index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <MathText text={point} />
            </li>
          ))}
        </ul>
      </section>

      {blocks ? (
        <div className="lesson-body">
          {blocks.map((block, index) => (
            <BlockRenderer key={index} block={block} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-mark">∂</div>
          <h2>本讲讲义正在整理</h2>
          <p>大纲与知识点已经就位，内容会按章逐步补齐。</p>
        </div>
      )}

      <footer className="lesson-foot">
        {blocks ? (
          <button
            type="button"
            className={`complete-btn${done ? ' done' : ''}`}
            onClick={onToggleDone}>
            {done ? '✓ 已完成本讲' : '标记本讲为已完成'}
          </button>
        ) : null}

        <div className="pager">
          {prev ? (
            <button type="button" onClick={() => onNavigate(prev.id)}>
              <span>← 上一讲</span>
              <strong>
                {prev.number} {prev.title}
              </strong>
            </button>
          ) : (
            <span className="pager-empty" />
          )}
          {next ? (
            <button type="button" onClick={() => onNavigate(next.id)}>
              <span>下一讲 →</span>
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
