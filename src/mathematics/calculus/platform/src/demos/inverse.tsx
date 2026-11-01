import { useState } from 'react'
import { Coordinates, Line, Mafs, Plot, Theme } from 'mafs'
import { MathFormula } from '../components/math.tsx'
import { DemoFrame } from './frame.tsx'

type Kind = 'cube' | 'exp'

export function InverseDemo() {
  const [kind, setKind] = useState<Kind>('cube')

  return (
    <DemoFrame
      title="反函数与 $y=x$ 对称"
      hint="原函数与反函数的图像关于直线 $y=x$ 镜像。"
      controls={
        <div className="seg">
          <button
            type="button"
            className={kind === 'cube' ? 'active' : ''}
            onClick={() => setKind('cube')}>
            $y=x^3$
          </button>
          <button
            type="button"
            className={kind === 'exp' ? 'active' : ''}
            onClick={() => setKind('exp')}>
            $y=e^x$
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
            原函数 <MathFormula tex={kind === 'cube' ? 'y=x^3' : 'y=e^x'} />
          </span>
          <span>
            <i className="dot dot-green" />
            反函数{' '}
            <MathFormula
              tex={kind === 'cube' ? 'y=\\sqrt[3]{x}' : 'y=\\ln x'}
            />
          </span>
          <span>
            <i className="dot dot-line" />
            对称轴 <MathFormula tex="y=x" />
          </span>
        </div>
      </div>
    </DemoFrame>
  )
}
