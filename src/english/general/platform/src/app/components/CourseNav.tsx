import { Check } from 'lucide-react'
import {
  bookLabel,
  buildCourseTree,
  lessonEntries,
  unitLabel,
  type LessonEntry
} from '../data.ts'
import { progressStore } from '../progress.ts'

/** F5 课程导航：册 → 单元 → 讲 三级树；✓ 标记练习判分全对的讲 */
export function CourseNav({
  current,
  onSelect,
  onClose
}: {
  current: LessonEntry
  onSelect: (entry: LessonEntry) => void
  onClose: () => void
}) {
  const tree = buildCourseTree(lessonEntries)

  return (
    <section className="card">
      <div className="nav-head">
        <h2>选择课程</h2>
        <button className="btn" onClick={onClose}>
          收起
        </button>
      </div>
      {tree.map((book) => (
        <div key={book.book} className="book-block">
          <h3>{bookLabel(book.book)}</h3>
          {book.units.map((u) => (
            <div key={u.unit} style={{ marginBottom: 12 }}>
              <p className="hint">{unitLabel(u.unit)}</p>
              <ul className="plain lesson-list">
                {u.lessons.map((l) => {
                  const verdicts = Object.values(
                    progressStore.practiceVerdicts(l.id)
                  )
                  const done =
                    verdicts.length > 0 &&
                    verdicts.every((v) => v === 'correct')
                  return (
                    <li key={l.id}>
                      <button
                        className={`lesson-item${current.id === l.id ? ' current' : ''}`}
                        onClick={() => {
                          onSelect(l)
                          onClose()
                        }}>
                        {done && <Check size={14} />}
                        <span>
                          {l.id} · {l.title}
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
