import { Moon, Sun } from 'lucide-react'
import { isLive, lessonMetaById, liveCount } from './data.ts'
import {
  totalLessons,
  units,
  type SyllabusLessonInfo,
  type SyllabusUnit
} from './catalog.ts'
import { lessonBadge, lessonStats, type ProgressStore } from './progress.ts'
import type { ThemeChoice } from './theme.ts'

// 课程导航（T7，requirements F1）：单元 → 课两级列表，68 课全景。
// 徽标四态：未上线（置灰不可点）/ 未开始 / x/y 题 / ✓ 全对。

export function Library(props: {
  onOpen: (key: string) => void
  onUnitQuiz: (unitId: string) => void
  lastKey: string | undefined
  theme: ThemeChoice
  onToggleTheme: () => void
  store: ProgressStore
}) {
  const { onOpen, onUnitQuiz, lastKey, theme, onToggleTheme, store } = props
  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">语法微课</span>
        <span className="subtitle">
          {liveCount}/{totalLessons} 课已上线
        </span>
        <span className="spacer" />
        {lastKey !== undefined && isLive(lastKey) && (
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
      {units.map((u) => (
        <UnitSection
          key={u.id}
          unit={u}
          onOpen={onOpen}
          onUnitQuiz={onUnitQuiz}
          store={store}
        />
      ))}
    </main>
  )
}

function UnitSection(props: {
  unit: SyllabusUnit
  onOpen: (key: string) => void
  onUnitQuiz: (unitId: string) => void
  store: ProgressStore
}) {
  const { unit, onOpen, onUnitQuiz, store } = props
  return (
    <section className="board">
      <h2 className="board-title">
        {unit.id} · {unit.title}
      </h2>
      <p className="board-goal">{unit.goal}</p>
      {unit.lessons.map((l) =>
        l.live ? (
          <LiveRow key={l.id} lesson={l} onOpen={onOpen} store={store} />
        ) : (
          <OffRow key={l.id} lesson={l} />
        )
      )}
      <p className="board-foot">
        本单元 {unit.liveCount}/{unit.lessons.length} 课已上线{' '}
        {unit.liveCount > 0 && (
          <button className="btn" onClick={() => onUnitQuiz(unit.id)}>
            单元自测
          </button>
        )}
      </p>
    </section>
  )
}

function badgeOf(
  lesson: SyllabusLessonInfo,
  store: ProgressStore
): { text: string; cls: string } {
  // 仅 LiveRow 调用（OffRow 已写死「未上线」），瘦清单必命中
  const meta = lessonMetaById.get(lesson.id)
  if (meta === undefined) return { text: '未开始', cls: '' }
  const progress = store.getLesson(lesson.id, meta.dataVersion)
  return lessonBadge(lessonStats(meta.questions, progress.verdicts))
}

function LiveRow(props: {
  lesson: SyllabusLessonInfo
  onOpen: (key: string) => void
  store: ProgressStore
}) {
  const { lesson, onOpen, store } = props
  const badge = badgeOf(lesson, store)
  return (
    <a
      className="lesson-item"
      href={`#/lesson/${lesson.id}`}
      onClick={(e) => {
        e.preventDefault()
        onOpen(lesson.id)
      }}>
      <div className="li-head">
        <span className="li-num">{lesson.id}</span>
        <span className="li-title">{lesson.title}</span>
        <span className={`badge ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="li-goal">{lesson.outcome}</div>
    </a>
  )
}

function OffRow(props: { lesson: SyllabusLessonInfo }) {
  const { lesson } = props
  return (
    <div className="lesson-item off" aria-disabled="true">
      <div className="li-head">
        <span className="li-num">{lesson.id}</span>
        <span className="li-title">{lesson.title}</span>
        <span className="badge off">未上线</span>
      </div>
      <div className="li-goal">{lesson.outcome}</div>
    </div>
  )
}
