import { BookOpen, ChevronRight } from 'lucide-react'
import type { Lesson } from './schema/lesson.ts'

// ⑦ 深读跳转（F6）：每条 ref → VitePress 讲义静态页锚点链接（新标签打开）。
// 入口两处：精讲卡末尾（Notes 后）+ 小测汇总后（Summary 后），均经本组件渲染。
export function DeepDive(props: {
  lesson: Lesson
  where: 'notes' | 'summary'
}) {
  const { lesson, where } = props
  return (
    <section className={`deepdive ${where}`}>
      <h2>
        <BookOpen size={15} />
        深读跳转
      </h2>
      <ul className="dd-list">
        {lesson.deepDive.refs.map((r, i) => (
          <li key={i}>
            {r.url !== undefined ? (
              <a
                className="dd-item"
                href={r.url}
                target="_blank"
                rel="noreferrer">
                <span className="dd-ref">{r.ref}</span>
                <span className="dd-title">{r.title}</span>
                <ChevronRight size={15} className="dd-arrow" />
              </a>
            ) : (
              <span className="dd-item disabled">
                <span className="dd-ref">{r.ref}</span>
                <span className="dd-title">{r.title}</span>
              </span>
            )}
            <div className="dd-hint">{r.hint}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
