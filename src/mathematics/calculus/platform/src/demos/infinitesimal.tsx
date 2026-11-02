import { useState } from 'react'
import { Coordinates, Mafs, Plot, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import {
  infinitesimalHint,
  infinitesimalLegend,
  infinitesimalPowerReadout
} from './formulas.ts'
import { DemoFrame } from './frame.tsx'

export function InfinitesimalDemo() {
  const [power, setPower] = useState(2)

  return (
    <DemoFrame
      title="三个无穷小的趋零速度"
      hint={infinitesimalHint}
      controls={
        <label className="slider slider-inline">
          <span>
            p<em>{power}</em>
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={1}
            value={power}
            onChange={(event) => setPower(Number(event.target.value))}
          />
        </label>
      }>
      <div className="demo-stack">
        <Mafs
          width="auto"
          height={320}
          viewBox={{ x: [-0.8, 0.8], y: [-0.1, 0.7] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={(x) => x} color={Theme.blue} weight={2.5} />
          <Plot.OfX y={(x) => Math.sin(x)} color={Theme.green} weight={2.5} />
          <Plot.OfX y={(x) => x ** power} color={Theme.red} weight={2.5} />
        </Mafs>
        <div className="legend">
          <span>
            <i className="dot dot-blue" />{' '}
            <MathText text={infinitesimalLegend.identity} />
          </span>
          <span>
            <i className="dot dot-green" />{' '}
            <MathText text={infinitesimalLegend.sine} />
          </span>
          <span>
            <i className="dot dot-red" /> <MathText text={`$y=x^{${power}}$`} />
          </span>
        </div>
        <div className="demo-readout">
          <MathText text={infinitesimalPowerReadout(power)} />
        </div>
      </div>
    </DemoFrame>
  )
}
