import { Moon, Sun } from 'lucide-react'
import { boards } from './data.ts'
import { lessonBadge, lessonStats, type ProgressStore } from './progress.ts'
import type { Lesson } from './schema/lesson.ts'

export function Library(props: {
  onOpen: (key: string) => void
  lastKey?: string | undefined
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  store: ProgressStore
}) {
  const { onOpen, lastKey, theme, onToggleTheme, store } = props
  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">语法学习平台</span>
        <span className="spacer" />
        {lastKey !== undefined && (
          <button className="btn primary" onClick={() => onOpen(lastKey)}>
            继续学习
          </button>
        )}
        <button
          className="btn icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '切换到白绿主题' : '切换到黑绿主题'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      {boards.map(({ board, lessons: ls }) => (
        <section className="board" key={board}>
          <h2 className="board-title">{board}</h2>
          {ls.map((l) => (
            <LessonRow
              key={l.key}
              lesson={l}
              onOpen={onOpen}
              badge={lessonBadge(
                lessonStats(l, store.getLesson(l.key, l.dataVersion).verdicts)
              )}
            />
          ))}
        </section>
      ))}
    </main>
  )
}

function LessonRow(props: {
  lesson: Lesson
  onOpen: (key: string) => void
  badge: { text: string; cls: string }
}) {
  const { lesson, onOpen, badge } = props
  return (
    <a
      className="lesson-item"
      href={`#/lesson/${lesson.key}`}
      onClick={(e) => {
        e.preventDefault()
        onOpen(lesson.key)
      }}>
      <div className="li-head">
        <span className="li-num">{lesson.number}</span>
        <span className="li-title">{lesson.title}</span>
        <span className={`badge ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="li-goal">{lesson.goal}</div>
    </a>
  )
}
