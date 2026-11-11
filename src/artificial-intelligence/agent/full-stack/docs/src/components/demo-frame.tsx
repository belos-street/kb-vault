import type { ReactNode } from 'react'

export function DemoFrame({
  title,
  hint,
  children
}: {
  title: string
  hint: string
  children: ReactNode
}) {
  return (
    <section className="demo-card">
      <header className="demo-head">
        <span className="demo-tag">交互实验</span>
        <div>
          <strong>{title}</strong>
          <p>{hint}</p>
        </div>
      </header>
      <div className="demo-body">{children}</div>
    </section>
  )
}
