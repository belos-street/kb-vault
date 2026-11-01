import { useState } from 'react'
import { Coordinates, Line, Mafs, Plot, Theme } from 'mafs'
import { MathFormula } from '../components/math.tsx'
import { inverseFormulas, inverseHint, inverseTitle } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

type Kind = 'cube' | 'exp'

export function InverseDemo() {
  const [kind, setKind] = useState<Kind>('cube')
  const formulas = inverseFormulas[kind]

  return (
    <DemoFrame
      title={inverseTitle}
      hint={inverseHint}
      controls={
        <div className="seg">
          <button
            type="button"
            className={kind === 'cube' ? 'active' : ''}
            onClick={() => setKind('cube')}>
            <MathFormula tex={inverseFormulas.cube.original} />
          </button>
          <button
            type="button"
            className={kind === 'exp' ? 'active' : ''}
            onClick={() => setKind('exp')}>
            <MathFormula tex={inverseFormulas.exp.original} />
          </button>
        </div>
      }>
      <div className="demo-stack">
        <Mafs
          width="auto"
          height={340}
          viewBox={{ x: [-3, 3], y: [-3, 3] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Line.Segment
            point1={[-3, -3]}
            point2={[3, 3]}
            color={Theme.foreground}
            style="dashed"
            opacity={0.35}
          />
          {kind === 'cube' ? (
            <>
              <Plot.OfX
                y={(x) => x * x * x}
                domain={[-2.2, 2.2]}
                color={Theme.red}
                weight={2.5}
              />
              <Plot.OfX
                y={(x) => Math.cbrt(x)}
                domain={[-3, 3]}
                color={Theme.green}
                weight={2.5}
              />
            </>
          ) : (
            <>
              <Plot.OfX
                y={(x) => Math.exp(x)}
                domain={[-3, 2.6]}
                color={Theme.red}
                weight={2.5}
              />
              <Plot.OfX
                y={(x) => Math.log(x)}
                domain={[0.05, 3]}
                color={Theme.green}
                weight={2.5}
              />
            </>
          )}
        </Mafs>
        <div className="legend">
          <span>
            <i className="dot dot-red" />
            原函数 <MathFormula tex={formulas.original} />
          </span>
          <span>
            <i className="dot dot-green" />
            反函数 <MathFormula tex={formulas.inverse} />
          </span>
          <span>
            <i className="dot dot-line" />
            对称轴 <MathFormula tex={formulas.axis} />
          </span>
        </div>
      </div>
    </DemoFrame>
  )
}
