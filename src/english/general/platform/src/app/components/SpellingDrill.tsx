import { useState } from 'react'
import type { Lesson } from '../../schema/lesson.ts'
import { DictationDrill } from './DictationDrill.tsx'
import { SentenceSpelling } from './SentenceSpelling.tsx'
import { WordSpelling } from './WordSpelling.tsx'

const MODES = ['单词拼写', '听写（音 → 形）', '默写（意 → 形）'] as const
type Mode = (typeof MODES)[number]

/** F2 拼写环节入口：单词拼写 / 听写（音→形）/ 句子默写（意→形）三个子模式 */
export function SpellingDrill({ lesson }: { lesson: Lesson }) {
  const [mode, setMode] = useState<Mode>('单词拼写')

  return (
    <>
      <nav className="subtabs">
        {MODES.map((m) => (
          <button
            key={m}
            className={`subtab${mode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </nav>
      {mode === '单词拼写' && <WordSpelling lesson={lesson} />}
      {mode === '听写（音 → 形）' && <DictationDrill lesson={lesson} />}
      {mode === '默写（意 → 形）' && <SentenceSpelling lesson={lesson} />}
    </>
  )
}
