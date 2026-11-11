import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type Mode = 'raw' | 'structured'

const rawOutput =
  '好的，我帮您查一下。根据订单信息，退款会在 3-5 个工作日到账，请留意原支付渠道。'

const structuredOutput = `{
  "intent": "refund_status",
  "orderId": "ORD-1024",
  "confidence": 0.92,
  "reply": "退款会在 3-5 个工作日到账。"
}`

interface ParsedOutput {
  intent: string
  orderId: string
  confidence: number
  reply: string
}

export function OutputContractDemo() {
  const [mode, setMode] = useState<Mode>('structured')
  const [attempted, setAttempted] = useState(false)

  const text = mode === 'raw' ? rawOutput : structuredOutput
  let parsed: ParsedOutput | null = null
  let error: string | null = null

  if (attempted) {
    try {
      const value: unknown = JSON.parse(text)
      if (
        typeof value === 'object' &&
        value !== null &&
        'intent' in value &&
        'orderId' in value &&
        'confidence' in value &&
        'reply' in value
      ) {
        parsed = value as ParsedOutput
      } else {
        error = 'Schema 不匹配：缺少 intent / orderId / confidence / reply'
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'JSON.parse 失败'
    }
  }

  return (
    <DemoFrame
      title="输出契约实验台"
      hint="同一句回答，裸文本与 responseFormat 的下游消费成本完全不同。">
      <div className="output-toggle">
        <button
          type="button"
          className={mode === 'raw' ? 'active' : ''}
          onClick={() => {
            setMode('raw')
            setAttempted(false)
          }}>
          裸文本
        </button>
        <button
          type="button"
          className={mode === 'structured' ? 'active' : ''}
          onClick={() => {
            setMode('structured')
            setAttempted(false)
          }}>
          responseFormat
        </button>
      </div>

      <div className="output-grid">
        <div className="output-panel">
          <div className="output-panel-head">
            <span>模型返回</span>
            <span className={`output-mode mode-${mode}`}>
              {mode === 'raw' ? 'string' : 'json'}
            </span>
          </div>
          <pre>{text}</pre>
          <button
            type="button"
            className="demo-btn"
            onClick={() => setAttempted(true)}>
            尝试 JSON.parse
          </button>
        </div>

        <div className="output-panel">
          <div className="output-panel-head">
            <span>下游解析</span>
            <span
              className={`output-status ${parsed ? 'ok' : error ? 'fail' : ''}`}>
              {parsed ? '通过' : error ? '失败' : '未尝试'}
            </span>
          </div>

          {parsed ? (
            <div className="output-fields">
              <div>
                <span>intent</span>
                <strong>{parsed.intent}</strong>
              </div>
              <div>
                <span>orderId</span>
                <strong>{parsed.orderId}</strong>
              </div>
              <div>
                <span>confidence</span>
                <strong>{parsed.confidence}</strong>
              </div>
              <div>
                <span>reply</span>
                <strong>{parsed.reply}</strong>
              </div>
            </div>
          ) : (
            <div className="output-empty">
              <span>{error ?? '点左侧按钮，观察解析结果。'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="output-schema">
        <span>期望 Schema</span>
        <code>
          {
            '{ intent: string; orderId: string; confidence: number; reply: string }'
          }
        </code>
      </div>

      <p className="demo-note">
        裸文本不是「错的」，但它把解析责任推给了下游。 `responseFormat`
        把「可解析」变成模型调用的一部分：解析失败可以重试，
        而不是让业务代码猜。
      </p>
    </DemoFrame>
  )
}
