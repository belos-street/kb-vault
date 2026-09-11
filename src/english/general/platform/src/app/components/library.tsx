import { ArrowRight, Check } from 'lucide-react'
import {
  bookLabel,
  buildCourseTree,
  lessonEntries,
  unitLabel,
  type LessonEntry
} from '../data.ts'
import { progressStore } from '../progress.ts'

function lessonStats(l: LessonEntry) {
  const total = l.lesson.practice.reduce((n, g) => n + g.questions.length, 0)
  const verdicts = progressStore.practiceVerdicts(l.id)
  const answered = Object.keys(verdicts).length
  const correct = Object.values(verdicts).filter((v) => v === 'correct').length
  const isAllCorrect = total > 0 && answered === total && correct === total
  return { total, answered, correct, isAllCorrect }
}

/** F5 目录首页（方案 D）：册 → 单元 → 讲 三级列表，每讲带练习进度；点击进入学习页 */
export function Library({ onOpen }: { onOpen: (entry: LessonEntry) => void }) {
  const lastId = progressStore.getSelectedId()
  const lastEntry = lessonEntries.find((e) => e.id === lastId)
  const tree = buildCourseTree(lessonEntries)

  return (
    <section className="card library">
      <h2>课程库</h2>
      {lastEntry && (
        <button className="btn continue-row" onClick={() => onOpen(lastEntry)}>
          继续学习：{lastEntry.id} · {lastEntry.title} <ArrowRight size={15} />
        </button>
      )}
      {tree.map((book) => (
        <div key={book.book} className="book-block">
          <h3>{bookLabel(book.book)}</h3>
          {book.units.map((u) => (
            <div key={u.unit} className="unit-block">
              <p className="hint">{unitLabel(u.unit)}</p>
              <ul className="plain lesson-list">
                {u.lessons.map((l) => {
                  const s = lessonStats(l)
                  return (
                    <li key={l.id}>
                      <button
                        className={`lesson-item${l.id === lastId ? ' current' : ''}`}
                        onClick={() => onOpen(l)}>
                        <span className="lesson-name">
                          {l.id} · {l.title}
                        </span>
                        <span
                          className={`lesson-meta${s.isAllCorrect ? ' done' : ''}`}>
                          {s.isAllCorrect ? (
                            <>
                              <Check size={14} /> 全对
                            </>
                          ) : s.answered > 0 ? (
                            `${s.correct}/${s.total} 题`
                          ) : (
                            '未开始'
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
