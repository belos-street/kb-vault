import { useState } from 'react'
import { Coordinates, Mafs, Plot, Theme } from 'mafs'
import { MathFormula } from '../components/math.tsx'
import { functionLabFamilies, type FunctionFamily } from './formulas.ts'
import { DemoFrame } from './frame.tsx'

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
  const [family, setFunctionFamily] = useState<FunctionFamily>('sine')
  const [a, setA] = useState(1)
  const [b, setB] = useState(1)
  const config = functionLabFamilies[family]

  function switchFunctionFamily(next: FunctionFamily) {
    setFunctionFamily(next)
    setA(functionLabFamilies[next].a[1])
    setB(functionLabFamilies[next].b[1])
  }

  return (
    <DemoFrame
      title="函数图像实验室"
      hint="拖动参数，观察图像如何随系数变化。"
      controls={
        <div className="seg">
          {(Object.keys(functionLabFamilies) as FunctionFamily[]).map((key) => (
            <button
              key={key}
              type="button"
              className={key === family ? 'active' : ''}
              onClick={() => switchFunctionFamily(key)}>
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
