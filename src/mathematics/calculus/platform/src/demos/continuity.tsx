import { useState } from 'react'
import { Circle, Coordinates, Mafs, Plot, Text, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { continuityKinds, type ContinuityKind } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

export function ContinuityDemo() {
  const [kind, setKind] = useState<ContinuityKind>('removable')

  return (
    <DemoFrame
      title="四类间断点"
      hint={continuityKinds[kind].note}
      controls={
        <div className="seg">
          {(Object.keys(continuityKinds) as ContinuityKind[]).map((key) => (
            <button
              key={key}
              type="button"
              className={key === kind ? 'active' : ''}
              onClick={() => setKind(key)}>
              {continuityKinds[key].label}
            </button>
          ))}
        </div>
      }>
      <div className="demo-stack">
        <Mafs
          width="auto"
          height={300}
          viewBox={{ x: [-2, 2], y: [-1.8, 1.8] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />

          {kind === 'removable' ? (
            <>
              <Plot.OfX
                y={(x) => Math.sin(x) / x}
                domain={[-2, -0.0001]}
                color={Theme.blue}
                weight={2.5}
              />
              <Plot.OfX
                y={(x) => Math.sin(x) / x}
                domain={[0.0001, 2]}
                color={Theme.blue}
                weight={2.5}
              />
              <Circle
                center={[0, 1]}
                radius={0.03}
                color={Theme.red}
                fillOpacity={0}
                weight={2.5}
              />
            </>
          ) : null}

          {kind === 'jump' ? (
            <>
              <Plot.OfX
                y={() => -1}
                domain={[-2, -0.001]}
                color={Theme.blue}
                weight={2.5}
              />
              <Plot.OfX
                y={() => 1}
                domain={[0.001, 2]}
                color={Theme.blue}
                weight={2.5}
              />
              <Circle
                center={[0, -1]}
                radius={0.03}
                color={Theme.red}
                fillOpacity={0}
                weight={2.5}
              />
              <Circle
                center={[0, 1]}
                radius={0.03}
                color={Theme.red}
                fillOpacity={0}
                weight={2.5}
              />
            </>
          ) : null}

          {kind === 'infinite' ? (
            <>
              <Plot.OfX
                y={(x) => 1 / x}
                domain={[-2, -0.02]}
                color={Theme.blue}
                weight={2.5}
              />
              <Plot.OfX
                y={(x) => 1 / x}
                domain={[0.02, 2]}
                color={Theme.blue}
                weight={2.5}
              />
              <Text x={0.08} y={1.4} color={Theme.red} size={13}>
                x = 0 是铅直渐近线
              </Text>
            </>
          ) : null}

          {kind === 'oscillation' ? (
            <>
              <Plot.OfX
                y={(x) => Math.sin(1 / x)}
                domain={[-2, -0.0005]}
                color={Theme.blue}
                weight={2}
              />
              <Plot.OfX
                y={(x) => Math.sin(1 / x)}
                domain={[0.0005, 2]}
                color={Theme.blue}
                weight={2}
              />
              <Text x={0.1} y={1.5} color={Theme.red} size={13}>
                越靠近 0，振荡越密
              </Text>
            </>
          ) : null}
        </Mafs>
        <div className="demo-readout">
          <MathText text={continuityKinds[kind].point} />
        </div>
      </div>
    </DemoFrame>
  )
}
