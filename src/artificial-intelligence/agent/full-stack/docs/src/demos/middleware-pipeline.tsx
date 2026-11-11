import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type Scenario = 'normal' | 'pii' | 'hitl' | 'retry'
type StageId =
  | 'beforeAgent'
  | 'beforeModel'
  | 'wrapModelCall'
  | 'model'
  | 'afterModel'
  | 'wrapToolCall'
  | 'tool'
  | 'afterAgent'
type Tone = 'ok' | 'warn'

interface TraceEvent {
  stage: StageId
  title: string
  detail: string
  tone?: Tone
}

const stages: Array<{ id: StageId; label: string; hint: string }> = [
  { id: 'beforeAgent', label: 'beforeAgent', hint: '一次 invoke' },
  { id: 'beforeModel', label: 'beforeModel', hint: '模型前' },
  { id: 'wrapModelCall', label: 'wrapModelCall', hint: '包住模型' },
  { id: 'model', label: 'model', hint: 'LLM' },
  { id: 'afterModel', label: 'afterModel', hint: '工具前' },
  { id: 'wrapToolCall', label: 'wrapToolCall', hint: '包住工具' },
  { id: 'tool', label: 'tool', hint: '业务函数' },
  { id: 'afterAgent', label: 'afterAgent', hint: '一次 invoke' }
]

const scenarios: Array<{ id: Scenario; label: string; hint: string }> = [
  { id: 'normal', label: '普通工具调用', hint: '看完整顺序' },
  { id: 'pii', label: 'PII 脱敏', hint: '模型前替换邮箱' },
  { id: 'hitl', label: '退款审批', hint: '工具前中断' },
  { id: 'retry', label: '模型 429', hint: 'wrapModelCall 重试' }
]

const defaultEnabled = { retry: true, pii: true, hitl: true }

function buildEvents(
  scenario: Scenario,
  enabled: typeof defaultEnabled
): TraceEvent[] {
  const events: TraceEvent[] = [
    {
      stage: 'beforeAgent',
      title: 'invoke 开始',
      detail: '初始化 traceId、租户与预算'
    },
    {
      stage: 'beforeModel',
      title: '模型前',
      detail: '裁剪历史、注入 system'
    }
  ]

  if (scenario === 'pii') {
    events.push(
      enabled.pii
        ? {
            stage: 'beforeModel',
            title: 'PII 脱敏',
            detail: 'alice@example.com → [REDACTED_EMAIL]',
            tone: 'ok'
          }
        : {
            stage: 'beforeModel',
            title: '未启用 PII',
            detail: '邮箱原样进入模型',
            tone: 'warn'
          }
    )
  }

  if (scenario === 'retry') {
    if (!enabled.retry) {
      events.push(
        {
          stage: 'wrapModelCall',
          title: '模型调用失败',
          detail: '429 rate_limited，直接抛错',
          tone: 'warn'
        },
        {
          stage: 'afterAgent',
          title: '失败收口',
          detail: '不进入工具调用',
          tone: 'warn'
        }
      )
      return events
    }
    events.push(
      {
        stage: 'wrapModelCall',
        title: '第 1 次调用',
        detail: '429 rate_limited',
        tone: 'warn'
      },
      {
        stage: 'wrapModelCall',
        title: '重试 1/2',
        detail: '指数退避后成功',
        tone: 'ok'
      }
    )
  } else {
    events.push({
      stage: 'wrapModelCall',
      title: '模型调用',
      detail: '计时、记录 token'
    })
  }

  events.push({
    stage: 'model',
    title: 'LLM 返回',
    detail:
      scenario === 'pii' && enabled.pii
        ? '模型只看到脱敏后的输入'
        : 'content 或 tool_calls'
  })

  if (scenario === 'hitl' && enabled.hitl) {
    events.push({
      stage: 'afterModel',
      title: 'HITL 中断',
      detail: 'refund 需要审批，暂停等待 decisions',
      tone: 'warn'
    })
    return events
  }

  events.push({
    stage: 'afterModel',
    title: '模型后检查',
    detail: '检查 tool_calls，决定是否继续'
  })

  if (scenario === 'hitl') {
    events.push({
      stage: 'afterModel',
      title: 'HITL 未启用',
      detail: 'refund 没有审批，直接执行',
      tone: 'warn'
    })
  }

  events.push(
    {
      stage: 'wrapToolCall',
      title: '工具调用',
      detail: '权限、重试、审计'
    },
    {
      stage: 'tool',
      title: '工具执行',
      detail:
        scenario === 'hitl' ? 'refund 直接执行（未审批）' : 'weather 返回 24°C'
    },
    {
      stage: 'afterAgent',
      title: '收口',
      detail: '写审计、统计 token 与延迟'
    }
  )
  return events
}

const approvalEvents: TraceEvent[] = [
  {
    stage: 'wrapToolCall',
    title: '审批通过',
    detail: 'Command.resume({ decisions: [{ type: "approve" }] })',
    tone: 'ok'
  },
  {
    stage: 'tool',
    title: 'refund 执行',
    detail: 'ORD-1024 退款 199 元',
    tone: 'ok'
  },
  {
    stage: 'afterAgent',
    title: '收口',
    detail: '记录审批人、tool_call_id 与结果'
  }
]

const rejectEvents: TraceEvent[] = [
  {
    stage: 'afterAgent',
    title: '审批拒绝',
    detail: '工具不执行，拒绝原因回填给模型',
    tone: 'warn'
  }
]

export function MiddlewarePipelineDemo() {
  const [scenario, setScenario] = useState<Scenario>('normal')
  const [enabled, setEnabled] = useState(defaultEnabled)
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [status, setStatus] = useState<'idle' | 'paused' | 'done'>('idle')

  const activeStages = new Set(events.map((event) => event.stage))

  function switchScenario(next: Scenario) {
    setScenario(next)
    setEvents([])
    setStatus('idle')
  }

  function toggle(key: keyof typeof defaultEnabled) {
    setEnabled((current) => ({ ...current, [key]: !current[key] }))
    setEvents([])
    setStatus('idle')
  }

  function run() {
    setEvents(buildEvents(scenario, enabled))
    setStatus(scenario === 'hitl' && enabled.hitl ? 'paused' : 'done')
  }

  function approve() {
    setEvents((current) => [...current, ...approvalEvents])
    setStatus('done')
  }

  function reject() {
    setEvents((current) => [...current, ...rejectEvents])
    setStatus('done')
  }

  return (
    <DemoFrame
      title="中间件流水线"
      hint="切换中间件与场景，观察它们在 Agent 循环的哪个位置生效。">
      <div className="mw-tabs">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mw-tab${scenario === item.id ? ' active' : ''}`}
            onClick={() => switchScenario(item.id)}>
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>

      <div className="mw-pipeline" aria-label="中间件执行位置">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`mw-stage${activeStages.has(stage.id) ? ' active' : ''}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{stage.label}</strong>
            <small>{stage.hint}</small>
          </div>
        ))}
      </div>

      <div className="mw-grid">
        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>中间件开关</span>
            <span>数组顺序</span>
          </div>

          <label className="mw-toggle">
            <input
              type="checkbox"
              checked={enabled.retry}
              onChange={() => toggle('retry')}
            />
            <span>
              <strong>modelRetryMiddleware</strong>
              <small>wrapModelCall · 429 退避重试</small>
            </span>
          </label>

          <label className="mw-toggle">
            <input
              type="checkbox"
              checked={enabled.pii}
              onChange={() => toggle('pii')}
            />
            <span>
              <strong>piiMiddleware</strong>
              <small>beforeModel · 输入脱敏</small>
            </span>
          </label>

          <label className="mw-toggle">
            <input
              type="checkbox"
              checked={enabled.hitl}
              onChange={() => toggle('hitl')}
            />
            <span>
              <strong>humanInTheLoopMiddleware</strong>
              <small>afterModel · 工具前审批</small>
            </span>
          </label>

          <button type="button" className="demo-btn" onClick={run}>
            运行一次
          </button>

          <div
            className={`tool-result${status === 'paused' ? ' fail' : ' ok'}`}>
            <span>
              {status === 'idle'
                ? '等待运行'
                : status === 'paused'
                  ? '已暂停'
                  : '完成'}
            </span>
            <p>
              {status === 'idle'
                ? '选一个场景，再点运行。'
                : status === 'paused'
                  ? 'Agent 停在 afterModel，refund 还没有执行。'
                  : '执行结束，右侧是完整轨迹。'}
            </p>
            {status === 'paused' ? (
              <div className="mw-actions">
                <button type="button" className="demo-btn" onClick={approve}>
                  批准
                </button>
                <button
                  type="button"
                  className="demo-btn ghost"
                  onClick={reject}>
                  拒绝
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>执行轨迹</span>
            <span>{events.length} events</span>
          </div>
          <ol className="mw-trace">
            {events.length === 0 ? (
              <li className="mw-empty">运行后，这里按顺序展开。</li>
            ) : (
              events.map((event, index) => (
                <li key={index} className={event.tone ?? ''}>
                  <code>{event.stage}</code>
                  <strong>{event.title}</strong>
                  <span>{event.detail}</span>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>

      <p className="demo-note">
        顺序不是装饰：PII 必须在模型调用前，HITL 必须在工具执行前。写反了，
        敏感数据已经出去，或者工具已经执行。
      </p>
    </DemoFrame>
  )
}
