import {
  ChevronLeft,
  ChevronRight,
  Library as LibraryIcon,
  Moon,
  Sun
} from 'lucide-react'
import { Blocks, Inlines } from './block-renderer.tsx'
import { neighbors } from './data.ts'
import { Practice } from './practice.tsx'
import type { LessonProgress, ProgressStore } from './progress.ts'
import type { Lesson } from './schema/lesson.ts'

export function LessonView(props: {
  lesson: Lesson
  progress: LessonProgress
  store: ProgressStore
  onProgressChanged: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onGoto: (key: string) => void
  onHome: () => void
}) {
  const {
    lesson,
    progress,
    store,
    onProgressChanged,
    theme,
    onToggleTheme,
    onGoto,
    onHome
  } = props
  const { prev, next } = neighbors(lesson)
  const goto = (key: string | undefined) => {
    if (key !== undefined) onGoto(key)
  }
  return (
    <main className="shell">
      <header className="topbar">
        <button className="btn icon" onClick={onHome} aria-label="返回目录">
          <LibraryIcon size={18} />
        </button>
        <span className="subtitle">
          {lesson.board} · {lesson.number}
        </span>
        <span className="spacer" />
        <button
          className="btn icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '切换到白绿主题' : '切换到黑绿主题'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <article>
        <div className="lesson-head">
          <div className="lh-num">{lesson.number}</div>
          <h1>{lesson.title}</h1>
          <p className="goal">{lesson.goal}</p>
        </div>

        <section className="section">
          <h2>01 · 为什么需要这个概念</h2>
          <Blocks blocks={lesson.sections.why} ctx={lesson} onGoto={onGoto} />
        </section>

        <section className="section">
          <h2>02 · 核心概念与规则</h2>
          <Blocks
            blocks={lesson.sections.concepts}
            ctx={lesson}
            onGoto={onGoto}
          />
        </section>

        <section className="section">
          <h2>03 · 例句精讲</h2>
          <Blocks
            blocks={lesson.sections.examples}
            ctx={lesson}
            onGoto={onGoto}
          />
        </section>

        <section className="section">
          <h2>04 · 常见坑</h2>
          <Blocks
            blocks={lesson.sections.pitfalls}
            ctx={lesson}
            onGoto={onGoto}
          />
        </section>

        <section className="section">
          <h2>05 · 一句话总结</h2>
          <blockquote className="quote">
            <Inlines
              text={lesson.sections.summary}
              ctx={lesson}
              onGoto={onGoto}
            />
          </blockquote>
        </section>

        <section className="section">
          <h2>06 · 随堂练习</h2>
          {progress.stale && (
            <div className="pitfall">⚠️ 本讲内容已更新，进度已重置。</div>
          )}
          <Practice
            lesson={lesson}
            progress={progress}
            store={store}
            onChanged={onProgressChanged}
          />
        </section>
      </article>

      <nav className="pager">
        <button
          className="btn"
          disabled={prev === undefined}
          onClick={() => goto(prev?.key)}>
          <ChevronLeft size={16} />
          {prev === undefined ? '已是第一讲' : `上一讲 · ${prev.number}`}
        </button>
        <button
          className="btn"
          disabled={next === undefined}
          onClick={() => goto(next?.key)}>
          {next === undefined ? '已是最后一讲' : `下一讲 · ${next.number}`}
          <ChevronRight size={16} />
        </button>
      </nav>
    </main>
  )
}
