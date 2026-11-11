import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type ToolId = 'weather' | 'refund' | 'search'
type Role = 'agent' | 'admin'

interface Field {
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'number' | 'select'
  options?: string[]
}

interface ToolDef {
  label: string
  hint: string
  fields: Field[]
  defaults: Record<string, string>
  schema: string
}

const toolDefs: Record<ToolId, ToolDef> = {
  weather: {
    label: '天气查询',
    hint: '最小工具：一个必填 string',
    fields: [{ name: 'city', label: 'city', placeholder: '杭州' }],
    defaults: { city: '杭州' },
    schema: `{
  "type": "object",
  "required": ["city"],
  "properties": {
    "city": { "type": "string", "minLength": 1 }
  }
}`
  },
  refund: {
    label: '退款申请',
    hint: '带格式校验 + 枚举 + 权限上下文',
    fields: [
      { name: 'orderId', label: 'orderId', placeholder: 'ORD-1024' },
      {
        name: 'reason',
        label: 'reason',
        type: 'select',
        options: ['damaged', 'late', 'other']
      }
    ],
    defaults: { orderId: 'ORD-1024', reason: 'late' },
    schema: `{
  "type": "object",
  "required": ["orderId", "reason"],
  "properties": {
    "orderId": { "type": "string", "pattern": "^ORD-\\\\d{4}$" },
    "reason": { "enum": ["damaged", "late", "other"] }
  }
}`
  },
  search: {
    label: '知识检索',
    hint: '数字范围 + 字符串长度',
    fields: [
      { name: 'query', label: 'query', placeholder: '退款多久到账' },
      { name: 'topK', label: 'topK', type: 'number', placeholder: '3' }
    ],
    defaults: { query: '退款多久到账', topK: '3' },
    schema: `{
  "type": "object",
  "required": ["query", "topK"],
  "properties": {
    "query": { "type": "string", "minLength": 2 },
    "topK": { "type": "integer", "minimum": 1, "maximum": 10 }
  }
}`
  }
}

interface RunResult {
  ok: boolean
  message: string
  data?: string
}

export function ToolContractDemo() {
  const [toolId, setToolId] = useState<ToolId>('refund')
  const [role, setRole] = useState<Role>('agent')
  const [values, setValues] = useState<Record<string, string>>(
    toolDefs.refund.defaults
  )
  const [result, setResult] = useState<RunResult | null>(null)

  const tool = toolDefs[toolId]

  function switchTool(next: ToolId) {
    setToolId(next)
    setValues(toolDefs[next].defaults)
    setResult(null)
  }

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setResult(null)
  }

  function run() {
    if (toolId === 'weather') {
      const city = (values.city ?? '').trim()
      if (!city) {
        setResult({ ok: false, message: 'city: 必填，且至少 1 个字符' })
        return
      }
      setResult({
        ok: true,
        message: 'tool call ok',
        data: JSON.stringify(
          { city, tempC: 24, condition: '多云', source: 'mock' },
          null,
          2
        )
      })
      return
    }

    if (toolId === 'refund') {
      const orderId = (values.orderId ?? '').trim()
      const reason = values.reason ?? ''
      if (!/^ORD-\d{4}$/.test(orderId)) {
        setResult({ ok: false, message: 'orderId: 必须匹配 ^ORD-\\d{4}$' })
        return
      }
      if (!['damaged', 'late', 'other'].includes(reason)) {
        setResult({
          ok: false,
          message: 'reason: 必须是 damaged / late / other'
        })
        return
      }
      if (role !== 'admin') {
        setResult({
          ok: false,
          message:
            '权限不足：refund 工具需要 admin 角色（Runtime Context 拒绝）'
        })
        return
      }
      setResult({
        ok: true,
        message: 'tool call ok',
        data: JSON.stringify(
          {
            orderId,
            reason,
            approved: true,
            refundCny: 199,
            operator: role
          },
          null,
          2
        )
      })
      return
    }

    const query = (values.query ?? '').trim()
    const topK = Number(values.topK ?? '')
    if (query.length < 2) {
      setResult({ ok: false, message: 'query: 至少 2 个字符' })
      return
    }
    if (!Number.isInteger(topK) || topK < 1 || topK > 10) {
      setResult({ ok: false, message: 'topK: 必须是 1~10 的整数' })
      return
    }
    setResult({
      ok: true,
      message: 'tool call ok',
      data: JSON.stringify(
        {
          query,
          topK,
          hits: ['退款政策 §2', '到账时间 §1', '发票与对公转账 §3'].slice(
            0,
            topK
          )
        },
        null,
        2
      )
    })
  }

  return (
    <DemoFrame
      title="工具契约实验台"
      hint="改参数、切角色，观察入参 Schema 与权限上下文如何拒绝非法调用。">
      <div className="tool-tabs">
        {(Object.keys(toolDefs) as ToolId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`tool-tab${toolId === id ? ' active' : ''}`}
            onClick={() => switchTool(id)}>
            <strong>{toolDefs[id].label}</strong>
            <span>{toolDefs[id].hint}</span>
          </button>
        ))}
      </div>

      <div className="tool-grid">
        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>调用参数</span>
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role)
                setResult(null)
              }}>
              <option value="agent">role: agent</option>
              <option value="admin">role: admin</option>
            </select>
          </div>

          {tool.fields.map((field) => (
            <label key={field.name} className="tool-field">
              <span>{field.label}</span>
              {field.type === 'select' ? (
                <select
                  value={values[field.name] ?? ''}
                  onChange={(event) => update(field.name, event.target.value)}>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={values[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(event) => update(field.name, event.target.value)}
                />
              )}
            </label>
          ))}

          <button type="button" className="demo-btn" onClick={run}>
            运行工具
          </button>

          <div className={`tool-result${result?.ok ? ' ok' : ' fail'}`}>
            <span>{result ? (result.ok ? '通过' : '拒绝') : '等待调用'}</span>
            <p>{result?.message ?? '改一个参数，再点运行。'}</p>
            {result?.data ? <pre>{result.data}</pre> : null}
          </div>
        </div>

        <div className="tool-panel tool-schema">
          <div className="tool-panel-head">
            <span>入参 Schema</span>
            <span className="tool-schema-tag">Zod 等价物</span>
          </div>
          <pre>{tool.schema}</pre>
          <p>
            工具契约不只是一段 JSON Schema：它还包括
            <strong>谁可以调用</strong>（role / tenant）和
            <strong>返回什么</strong>（输出 Schema）。
          </p>
        </div>
      </div>

      <p className="demo-note">
        当前 role 为 <code>{role}</code>。把 role 切回 agent 再运行退款，
        会看到权限上下文先于业务逻辑拒绝调用。
      </p>
    </DemoFrame>
  )
}
