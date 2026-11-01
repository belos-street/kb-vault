import { useState } from 'react'
import { Circle, Coordinates, Line, Mafs, Plot, Text, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { limitHint, limitReadout } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

export function LimitDemo() {
  const [epsilon, setEpsilon] = useState(0.05)
  // sin x / x ≈ 1 - x²/6，因此 |f(x)-1| < ε 的一个保守邻域为 |x| < sqrt(6ε)
  const delta = Math.sqrt(6 * epsilon)

  return (
    <DemoFrame
      title="极限的 ε-δ 直观"
      hint={limitHint}
      controls={
        <label className="slider slider-inline">
          <span>
            ε<em>{epsilon.toFixed(3)}</em>
          </span>
          <input
            type="range"
            min={0.005}
            max={0.1}
            step={0.005}
            value={epsilon}
            onChange={(event) => setEpsilon(Number(event.target.value))}
          />
        </label>
      }>
      <div className="demo-stack">
        <div className="demo-readout">
          <MathText text={limitReadout(epsilon, delta)} />
        </div>
        <Mafs
          width="auto"
          height={320}
          viewBox={{ x: [-1.5, 1.5], y: [-0.2, 1.4] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Line.Segment
            point1={[-1.5, 1]}
            point2={[1.5, 1]}
            color={Theme.foreground}
            style="dashed"
            opacity={0.45}
          />
          <Line.Segment
            point1={[-1.5, 1 - epsilon]}
            point2={[1.5, 1 - epsilon]}
            color={Theme.green}
            style="dashed"
            opacity={0.7}
          />
          <Line.Segment
            point1={[-1.5, 1 + epsilon]}
            point2={[1.5, 1 + epsilon]}
            color={Theme.green}
            style="dashed"
            opacity={0.7}
          />
          <Line.Segment
            point1={[-delta, 1 - epsilon]}
            point2={[-delta, 1 + epsilon]}
            color={Theme.green}
          />
          <Line.Segment
            point1={[delta, 1 - epsilon]}
            point2={[delta, 1 + epsilon]}
            color={Theme.green}
          />
          <Plot.OfX
            y={(x) => Math.sin(x) / x}
            domain={[-1.5, -0.0001]}
            color={Theme.blue}
            weight={2.5}
          />
          <Plot.OfX
            y={(x) => Math.sin(x) / x}
            domain={[0.0001, 1.5]}
            color={Theme.blue}
            weight={2.5}
          />
          <Circle
            center={[0, 1]}
            radius={0.025}
            color={Theme.red}
            fillOpacity={0}
            weight={2.5}
          />
          <Text x={0.06} y={1.02} size={14} color={Theme.red}>
            (0, 1)
          </Text>
        </Mafs>
      </div>
    </DemoFrame>
  )
}
