import { Coordinates, Mafs, Plot, Theme } from 'mafs'
import { MathText } from '../components/math.tsx'
import { DemoFrame } from './frame.tsx'

export function InfinitesimalDemo() {
  return (
    <DemoFrame
      title="三个无穷小的趋零速度"
      hint="在 $x\to0$ 附近，$x$ 与 $\sin x$ 几乎重合，而 $x^2$ 更快贴近 $0$。">
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
          <Plot.OfX y={(x) => x * x} color={Theme.red} weight={2.5} />
        </Mafs>
        <div className="legend">
          <span>
            <i className="dot dot-blue" /> <MathText text="$y=x$" />
          </span>
          <span>
            <i className="dot dot-green" /> <MathText text="$y=\sin x$" />
          </span>
          <span>
            <i className="dot dot-red" /> <MathText text="$y=x^2$" />
          </span>
        </div>
        <div className="demo-readout">
          <MathText text="因为 $\sin x\sim x$，两者是同阶等价无穷小；$x^2$ 相比 $x$ 是高阶无穷小，记作 $x^2=o(x)$。" />
        </div>
      </div>
    </DemoFrame>
  )
}
