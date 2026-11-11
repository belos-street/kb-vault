import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type SpanId = 'root' | 'model1' | 'tool' | 'model2'
type SpanKind = 'agent' | 'model' | 'tool'

interface Span {
  id: SpanId
  depth: number
  name: string
  kind: SpanKind
  durationMs: number
  tokens?: string
  input: string
  output: string
  error?: string | undefined
}

const totalMs = 1240

function buildSpans(failTool: boolean): Span[] {
  return [
    {
      id: 'root',
      depth: 0,
      name: 'agent.invoke',
      kind: 'agent',
      durationMs: 1240,
      input: '杭州明天要带伞吗？',
      output: failTool
        ? '工具失败，返回降级提示'
        : '杭州明天有中雨，建议带伞。',
      error: failTool ? '下游 span 失败，根 span 标记为 error' : undefined
    },
    {
      id: 'model1',
      depth: 1,
      name: 'ChatOpenAI · 第 1 次',
      kind: 'model',
      durationMs: 420,
      tokens: '45 / 12 / 57',
      input: 'system + 用户消息',
      output: 'tool_calls: weather({ city: "杭州" })'
    },
    {
      id: 'tool',
      depth: 2,
      name: 'weather',
      kind: 'tool',
      durationMs: failTool ? 320 : 120,
      input: '{ "city": "杭州" }',
      output: failTool ? '(no output)' : '{ "tempC": 22, "tomorrow": "中雨" }',
      error: failTool ? 'upstream 503: weather service unavailable' : undefined
    },
    {
      id: 'model2',
      depth: 1,
      name: 'ChatOpenAI · 第 2 次',
      kind: 'model',
      durationMs: 380,
      tokens: '210 / 85 / 295',
      input: '历史 + tool 结果',
      output: failTool
        ? '天气服务暂时不可用，请稍后再试。'
        : '杭州明天有中雨，建议带伞。'
    }
  ]
}

const kindLabels: Record<SpanKind, string> = {
  agent: 'AGENT',
  model: 'MODEL',
  tool: 'TOOL'
}

export function TraceTreeDemo() {
  const [failTool, setFailTool] = useState(false)
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [selectedId, setSelectedId] = useState<SpanId>('root')

  const spans = buildSpans(failTool)
  const visible = onlyErrors
    ? spans.filter((span) => Boolean(span.error))
    : spans
  const selected = spans.find((span) => span.id === selectedId) ?? spans[0]!

  return (
    <DemoFrame
      title="Trace 瀑布图"
      hint="切换错误注入与过滤，点一个 span 看输入、输出、token 与错误。">
      <div className="trace-toolbar">
        <label>
          <input
            type="checkbox"
            checked={failTool}
            onChange={() => setFailTool((value) => !value)}
          />
          让 weather 工具失败
        </label>
        <label>
          <input
            type="checkbox"
            checked={onlyErrors}
            onChange={() => setOnlyErrors((value) => !value)}
          />
          只看错误 span
        </label>
        <span className={`trace-status${failTool ? ' fail' : ' ok'}`}>
          {failTool ? 'trace: error' : 'trace: success'}
        </span>
      </div>

      <div className="mw-grid">
        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>Span 树</span>
            <span>{visible.length} spans</span>
          </div>
          <div className="trace-list">
            {visible.map((span) => (
              <button
                key={span.id}
                type="button"
                className={`trace-row${selectedId === span.id ? ' active' : ''}${
                  span.error ? ' error' : ''
                }`}
                onClick={() => setSelectedId(span.id)}>
                <span
                  className="trace-indent"
                  style={{ marginLeft: span.depth * 10 }}
                />
                <span className="trace-kind">{kindLabels[span.kind]}</span>
                <strong>{span.name}</strong>
                <span className="trace-duration">{span.durationMs}ms</span>
                <span className="trace-bar">
                  <i
                    style={{
                      width: `${Math.round((span.durationMs / totalMs) * 100)}%`
                    }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>{selected.name}</span>
            <span>{kindLabels[selected.kind]}</span>
          </div>
          <div className="tool-result">
            <span>Input</span>
            <p>{selected.input}</p>
          </div>
          <div className={`tool-result${selected.error ? ' fail' : ' ok'}`}>
            <span>{selected.error ? 'Error' : 'Output'}</span>
            <p>{selected.error ?? selected.output}</p>
          </div>
          <div className="trace-meta">
            <span>耗时 {selected.durationMs}ms</span>
            <span>Token {selected.tokens ?? '—'}</span>
          </div>
        </div>
      </div>

      <p className="demo-note">
        排障顺序：先看根 span 是否失败，再顺着最深的错误 span 往下找；工具错误看
        input/output，模型错误看 token 与 finish_reason。不要只看最后一句回答。
      </p>
    </DemoFrame>
  )
}
