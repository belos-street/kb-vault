import { useState } from 'react'
import { Coordinates, Mafs, Plot, Theme } from 'mafs'
import { MathFormula, MathText } from '../components/math.tsx'
import { rationalFormula, rationalHint, rationalReadout } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

export function RationalLimitDemo() {
  const [m, setM] = useState(2)
  const [n, setN] = useState(3)

  function f(value: number): number {
    return value ** m / (value ** n + 1)
  }

  return (
    <DemoFrame
      title="有理函数在无穷远的极限"
      hint={rationalHint}
      controls={
        <>
          <label className="slider slider-inline">
            <span>
              分子 m<em>{m}</em>
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={m}
              onChange={(event) => setM(Number(event.target.value))}
            />
          </label>
          <label className="slider slider-inline">
            <span>
              分母 n<em>{n}</em>
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={n}
              onChange={(event) => setN(Number(event.target.value))}
            />
          </label>
        </>
      }>
      <div className="demo-stack">
        <div className="demo-formula">
          <MathFormula tex={rationalFormula(m, n)} />
        </div>
        <div className="demo-readout">
          <MathText text={rationalReadout(m, n)} />
        </div>
        <Mafs
          width="auto"
          height={320}
          viewBox={{ x: [-5, 5], y: [-3, 5] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={f} color={Theme.blue} weight={2.5} />
        </Mafs>
      </div>
    </DemoFrame>
  )
}
