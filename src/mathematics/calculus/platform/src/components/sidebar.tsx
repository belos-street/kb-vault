import type { Chapter } from '../data/types.ts'

export function Sidebar({
  chapters,
  currentId,
  done,
  open,
  onNavigate,
  onHome,
  onClose
}: {
  chapters: Chapter[]
  currentId: string | null
  done: Set<string>
  open: boolean
  onNavigate: (id: string) => void
  onHome: () => void
  onClose: () => void
}) {
  const total = chapters.reduce(
    (sum, chapter) => sum + chapter.lessons.length,
    0
  )
  const finished = chapters.reduce(
    (sum, chapter) =>
      sum + chapter.lessons.filter((lesson) => done.has(lesson.id)).length,
    0
  )
  const percent = total === 0 ? 0 : Math.round((finished / total) * 100)

  return (
    <>
      <div
        className={open ? 'side-scrim open' : 'side-scrim'}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <button type="button" className="brand" onClick={onHome}>
          <span className="brand-mark">∫</span>
          <span className="brand-text">
            <strong>高等数学</strong>
            <small>考研数二 · 上册</small>
          </span>
        </button>

        <div className="side-progress">
          <div className="side-progress-row">
            <span>学习进度</span>
            <span>
              {finished} / {total}
            </span>
          </div>
          <div className="bar">
            <i style={{ width: `${percent}%` }} />
          </div>
        </div>

        <nav className="side-nav" aria-label="课程目录">
          {chapters.map((chapter) => (
            <section key={chapter.id} className="side-chapter">
              <header className="side-chapter-head">
                <span className="side-chapter-label">{chapter.label}</span>
                <h2>{chapter.title}</h2>
                <span className="side-chapter-count">
                  {
                    chapter.lessons.filter((lesson) => done.has(lesson.id))
                      .length
                  }
                  {' / '}
                  {chapter.lessons.length}
                </span>
              </header>
              <ul>
                {chapter.lessons.map((lesson) => {
                  const isDone = done.has(lesson.id)
                  const isCurrent = lesson.id === currentId
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={`side-lesson${isCurrent ? ' current' : ''}${
                          isDone ? ' done' : ''
                        }${lesson.live ? '' : ' pending'}`}
                        onClick={() => {
                          onNavigate(lesson.id)
                          onClose()
                        }}>
                        <span className="side-lesson-number">
                          {lesson.number}
                        </span>
                        <span className="side-lesson-title">
                          {lesson.title}
                        </span>
                        <span className="side-lesson-state">
                          {lesson.live ? (isDone ? '✓' : '') : '待补'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </nav>

        <footer className="side-foot">
          <a href="../mathematics/calculus/readme.html">原始大纲笔记</a>
          <a href="https://github.com/belos-street/kb-vault">GitHub</a>
        </footer>
      </aside>
    </>
  )
}
