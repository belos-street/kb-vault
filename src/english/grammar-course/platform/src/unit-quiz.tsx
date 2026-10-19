import { useEffect, useState } from 'react'
import { List, Moon, Sun } from 'lucide-react'
import { units } from './catalog.ts'
import { loadUnit } from './data.ts'
import { QuizCard } from './quiz.tsx'
import type { Lesson, QuizItem } from './schema/lesson.ts'
import type { ThemeChoice } from './theme.ts'

// 单元自测（组卷）：已上线课每课小测抽 1 题（优先非复习题），按课序最多 8 题。
// 当场判分只存组件 state，不进 ProgressStore——重进重做，不计学习进度。

const MAX_ITEMS = 8

interface PaperItem {
  /** `U03L17:Q1`——跨课组卷各课题号撞车，用课号+题号做本地 key */
  key: string
  lessonId: string
  item: QuizItem
}

/** 复习题 = 括注（…）含「复习」，或题干以「复习 UxxLnn」开头（数据两种标注形态） */
function isReview(item: QuizItem): boolean {
  const notes = item.stem.match(/（[^）]*）/g) ?? []
  return (
    notes.some((n) => n.includes('复习')) ||
    /^复习 U\d{2}L\d{2}/.test(item.stem)
  )
}

function buildPaper(unitId: string, lessons: Lesson[]): PaperItem[] {
  const unit = units.find((u) => u.id === unitId)
  if (unit === undefined) return []
  const loaded = new Map(lessons.map((l) => [l.id, l]))
  const paper: PaperItem[] = []
  for (const l of unit.lessons) {
    if (paper.length >= MAX_ITEMS) break
    if (!l.live) continue
    const lesson = loaded.get(l.id)
    if (lesson === undefined) continue
    const item = lesson.quiz.find((q) => !isReview(q)) ?? lesson.quiz[0]
    if (item === undefined) continue
    paper.push({ key: `${l.id}:${item.id}`, lessonId: l.id, item })
  }
  return paper
}

export function UnitQuiz(props: {
  unitId: string
  onHome: () => void
  theme: ThemeChoice
  onToggleTheme: () => void
}) {
  const { unitId, onHome, theme, onToggleTheme } = props
  const [verdicts, setVerdicts] = useState<Record<string, { ok: boolean }>>({})
  const [paper, setPaper] = useState<PaperItem[] | null>(null)

  useEffect(() => {
    let alive = true
    setPaper(null)
    const load = async () => {
      const lessons = await loadUnit(unitId)
      if (alive) setPaper(buildPaper(unitId, lessons))
    }
    void load()
    return () => {
      alive = false
    }
  }, [unitId])

  const correct = (paper ?? []).filter(
    (p) => verdicts[p.key]?.ok === true
  ).length
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

      <section className="lesson-head">
        <h1>
          {unitId} 单元自测 · {paper === null ? '…' : paper.length} 题
        </h1>
        <p className="goal">从小测抽题组卷，做完当场判分——不计进度，可重做。</p>
      </section>

      {paper === null ? (
        <p className="stale-hint">正在组卷…</p>
      ) : paper.length === 0 ? (
        <p className="stale-hint">该单元暂无已上线课，暂无法组卷。</p>
      ) : (
        <section className="section">
          <h2>自测题</h2>
          <div className="practice">
            {paper.map((p) => (
              <QuizCard
                key={p.key}
                item={p.item}
                label={`${p.lessonId}·${p.item.id}`}
                verdict={verdicts[p.key]}
                onVerdict={(_, ok) =>
                  setVerdicts((prev) => ({ ...prev, [p.key]: { ok } }))
                }
              />
            ))}
          </div>
        </section>
      )}

      <div className="summary">
        <h3>自测汇总</h3>
        <p className="sum-line">
          {paper === null ? 0 : paper.length} 题对 {correct} 题
        </p>
      </div>
    </main>
  )
}
