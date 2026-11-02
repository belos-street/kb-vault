import { useState } from 'react'
import { Coordinates, Line, Mafs, Point, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { eLimitHint, eLimitReadout } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

const TERMS = Array.from({ length: 30 }, (_, index) => index + 1)

export function ELimitDemo() {
  const [n, setN] = useState(12)
  const value = (1 + 1 / n) ** n

  return (
    <DemoFrame
      title="第二个重要极限：$(1+1/n)^n \to e$"
      hint={eLimitHint}
      controls={
        <label className="slider slider-inline">
          <span>
            n<em>{n}</em>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={n}
            onChange={(event) => setN(Number(event.target.value))}
          />
        </label>
      }>
      <div className="demo-stack">
        <div className="demo-readout">
          <MathText text={eLimitReadout(n, value)} />
        </div>
        <Mafs
          width="auto"
          height={300}
          viewBox={{ x: [-1.5, 30], y: [1.8, 3.1] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Line.Segment
            point1={[-1.5, Math.E]}
            point2={[30, Math.E]}
            color={Theme.red}
            style="dashed"
            opacity={0.55}
          />
          {TERMS.map((term) => (
            <Point
              key={term}
              x={term}
              y={(1 + 1 / term) ** term}
              color={term === n ? Theme.red : Theme.blue}
              opacity={term === n ? 1 : 0.55}
            />
          ))}
        </Mafs>
        <div className="legend">
          <span>
            <i className="dot dot-blue" /> 数列点
          </span>
          <span>
            <i className="dot dot-red" /> 当前 n 与极限 e
          </span>
        </div>
      </div>
    </DemoFrame>
  )
}
