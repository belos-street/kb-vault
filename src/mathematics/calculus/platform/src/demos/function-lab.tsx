import { useState } from 'react'
import { Coordinates, Mafs, Plot, Theme } from 'mafs'
import { MathFormula } from '../components/math.tsx'
import { DemoFrame } from './frame.tsx'

type Family = 'sine' | 'quad' | 'exp'

const families: Record<
  Family,
  {
    label: string
    formula: (a: number, b: number) => string
    f: (x: number, a: number, b: number) => number
    a: [number, number, number]
    b: [number, number, number]
    aLabel: string
    bLabel: string
  }
> = {
  sine: {
    label: '$y=a\\sin(bx)$',
    formula: (a, b) => String.raw`y=${a.toFixed(1)}\sin(${b.toFixed(1)}x)`,
    f: (x, a, b) => a * Math.sin(b * x),
    a: [0.5, 1, 3],
    b: [0.5, 1, 4],
    aLabel: '振幅 a',
    bLabel: '角频率 b'
  },
  quad: {
    label: '$y=ax^2+b$',
    formula: (a, b) =>
      String.raw`y=${a.toFixed(1)}x^2${b >= 0 ? '+' : ''}${b.toFixed(1)}`,
    f: (x, a, b) => a * x * x + b,
    a: [-2, 1, 2],
    b: [-3, 0, 3],
    aLabel: '开口 a',
    bLabel: '截距 b'
  },
  exp: {
    label: '$y=ae^{bx}$',
    formula: (a, b) => String.raw`y=${a.toFixed(1)}e^{${b.toFixed(1)}x}`,
    f: (x, a, b) => a * Math.exp(b * x),
    a: [0.2, 1, 2],
    b: [-1, 1, 1],
    aLabel: '系数 a',
    bLabel: '指数 b'
  }
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="slider">
      <span>
        {label}
        <em>{value.toFixed(1)}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function FunctionLab() {
  const [family, setFamily] = useState<Family>('sine')
  const [a, setA] = useState(1)
  const [b, setB] = useState(1)
  const config = families[family]

  function switchFamily(next: Family) {
    setFamily(next)
    setA(families[next].a[1])
    setB(families[next].b[1])
  }

  return (
    <DemoFrame
      title="函数图像实验室"
      hint="拖动参数，观察图像如何随系数变化。"
      controls={
        <div className="seg">
          {(Object.keys(families) as Family[]).map((key) => (
            <button
              key={key}
              type="button"
              className={key === family ? 'active' : ''}
              onClick={() => switchFamily(key)}>
              {key === 'sine' ? '正弦' : key === 'quad' ? '二次' : '指数'}
            </button>
          ))}
        </div>
      }>
      <div className="demo-stack">
        <div className="demo-formula">
          <MathFormula tex={config.formula(a, b)} />
        </div>
        <Mafs
          width="auto"
          height={320}
          viewBox={{ x: [-5, 5], y: [-3, 6] }}
          preserveAspectRatio={false}
          pan={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX
            y={(x) => config.f(x, a, b)}
            color={Theme.blue}
            weight={2.5}
          />
        </Mafs>
        <div className="sliders">
          <Slider
            label={config.aLabel}
            value={a}
            min={config.a[0]}
            max={config.a[2]}
            step={0.1}
            onChange={setA}
          />
          <Slider
            label={config.bLabel}
            value={b}
            min={config.b[0]}
            max={config.b[2]}
            step={0.1}
            onChange={setB}
          />
        </div>
      </div>
    </DemoFrame>
  )
}
