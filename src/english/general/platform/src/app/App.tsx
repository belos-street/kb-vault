import { useState } from 'react'
import { ListTree } from 'lucide-react'
import { lessonEntries, type LessonEntry } from './data.ts'
import { progressStore } from './progress.ts'
import { CourseNav } from './components/CourseNav.tsx'
import { PracticeGrader } from './components/PracticeGrader.tsx'
import { ReadingPlayer } from './components/ReadingPlayer.tsx'
import { SpellingDrill } from './components/SpellingDrill.tsx'

const TABS = ['课文', '拼写', '练习'] as const
type Tab = (typeof TABS)[number]

function initialEntry(): LessonEntry {
  const saved = progressStore.getSelectedId()
  const found = lessonEntries.find((e) => e.id === saved)
  if (found) return found
  const first = lessonEntries[0]
  if (first) return first
  return {
    book: '',
    unit: '',
    id: '',
    title: '无课程数据',
    lesson: {
      id: '',
      unit: '',
      book: '',
      title: '',
      reading: { title: '', sentences: [], translation: '', keyPoints: [] },
      vocab: { core: [], wordGroups: [] },
      practice: []
    }
  }
}

export function App() {
  const [entry, setEntry] = useState<LessonEntry>(initialEntry)
  const [tab, setTab] = useState<Tab>('课文')
  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <div className="nav-head">
        <h1>英语练习平台</h1>
        {lessonEntries.length > 0 && (
          <button className="btn" onClick={() => setNavOpen(!navOpen)}>
            <ListTree size={15} /> 切换课程
          </button>
        )}
      </div>
      <p className="subtitle">{entry.lesson.title} ｜ 听 → 拼写 → 练习</p>
      {navOpen && (
        <CourseNav
          current={entry}
          onSelect={(l) => {
            setEntry(l)
            progressStore.setSelectedId(l.id)
          }}
          onClose={() => setNavOpen(false)}
        />
      )}
      <nav className="tabs">
        {TABS.map((t, i) => (
          <button
            key={t}
            data-num={String(i + 1).padStart(2, '0')}
            className={`tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      {/* key = 讲 id：切换课程时重置各模块状态 */}
      {tab === '课文' && <ReadingPlayer key={entry.id} lesson={entry.lesson} />}
      {tab === '拼写' && <SpellingDrill key={entry.id} lesson={entry.lesson} />}
      {tab === '练习' && (
        <PracticeGrader key={entry.id} lesson={entry.lesson} />
      )}
    </>
  )
}
