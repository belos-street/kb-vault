import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

function cny(value: number): string {
  if (value >= 100) return `¥${value.toFixed(0)}`
  if (value >= 1) return `¥${value.toFixed(2)}`
  return `¥${value.toFixed(4)}`
}

export function TokenCostDemo() {
  const [inputTokens, setInputTokens] = useState(1200)
  const [outputTokens, setOutputTokens] = useState(400)
  const [inputPrice, setInputPrice] = useState(2)
  const [outputPrice, setOutputPrice] = useState(8)
  const [callsPerDay, setCallsPerDay] = useState(1000)

  const inputCost = (inputTokens / 1_000_000) * inputPrice
  const outputCost = (outputTokens / 1_000_000) * outputPrice
  const perCall = inputCost + outputCost
  const daily = perCall * callsPerDay
  const monthly = daily * 30
  const total = inputCost + outputCost
  const inputShare = total > 0 ? (inputCost / total) * 100 : 0

  return (
    <DemoFrame
      title="Token 成本计算器"
      hint="改输入 / 输出 tokens 与单价，观察单次、每天、每月成本怎么变。">
      <div className="demo-form">
        <label>
          <span>输入 tokens / 次</span>
          <input
            type="number"
            min={1}
            value={inputTokens}
            onChange={(event) => setInputTokens(Number(event.target.value))}
          />
        </label>
        <label>
          <span>输出 tokens / 次</span>
          <input
            type="number"
            min={1}
            value={outputTokens}
            onChange={(event) => setOutputTokens(Number(event.target.value))}
          />
        </label>
        <label>
          <span>输入单价（元 / 百万 token）</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={inputPrice}
            onChange={(event) => setInputPrice(Number(event.target.value))}
          />
        </label>
        <label>
          <span>输出单价（元 / 百万 token）</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={outputPrice}
            onChange={(event) => setOutputPrice(Number(event.target.value))}
          />
        </label>
        <label className="demo-field-wide">
          <span>每天调用次数：{callsPerDay}</span>
          <input
            type="range"
            min={1}
            max={10000}
            step={100}
            value={callsPerDay}
            onChange={(event) => setCallsPerDay(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="demo-metrics">
        <div>
          <span>单次</span>
          <strong>{cny(perCall)}</strong>
        </div>
        <div>
          <span>每天</span>
          <strong>{cny(daily)}</strong>
        </div>
        <div>
          <span>每月（30 天）</span>
          <strong>{cny(monthly)}</strong>
        </div>
      </div>

      <div className="demo-bar" aria-label="输入与输出成本占比">
        <div className="demo-bar-track">
          <i style={{ width: `${inputShare}%` }} />
        </div>
        <div className="demo-bar-legend">
          <span>
            <i className="legend-input" /> 输入 {cny(inputCost)}
          </span>
          <span>
            <i className="legend-output" /> 输出 {cny(outputCost)}
          </span>
        </div>
      </div>

      <p className="demo-note">
        单价仅用于演示，请按当期模型价目替换。粗略估算：中文 1 字约 1.5
        token；英文约 4 字符 1 token。输出通常比输入贵 2～4 倍，所以
        「少说废话」也是成本优化。
      </p>
    </DemoFrame>
  )
}
