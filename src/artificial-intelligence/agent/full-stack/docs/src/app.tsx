import { useEffect, useMemo, useState } from 'react'
import { Home } from './components/home.tsx'
import { LessonView } from './components/lesson-view.tsx'
import { Sidebar } from './components/sidebar.tsx'
import { contents } from './content/index.ts'
import {
  allLessons,
  chapters,
  lessonById,
  liveLessons
} from './data/syllabus.ts'
import { loadProgress, saveProgress } from './lib/progress.ts'

const chapterOfLesson = new Map(
  chapters.flatMap((chapter) =>
    chapter.lessons.map((item) => [item.id, chapter] as const)
  )
)

function readLessonId(): string | null {
  const match = location.hash.match(/^#\/lesson\/(.+)$/)
  if (!match?.[1]) return null
  let id = match[1]
  try {
    id = decodeURIComponent(id)
  } catch {
    // 保持原样
  }
  return lessonById.has(id) ? id : null
}

export function App() {
  const [lessonId, setLessonId] = useState<string | null>(() => readLessonId())
  const [done, setDone] = useState<Set<string>>(() => loadProgress())
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onHashChange = () => {
      setLessonId(readLessonId())
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const current = lessonId ? lessonById.get(lessonId) : undefined
    document.title = current
      ? `${current.number} ${current.title} · AI Agent 全栈`
      : 'AI Agent 全栈工程师养成计划'
  }, [lessonId])

  const current = lessonId ? lessonById.get(lessonId) : undefined
  const chapter = lessonId ? chapterOfLesson.get(lessonId) : undefined
  const blocks =
    chapter && current ? contents[chapter.id]?.[current.id] : undefined

  const lessonIndex = useMemo(
    () => allLessons.findIndex((item) => item.id === lessonId),
    [lessonId]
  )
  const prev = lessonIndex > 0 ? allLessons[lessonIndex - 1] : undefined
  const next =
    lessonIndex >= 0 && lessonIndex < allLessons.length - 1
      ? allLessons[lessonIndex + 1]
      : undefined

  const navigate = (id: string) => {
    if (!lessonById.has(id)) return
    location.hash = `#/lesson/${id}`
    setLessonId(id)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const goHome = () => {
    history.replaceState(null, '', location.pathname + location.search)
    setLessonId(null)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const toggleDone = () => {
    if (!current) return
    setDone((value) => {
      const nextSet = new Set(value)
      if (nextSet.has(current.id)) {
        nextSet.delete(current.id)
      } else {
        nextSet.add(current.id)
      }
      saveProgress(nextSet)
      return nextSet
    })
  }

  return (
    <div className="app">
      <Sidebar
        chapters={chapters}
        currentId={lessonId}
        done={done}
        open={menuOpen}
        onNavigate={navigate}
        onHome={goHome}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="打开课程目录">
            <span />
            <span />
            <span />
          </button>
          <span className="topbar-kicker">工程实战版</span>
          <span className="topbar-title">
            {current ? `${current.number} ${current.title}` : '课程地图'}
          </span>
          <span className="topbar-progress">
            {liveLessons.length} 篇已上线 · {done.size}/{allLessons.length}{' '}
            已完成
          </span>
        </header>

        <main className="content">
          {current && chapter ? (
            <LessonView
              lesson={current}
              chapter={chapter}
              blocks={blocks}
              done={done.has(current.id)}
              prev={prev}
              next={next}
              onHome={goHome}
              onNavigate={navigate}
              onToggleDone={toggleDone}
            />
          ) : (
            <Home chapters={chapters} done={done} onOpen={navigate} />
          )}

          <footer className="site-foot">
            <span>kb-vault · AI Agent 全栈工程师养成计划</span>
            <span>
              {liveLessons.length} / {allLessons.length} 篇已上线 ·
              每章只加一个变量
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
