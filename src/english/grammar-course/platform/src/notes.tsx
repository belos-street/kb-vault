import { Inlines } from './inlines.tsx'
import type { Lesson } from './schema/lesson.ts'

// ④ 语法点精讲（F4）：薄讲卡——规则 + 2~3 例句（含 ✅/❌ 对照）。
// 置于练习三段之前（动线：词汇 → 精讲 → 练习）。
export function Notes(props: { lesson: Lesson }) {
  const { lesson } = props
  return (
    <section className="section">
      <h2>语法点精讲</h2>
      {lesson.notes.map((n, i) => (
        <div className="note-card" key={i}>
          <p className="para note-rule">
            <Inlines text={n.rule} />
          </p>
          <ul className="rlist">
            {n.examples.map((ex, j) => (
              <li key={j}>
                <span
                  className={`ex-mark ${
                    ex.trim().startsWith('❌') ? 'bad' : 'good'
                  }`}>
                  <Inlines text={ex} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
