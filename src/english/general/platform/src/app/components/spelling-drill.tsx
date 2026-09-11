import { useState } from 'react'
import type { Lesson } from '../../schema/lesson.ts'
import { DictationDrill } from './dictation-drill.tsx'
import { SentenceSpelling } from './sentence-spelling.tsx'
import { WordSpelling } from './word-spelling.tsx'

const MODE_ITEMS = ['单词拼写', '默写（意 → 形）', '听写（音 → 形）'] as const
type Mode = (typeof MODE_ITEMS)[number]

/** F2 拼写环节入口：单词拼写 / 默写（意→形）/ 听写（音→形）三个子模式 */
export function SpellingDrill({ lesson }: { lesson: Lesson }) {
  const [mode, setMode] = useState<Mode>('单词拼写')

  return (
    <>
      <nav className="subtabs">
        {MODE_ITEMS.map((m) => (
          <button
            key={m}
            className={`subtab${mode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </nav>
      {mode === '单词拼写' && <WordSpelling lesson={lesson} />}
      {mode === '默写（意 → 形）' && <SentenceSpelling lesson={lesson} />}
      {mode === '听写（音 → 形）' && <DictationDrill lesson={lesson} />}
    </>
  )
}
