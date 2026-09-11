import { useState } from 'react'
import { ArrowLeft, ArrowRight, Library as LibraryIcon } from 'lucide-react'
import { lessonEntries, type LessonEntry } from './data.ts'
import { progressStore } from './progress.ts'
import { Library } from './components/library.tsx'
import { PracticeGrader } from './components/practice-grader.tsx'
import { ReadingPlayer } from './components/reading-player.tsx'
import { SpellingDrill } from './components/spelling-drill.tsx'

const TAB_ITEMS = ['课文', '拼写', '练习'] as const
type Tab = (typeof TAB_ITEMS)[number]

/**
 * F5 导航（方案 D）：entry 为 null 显示目录首页（Library）；
 * 学习页头部提供「上一讲 / 下一讲」快捷切换。
 */
export function App() {
  const [entry, setEntry] = useState<LessonEntry | null>(null)
  const [tab, setTab] = useState<Tab>('课文')

  const open = (l: LessonEntry) => {
    setEntry(l)
    progressStore.setSelectedId(l.id)
  }

  const idx = entry ? lessonEntries.findIndex((e) => e.id === entry.id) : -1
  const prev = idx > 0 ? lessonEntries[idx - 1] : undefined
  const next =
    idx >= 0 && idx + 1 < lessonEntries.length
      ? lessonEntries[idx + 1]
      : undefined

  return (
    <>
      <div className="nav-head">
        <h1>英语练习平台</h1>
        {entry && (
          <button className="btn" onClick={() => setEntry(null)}>
            <LibraryIcon size={15} /> 课程库
          </button>
        )}
      </div>
      {entry === null ? (
        <Library onOpen={open} />
      ) : (
        <>
          <div className="lesson-head">
            <button
              className="btn"
              onClick={() => prev && open(prev)}
              disabled={!prev}>
              <ArrowLeft size={15} /> 上一讲
            </button>
            <p className="lesson-title">{entry.lesson.title}</p>
            <button
              className="btn"
              onClick={() => next && open(next)}
              disabled={!next}>
              下一讲 <ArrowRight size={15} />
            </button>
          </div>
          <nav className="tabs">
            {TAB_ITEMS.map((t, i) => (
              <button
                key={t}
                data-num={String(i + 1).padStart(2, '0')}
                className={`tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </nav>
          {/* key = 讲 id：切换讲时重置各模块状态 */}
          {tab === '课文' && (
            <ReadingPlayer key={entry.id} lesson={entry.lesson} />
          )}
          {tab === '拼写' && (
            <SpellingDrill key={entry.id} lesson={entry.lesson} />
          )}
          {tab === '练习' && (
            <PracticeGrader key={entry.id} lesson={entry.lesson} />
          )}
        </>
      )}
    </>
  )
}
