import type { ReactNode } from 'react'
import { MathText } from '../components/math.tsx'

export function DemoFrame({
  title,
  hint,
  controls,
  children
}: {
  title: string
  hint?: string
  controls?: ReactNode
  children: ReactNode
}) {
  return (
    <figure className="demo">
      <div className="demo-head">
        <div>
          <div className="demo-title">
            <MathText text={title} />
          </div>
          {hint ? (
            <div className="demo-hint">
              <MathText text={hint} />
            </div>
          ) : null}
        </div>
        {controls ? <div className="demo-controls">{controls}</div> : null}
      </div>
      <div className="demo-canvas">{children}</div>
    </figure>
  )
}
