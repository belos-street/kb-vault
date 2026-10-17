import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, List, Moon, Sun } from 'lucide-react'
import { neighbors } from './catalog.ts'
import { byKey } from './data.ts'
import { DeepDive } from './deepdive.tsx'
import { Notes } from './notes.tsx'
import { Practice } from './practice.tsx'
import { Quiz, Summary } from './quiz.tsx'
import { Reading } from './reading.tsx'
import { Vocab } from './vocab.tsx'
import type { LessonProgress, ProgressStore } from './progress.ts'
import type { ThemeChoice } from './theme.ts'

// 讲义页（T8–T11 逐节接入：①目标 ②课文 ③词汇 ④精讲 ⑤练习 ⑥小测 ⑦深读）
export function LessonView(props: {
  lessonId: string
  onOpen: (key: string) => void
  onHome: () => void
  theme: ThemeChoice
  onToggleTheme: () => void
  store: ProgressStore
}) {
  const { lessonId, onOpen, onHome, theme, onToggleTheme, store } = props
  const lesson = byKey.get(lessonId)
  const [progress, setProgress] = useState<LessonProgress>(() =>
    lesson !== undefined
      ? store.getLesson(lessonId, lesson.dataVersion)
      : { verdicts: {}, stale: false }
  )

  useEffect(() => {
    store.setLastKey(lessonId)
  }, [lessonId, store])

  const refresh = useCallback(() => {
    const l = byKey.get(lessonId)
    if (l === undefined) return
    setProgress(store.getLesson(lessonId, l.dataVersion))
  }, [lessonId, store])

  if (lesson === undefined) return null

  const { prev, next } = neighbors(lessonId)
  return (
    <main className="shell">
      <header className="topbar">
        <button className="btn icon" onClick={onHome} aria-label="返回目录">
          <List size={18} />
        </button>
        <span className="brand">语法微课</span>
        <span className="spacer" />
        <button
          className="btn icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '切换到白绿主题' : '切换到黑绿主题'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {progress.stale && (
        <p className="stale-hint">本讲内容已更新，此前的作答记录已清空。</p>
      )}

      <section className="lesson-head">
        <div className="lh-num">{lesson.id}</div>
        <h1>{lesson.title}</h1>
        <p className="goal">{lesson.goal}</p>
      </section>

      <section className="section">
        <h2>本课目标</h2>
        <p className="para">{lesson.objective}</p>
      </section>

      <Reading lesson={lesson} />
      <Vocab lesson={lesson} />
      <Notes lesson={lesson} />
      <DeepDive lesson={lesson} where="notes" />
      <Practice
        lesson={lesson}
        progress={progress}
        store={store}
        onChanged={refresh}
      />
      <Quiz
        lesson={lesson}
        progress={progress}
        store={store}
        onChanged={refresh}
      />
      <Summary
        lesson={lesson}
        progress={progress}
        store={store}
        onChanged={refresh}
      />
      <DeepDive lesson={lesson} where="summary" />

      <nav className="pager">
        {prev !== undefined ? (
          <button className="btn" onClick={() => onOpen(prev)}>
            <ChevronLeft size={16} />
            {byKey.get(prev)?.title ?? prev}
          </button>
        ) : (
          <span />
        )}
        {next !== undefined ? (
          <button className="btn" onClick={() => onOpen(next)}>
            {byKey.get(next)?.title ?? next}
            <ChevronRight size={16} />
          </button>
        ) : (
          <span />
        )}
      </nav>
    </main>
  )
}
