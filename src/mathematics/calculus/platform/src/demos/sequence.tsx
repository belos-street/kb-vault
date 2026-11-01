import { useState } from 'react'
import { Coordinates, Line, Mafs, Point, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { DemoFrame } from './frame.tsx'

const TERMS = Array.from({ length: 30 }, (_, index) => index + 1)

export function SequenceDemo() {
  const [epsilon, setEpsilon] = useState(0.1)
  const n = Math.floor(1 / epsilon)

  return (
    <DemoFrame
      title="收敛数列与 ε-N"
      hint="绿色带是 $|a_n-A|<\varepsilon$ 的容差范围。拖动 ε，观察需要从第几项开始全部落入带内。"
      controls={
        <label className="slider slider-inline">
          <span>
            ε<em>{epsilon.toFixed(2)}</em>
          </span>
          <input
            type="range"
            min={0.02}
            max={0.4}
            step={0.01}
            value={epsilon}
            onChange={(event) => setEpsilon(Number(event.target.value))}
          />
        </label>
      }>
      <div className="demo-stack">
        <div className="demo-readout">
          <MathText
            text={`$a_n=1+\\frac1n$，取 $\\varepsilon=${epsilon.toFixed(2)}$，则 $N=${n}$；当 $n>N$ 时所有点落入带内。`}
          />
        </div>
        <Mafs
          width="auto"
          height={300}
          viewBox={{ x: [-1.5, 30], y: [-0.2, 2.2] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Line.Segment
            point1={[0, 1]}
            point2={[30, 1]}
            color={Theme.foreground}
            style="dashed"
            opacity={0.5}
          />
          <Line.Segment
            point1={[0, 1 - epsilon]}
            point2={[30, 1 - epsilon]}
            color={Theme.green}
            style="dashed"
            opacity={0.7}
          />
          <Line.Segment
            point1={[0, 1 + epsilon]}
            point2={[30, 1 + epsilon]}
            color={Theme.green}
            style="dashed"
            opacity={0.7}
          />
          {TERMS.map((term) => {
            const inside = Math.abs(1 / term) < epsilon
            return (
              <Point
                key={term}
                x={term}
                y={1 + 1 / term}
                color={inside ? Theme.green : Theme.blue}
                opacity={inside ? 1 : 0.55}
              />
            )
          })}
        </Mafs>
      </div>
    </DemoFrame>
  )
}
