import { useEffect, useMemo, useState } from 'react'
import { Home } from './components/home.tsx'
import { LessonView } from './components/lesson-view.tsx'
import { Sidebar } from './components/sidebar.tsx'
import { contents } from './content/index.ts'
import {
  allLessons,
  chapterById,
  chapters,
  lessonById,
  multivariableLessonCount,
  upperLessonCount,
  videoLessonCount
} from './data/syllabus.ts'
import { loadProgress, saveProgress } from './lib/progress.ts'

const chapterOfLesson = new Map(
  chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => [lesson.id, chapter] as const)
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
    const lesson = lessonId ? lessonById.get(lessonId) : undefined
    document.title = lesson
      ? `${lesson.number} ${lesson.title} · 高等数学`
      : '高等数学 · 数二学习台'
  }, [lessonId])

  const lesson = lessonId ? lessonById.get(lessonId) : undefined
  const chapter = lessonId ? chapterOfLesson.get(lessonId) : undefined
  const blocks =
    chapter && lesson ? contents[chapter.id]?.[lesson.id] : undefined

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
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const goHome = () => {
    history.replaceState(null, '', location.pathname + location.search)
    setLessonId(null)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const toggleDone = () => {
    if (!lesson) return
    setDone((current) => {
      const nextSet = new Set(current)
      if (nextSet.has(lesson.id)) {
        nextSet.delete(lesson.id)
      } else {
        nextSet.add(lesson.id)
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
          <span className="topbar-title">
            {lesson ? `${lesson.number} ${lesson.title}` : '课程地图'}
          </span>
          <span className="topbar-progress">
            {done.size} / {allLessons.length} 讲
          </span>
        </header>

        <main className="content">
          {lesson && chapter ? (
            <LessonView
              lesson={lesson}
              chapter={chapter}
              blocks={blocks}
              done={done.has(lesson.id)}
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
            <span>kb-vault · 高等数学学习台</span>
            <span>
              大纲依据：框框老师 {videoLessonCount} 讲 + 第六章补充 1 讲 + 多元{' '}
              {multivariableLessonCount} 讲（上册共 {upperLessonCount} 讲） ·{' '}
              {chapterById.size} 章 {allLessons.length} 讲
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
