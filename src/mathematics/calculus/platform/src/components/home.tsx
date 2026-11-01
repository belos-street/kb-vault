import type { Chapter } from '../data/types.ts'
import { totalMinutes } from '../data/syllabus.ts'

export function Home({
  chapters,
  done,
  onOpen
}: {
  chapters: Chapter[]
  done: Set<string>
  onOpen: (id: string) => void
}) {
  const totalLessons = chapters.reduce(
    (sum, chapter) => sum + chapter.lessons.length,
    0
  )
  const firstLive = chapters
    .flatMap((chapter) => chapter.lessons)
    .find((lesson) => lesson.live)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-kicker">考研数学二 · 高等数学（上）</div>
        <h1>
          把极限、导数、积分
          <br />
          拆成一讲一讲地学
        </h1>
        <p className="hero-lead">
          依据框框老师 49 个视频分 P 重新拆分：6 章 39 讲，每讲列出细分知识点，
          配交互函数图、公式推导与例题。当前已上线第一章「函数与极限」。
        </p>
        <div className="hero-stats">
          <div>
            <strong>{chapters.length}</strong>
            <span>章</span>
          </div>
          <div>
            <strong>{totalLessons}</strong>
            <span>讲</span>
          </div>
          <div>
            <strong>{Math.round(totalMinutes / 60)}</strong>
            <span>小时视频</span>
          </div>
          <div>
            <strong>{done.size}</strong>
            <span>讲已完成</span>
          </div>
        </div>
        {firstLive ? (
          <button
            type="button"
            className="hero-cta"
            onClick={() => onOpen(firstLive.id)}>
            从 {firstLive.number} {firstLive.title} 开始
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </section>

      <section className="map" aria-labelledby="map-title">
        <div className="section-head">
          <h2 id="map-title">课程地图</h2>
          <span>点击已上线的讲次进入讲义</span>
        </div>

        {chapters.map((chapter) => {
          const finished = chapter.lessons.filter((lesson) =>
            done.has(lesson.id)
          ).length
          const live = chapter.lessons.filter((lesson) => lesson.live).length

          return (
            <article key={chapter.id} className="chapter-card">
              <header className="chapter-head">
                <div>
                  <div className="chapter-label">
                    {chapter.label}
                    <span
                      className={`chapter-status${live > 0 ? ' live' : ''}`}>
                      {live > 0 ? `${live} 讲已上线` : '待更新'}
                    </span>
                  </div>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.goal}</p>
                </div>
                <div className="chapter-progress">
                  <strong>
                    {finished}
                    <i>/{chapter.lessons.length}</i>
                  </strong>
                  <span>讲完成</span>
                </div>
              </header>

              <ul className="lesson-list">
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className={`lesson-row${done.has(lesson.id) ? ' done' : ''}`}
                      onClick={() => onOpen(lesson.id)}>
                      <span className="lesson-num">{lesson.number}</span>
                      <span className="lesson-main">
                        <strong>
                          {lesson.title}
                          {done.has(lesson.id) ? (
                            <i className="lesson-check">✓</i>
                          ) : null}
                        </strong>
                        <small>{lesson.tagline}</small>
                      </span>
                      <span className="lesson-meta">
                        {lesson.points.length} 个知识点 · {lesson.minutes} 分钟
                      </span>
                      {!lesson.live ? (
                        <span className="lesson-badge">待更新</span>
                      ) : (
                        <span className="lesson-arrow" aria-hidden="true">
                          →
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>
    </div>
  )
}
