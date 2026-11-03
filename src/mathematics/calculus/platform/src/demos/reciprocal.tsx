import { useState } from 'react'
import { Coordinates, Line, Mafs, Plot, Point, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { reciprocalHint, reciprocalReadout } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

export function ReciprocalDemo() {
  const [x, setX] = useState(2)

  return (
    <DemoFrame
      title="无穷小与无穷大的倒数关系"
      hint={reciprocalHint}
      controls={
        <label className="slider slider-inline">
          <span>
            x<em>{x.toFixed(2)}</em>
          </span>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.05}
            value={x}
            onChange={(event) => setX(Number(event.target.value))}
          />
        </label>
      }>
      <div className="demo-stack">
        <div className="demo-readout">
          <MathText text={reciprocalReadout(x)} />
        </div>
        <Mafs
          width="auto"
          height={340}
          viewBox={{ x: [-4, 4], y: [-4, 4] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={(value) => value} color={Theme.green} style="dashed" />
          <Plot.OfX
            y={(value) => 1 / value}
            domain={[-4, -0.02]}
            color={Theme.blue}
            weight={2.5}
          />
          <Plot.OfX
            y={(value) => 1 / value}
            domain={[0.02, 4]}
            color={Theme.blue}
            weight={2.5}
          />
          <Line.Segment
            point1={[x, 0]}
            point2={[x, 1 / x]}
            color={Theme.red}
            style="dashed"
            opacity={0.6}
          />
          <Point x={x} y={1 / x} color={Theme.red} />
        </Mafs>
        <div className="legend">
          <span>
            <i className="dot dot-blue" /> <MathText text="$y=1/x$" />
          </span>
          <span>
            <i className="dot dot-green" /> <MathText text="$y=x$" />
          </span>
        </div>
      </div>
    </DemoFrame>
  )
}
