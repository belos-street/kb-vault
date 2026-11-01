import { useState } from 'react'
import { Coordinates, Line, Mafs, Plot, Point, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { ivtHint, ivtReadout } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

const f = (x: number) => x * x * x - 3 * x + 1

/** 在 [0,1] 上用二分法求 f(x)=c 的根 */
function solve(c: number): number {
  let low = 0
  let high = 1
  for (let index = 0; index < 40; index += 1) {
    const mid = (low + high) / 2
    if (f(mid) > c) {
      low = mid
    } else {
      high = mid
    }
  }
  return (low + high) / 2
}

export function IvtDemo() {
  const [c, setC] = useState(0)
  const root = solve(c)

  return (
    <DemoFrame
      title="介值定理"
      hint={ivtHint}
      controls={
        <label className="slider slider-inline">
          <span>
            C<em>{c.toFixed(2)}</em>
          </span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={c}
            onChange={(event) => setC(Number(event.target.value))}
          />
        </label>
      }>
      <div className="demo-stack">
        <div className="demo-readout">
          <MathText text={ivtReadout(c, root)} />
        </div>
        <Mafs
          width="auto"
          height={320}
          viewBox={{ x: [-0.2, 1.2], y: [-1.2, 1.2] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={f} domain={[0, 1]} color={Theme.blue} weight={2.5} />
          <Line.Segment
            point1={[0, c]}
            point2={[1, c]}
            color={Theme.green}
            style="dashed"
            weight={1.5}
          />
          <Line.Segment
            point1={[0, 0]}
            point2={[1, 0]}
            color={Theme.foreground}
            opacity={0.25}
          />
          <Line.Segment
            point1={[root, 0]}
            point2={[root, c]}
            color={Theme.red}
            style="dashed"
            opacity={0.6}
          />
          <Point x={0} y={1} color={Theme.blue} />
          <Point x={1} y={-1} color={Theme.blue} />
          <Point x={root} y={c} color={Theme.red} />
        </Mafs>
      </div>
    </DemoFrame>
  )
}
