import { useState } from 'react'
import { lesson } from './data.ts'
import { DictationDrill } from './components/DictationDrill.tsx'
import { PracticeGrader } from './components/PracticeGrader.tsx'
import { ReadingPlayer } from './components/ReadingPlayer.tsx'
import { SpellingDrill } from './components/SpellingDrill.tsx'

const TABS = ['课文', '拼写', '听写', '练习'] as const
type Tab = (typeof TABS)[number]

export function App() {
  const [tab, setTab] = useState<Tab>('课文')

  return (
    <>
      <h1>英语练习平台</h1>
      <p className="subtitle">
        {lesson.title} ｜ 第一册 · 语法重建 — 听 → 拼 → 写 → 测
      </p>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      {tab === '课文' && <ReadingPlayer lesson={lesson} />}
      {tab === '拼写' && <SpellingDrill lesson={lesson} />}
      {tab === '听写' && <DictationDrill lesson={lesson} />}
      {tab === '练习' && <PracticeGrader lesson={lesson} />}
    </>
  )
}
