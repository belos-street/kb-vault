import { useState } from 'react'
import { Circle, Coordinates, Mafs, Plot, Point, Text, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { DemoFrame } from './frame.tsx'

type Kind = 'removable' | 'jump' | 'infinite' | 'oscillation'

const kinds: Record<Kind, { label: string; note: string; point: string }> = {
  removable: {
    label: '可去',
    note: '左右极限都存在且相等，但函数在该点无定义（或函数值不等于极限）。补上定义就能连续。',
    point: '$x=0$ 处是空心点，$\\lim\\limits_{x\\to0}\\frac{\\sin x}{x}=1$'
  },
  jump: {
    label: '跳跃',
    note: '左右极限都存在，但不相等。',
    point: '$\\lim\\limits_{x\\to0^-}f(x)=-1$，$\\lim\\limits_{x\\to0^+}f(x)=1$'
  },
  infinite: {
    label: '无穷',
    note: '至少有一侧的极限为无穷大。',
    point: '$\\lim\\limits_{x\\to0^+}\\frac1x=+\\infty$'
  },
  oscillation: {
    label: '振荡',
    note: '函数值在有限范围内反复振荡，极限不存在。',
    point: '$\\sin\\frac1x$ 在 $x\\to0$ 时无穷次穿过 $[-1,1]$'
  }
}

export function ContinuityDemo() {
  const [kind, setKind] = useState<Kind>('removable')

  return (
    <DemoFrame
      title="四类间断点"
      hint={kinds[kind].note}
      controls={
        <div className="seg">
          {(Object.keys(kinds) as Kind[]).map((key) => (
            <button
              key={key}
              type="button"
              className={key === kind ? 'active' : ''}
              onClick={() => setKind(key)}>
              {kinds[key].label}
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
              <Point x={0} y={-1} color={Theme.red} />
              <Point x={0} y={1} color={Theme.red} />
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
          <MathText text={kinds[kind].point} />
        </div>
      </div>
    </DemoFrame>
  )
}
