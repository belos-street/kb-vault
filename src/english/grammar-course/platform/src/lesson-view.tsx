import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, List, Moon, Sun } from 'lucide-react'
import { lessonTitles, neighbors } from './catalog.ts'
import { loadLesson } from './data.ts'
import { DeepDive } from './deepdive.tsx'
import { Notes } from './notes.tsx'
import { Practice } from './practice.tsx'
import { Quiz, Summary } from './quiz.tsx'
import { Reading } from './reading.tsx'
import { useSpeech } from './use-speech.ts'
import { Vocab } from './vocab.tsx'
import type { Lesson } from './schema/lesson.ts'
import type { LessonProgress, ProgressStore } from './progress.ts'
import type { ThemeChoice } from './theme.ts'

// 讲义页（T8–T11 逐节接入：①目标 ②课文 ③词汇 ④精讲 ⑤练习 ⑥小测 ⑦深读）
// bundle 分包（T19）：课目按单元懒加载，外层壳管加载态，内层按课重挂载。

export function LessonView(props: {
  lessonId: string
  onOpen: (key: string) => void
  onHome: () => void
  theme: ThemeChoice
  onToggleTheme: () => void
  store: ProgressStore
}) {
  const { lessonId, theme, onToggleTheme, onHome } = props
  const [lesson, setLesson] = useState<Lesson | undefined>(undefined)

  useEffect(() => {
    let alive = true
    setLesson(undefined)
    const load = async () => {
      const l = await loadLesson(lessonId)
      if (alive) setLesson(l)
    }
    void load()
    return () => {
      alive = false
    }
  }, [lessonId])

  if (lesson === undefined) {
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
        <p className="stale-hint">加载中…</p>
      </main>
    )
  }

  return <LessonBody key={lesson.id} lesson={lesson} {...props} />
}

function LessonBody(props: {
  lesson: Lesson
  lessonId: string
  onOpen: (key: string) => void
  onHome: () => void
  theme: ThemeChoice
  onToggleTheme: () => void
  store: ProgressStore
}) {
  const { lesson, lessonId, onOpen, onHome, theme, onToggleTheme, store } =
    props
  const speech = useSpeech()
  const [progress, setProgress] = useState<LessonProgress>(() =>
    store.getLesson(lessonId, lesson.dataVersion)
  )

  useEffect(() => {
    store.setLastKey(lessonId)
  }, [lessonId, store])

  // 切课即停朗读，避免旧课声音跟着翻页
  useEffect(() => {
    speech.stop()
  }, [lessonId, speech.stop])

  const refresh = useCallback(() => {
    setProgress(store.getLesson(lessonId, lesson.dataVersion))
  }, [lessonId, lesson.dataVersion, store])

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

      <Reading lesson={lesson} speech={speech} />
      <Vocab lesson={lesson} speech={speech} />
      <Notes lesson={lesson} />
      <DeepDive lesson={lesson} />
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

      <nav className="pager">
        {prev !== undefined ? (
          <button className="btn" onClick={() => onOpen(prev)}>
            <ChevronLeft size={16} />
            {lessonTitles.get(prev) ?? prev}
          </button>
        ) : (
          <span />
        )}
        {next !== undefined ? (
          <button className="btn" onClick={() => onOpen(next)}>
            {lessonTitles.get(next) ?? next}
            <ChevronRight size={16} />
          </button>
        ) : (
          <span />
        )}
      </nav>
    </main>
  )
}
