import type { Chapter } from '../data/types.ts'
import { liveLessons, allLessons } from '../data/syllabus.ts'

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
  const finished = allLessons.filter((item) => done.has(item.id)).length
  const livePercent = Math.round((liveLessons.length / allLessons.length) * 100)

  return (
    <>
      <div
        className={open ? 'side-scrim open' : 'side-scrim'}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <button type="button" className="brand" onClick={onHome}>
          <span className="brand-mark">{'{ }'}</span>
          <span className="brand-text">
            <strong>AI Agent 全栈</strong>
            <small>工程实战 · 一次只加一个变量</small>
          </span>
        </button>

        <div className="side-progress">
          <div className="side-progress-row">
            <span>首批纵切</span>
            <span>
              {liveLessons.length} / {allLessons.length} 已上线
            </span>
          </div>
          <div className="bar">
            <i style={{ width: `${livePercent}%` }} />
          </div>
          <div className="side-progress-row side-progress-sub">
            <span>我的进度</span>
            <span>
              {finished} / {allLessons.length}
            </span>
          </div>
        </div>

        <nav className="side-nav" aria-label="课程目录">
          {chapters.map((chapter) => {
            const live = chapter.lessons.filter((item) => item.live).length
            return (
              <section key={chapter.id} className="side-chapter">
                <header className="side-chapter-head">
                  <span className="side-chapter-label">{chapter.label}</span>
                  <h2>{chapter.title}</h2>
                  <span className="side-chapter-count">
                    {live > 0 ? `${live} 篇已上线` : '待更新'}
                  </span>
                </header>
                <ul>
                  {chapter.lessons.map((item) => {
                    const isDone = done.has(item.id)
                    const isCurrent = item.id === currentId
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`side-lesson${isCurrent ? ' current' : ''}${
                            isDone ? ' done' : ''
                          }${item.live ? '' : ' pending'}`}
                          onClick={() => {
                            onNavigate(item.id)
                            onClose()
                          }}>
                          <span className="side-lesson-number">
                            {item.number}
                          </span>
                          <span className="side-lesson-title">
                            <span className="side-lesson-name">
                              {item.title}
                            </span>
                            <span
                              className={`depth-badge depth-${item.depth === '精讲' ? 'deep' : item.depth === '速过' ? 'fast' : 'intro'}`}>
                              {item.depth}
                            </span>
                          </span>
                          <span className="side-lesson-state">
                            {item.live ? (isDone ? '✓' : '') : '待补'}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </nav>

        <footer className="side-foot">
          <a
            href="https://github.com/belos-street/kb-vault/blob/main/src/artificial-intelligence/agent/full-stack/readme.md"
            target="_blank"
            rel="noreferrer">
            原始大纲
          </a>
          <a
            href="https://github.com/belos-street/kb-vault"
            target="_blank"
            rel="noreferrer">
            GitHub
          </a>
        </footer>
      </aside>
    </>
  )
}
