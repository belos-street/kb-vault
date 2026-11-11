import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type StepKind = 'thought' | 'action' | 'observation' | 'answer' | 'guard'

interface Step {
  kind: StepKind
  title: string
  detail: string
}

const normalTrace: Step[] = [
  {
    kind: 'thought',
    title: 'Thought',
    detail: '用户问明天要不要带伞，需要杭州明天的天气。'
  },
  {
    kind: 'action',
    title: 'Action: weather({ city: "杭州", days: 1 })',
    detail: '模型返回 tool_calls，运行时按 name 查工具表。'
  },
  {
    kind: 'observation',
    title: 'Observation',
    detail: '{"city":"杭州","tomorrow":"中雨","tempC":22}'
  },
  {
    kind: 'thought',
    title: 'Thought',
    detail: '有降雨，建议带伞，并给出温度。'
  },
  {
    kind: 'answer',
    title: 'Answer',
    detail: '明天杭州中雨，22℃，建议带伞。'
  }
]

const loopTrace: Step[] = [
  {
    kind: 'thought',
    title: 'Thought',
    detail: '需要查订单状态。'
  },
  {
    kind: 'action',
    title: 'Action: getOrder({ id: "1024" })',
    detail: '参数格式不对，工具返回 invalid_input。'
  },
  {
    kind: 'observation',
    title: 'Observation',
    detail: '{"error":"orderId 必须匹配 ^ORD-\\\\d{4}$"}'
  },
  {
    kind: 'thought',
    title: 'Thought',
    detail: '再查一次，还是用同样的参数。'
  },
  {
    kind: 'action',
    title: 'Action: getOrder({ id: "1024" })',
    detail: '同样的错误，模型没有修正参数。'
  },
  {
    kind: 'guard',
    title: 'Guard: maxSteps = 6',
    detail: '循环被强制终止，返回「无法完成，请转人工」。'
  }
]

const parallelTrace: Step[] = [
  {
    kind: 'thought',
    title: 'Thought',
    detail: '需要同时查天气和订单，两个工具互不依赖。'
  },
  {
    kind: 'action',
    title: 'Action: 2 个 tool_calls 同时返回',
    detail: 'weather({city}) 与 getOrder({orderId}) 并行，不是串行两轮。'
  },
  {
    kind: 'observation',
    title: 'Observation × 2',
    detail: '两条 ToolMessage 都要带 tool_call_id 回填，顺序不保证。'
  },
  {
    kind: 'answer',
    title: 'Answer',
    detail: '明天有雨；订单 ORD-1024 已退款。'
  }
]

const traces = [
  { id: 'normal', label: '正常一轮', steps: normalTrace },
  { id: 'loop', label: '死循环', steps: loopTrace },
  { id: 'parallel', label: '并行调用', steps: parallelTrace }
] as const

const kindLabel: Record<StepKind, string> = {
  thought: '思考',
  action: '调用',
  observation: '观察',
  answer: '回答',
  guard: '熔断'
}

export function ReactLoopDemo() {
  const [traceId, setTraceId] =
    useState<(typeof traces)[number]['id']>('normal')
  const [cursor, setCursor] = useState(1)

  const trace = traces.find((item) => item.id === traceId) ?? traces[0]
  const visible = useMemo(() => trace.steps.slice(0, cursor), [trace, cursor])
  const finished = cursor >= trace.steps.length

  function switchTrace(next: (typeof traces)[number]['id']) {
    setTraceId(next)
    setCursor(1)
  }

  return (
    <DemoFrame
      title="ReAct 循环步进器"
      hint="逐步推进，观察 Thought / Action / Observation 如何累积；切到死循环看 maxSteps 如何兜底。">
      <div className="preset-row">
        {traces.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`preset-btn${traceId === item.id ? ' active' : ''}`}
            onClick={() => switchTrace(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="react-steps">
        {visible.map((step, index) => (
          <div key={index} className={`react-step kind-${step.kind}`}>
            <span className="react-kind">{kindLabel[step.kind]}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-actions">
        <button
          type="button"
          className="demo-btn"
          disabled={finished}
          onClick={() => setCursor((value) => value + 1)}>
          {finished ? '已结束' : `下一步（${cursor}/${trace.steps.length}）`}
        </button>
        <button
          type="button"
          className="demo-btn ghost"
          onClick={() => setCursor(1)}>
          重置
        </button>
      </div>

      <p className="demo-note">
        循环的三个必需品：<code>maxSteps</code>
        （防死循环）、参数校验（防无效重试）、
        <code>tool_call_id</code>（并行调用时把结果对回请求）。
      </p>
    </DemoFrame>
  )
}
