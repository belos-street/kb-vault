import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type Role = 'system' | 'human' | 'ai' | 'tool'
type Provider = 'openai' | 'anthropic'

interface RoleInfo {
  id: Role
  label: string
  hint: string
  fields: string
  openai: string
  anthropic: string
}

const roles: RoleInfo[] = [
  {
    id: 'system',
    label: 'System',
    hint: '规则、边界、身份',
    fields: 'content: string | blocks',
    openai: `{ "role": "system", "content": "你是客服助手" }`,
    anthropic: `system: "你是客服助手"`
  },
  {
    id: 'human',
    label: 'Human',
    hint: '用户输入，可多模态',
    fields: 'content: string | blocks',
    openai: `{ "role": "user", "content": "退款多久到账？" }`,
    anthropic: `{ "role": "user", "content": "退款多久到账？" }`
  },
  {
    id: 'ai',
    label: 'AI',
    hint: '文本或 tool_calls',
    fields: 'content + tool_calls[]',
    openai: `{
  "role": "assistant",
  "content": null,
  "tool_calls": [{
    "id": "call_1",
    "type": "function",
    "function": { "name": "getOrder", "arguments": "{\\"orderId\\":\\"ORD-1024\\"}" }
  }]
}`,
    anthropic: `{
  "role": "assistant",
  "content": [{
    "type": "tool_use",
    "id": "call_1",
    "name": "getOrder",
    "input": { "orderId": "ORD-1024" }
  }]
}`
  },
  {
    id: 'tool',
    label: 'Tool',
    hint: '结果回填，必须带 id',
    fields: 'tool_call_id + content',
    openai: `{
  "role": "tool",
  "tool_call_id": "call_1",
  "content": "{\\"status\\":\\"refunded\\"}"
}`,
    anthropic: `{
  "role": "user",
  "content": [{
    "type": "tool_result",
    "tool_use_id": "call_1",
    "content": "{\\"status\\":\\"refunded\\"}"
  }]
}`
  }
]

export function MessageRolesDemo() {
  const [selectedId, setSelectedId] = useState<Role>('ai')
  const [provider, setProvider] = useState<Provider>('openai')
  const selected = roles.find((item) => item.id === selectedId) ?? roles[0]!

  return (
    <DemoFrame
      title="消息类型与 Provider 归一化"
      hint="切换消息角色与 Provider，看同一段语义在协议层长什么样。">
      <div className="msg-tabs">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            className={`msg-tab${selectedId === role.id ? ' active' : ''}`}
            onClick={() => setSelectedId(role.id)}>
            <strong>{role.label}</strong>
            <span>{role.hint}</span>
          </button>
        ))}
      </div>

      <div className="msg-conversation">
        {roles.map((role, index) => (
          <div
            key={role.id}
            className={`msg-role msg-role-${role.id}${
              selectedId === role.id ? ' active' : ''
            }`}>
            <span>0{index + 1}</span>
            <strong>{role.label}</strong>
            <small>{role.fields}</small>
          </div>
        ))}
      </div>

      <div className="msg-grid">
        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>{selected.label} 消息</span>
            <span>{selected.fields}</span>
          </div>
          <p className="msg-explain">
            {selected.id === 'ai'
              ? '模型决定调用工具时，工具调用挂在 AI 消息上；下一轮必须原样带回。'
              : selected.id === 'tool'
                ? '工具结果必须带 tool_call_id；漏掉或按数组下标回填，模型会以为工具没执行。'
                : '角色决定这段内容在上下文里的优先级与可见性。'}
          </p>
          <div className="tool-result ok">
            <span>LangChain 归一化</span>
            <p>
              `new {selected.label}Message(...)`；读取时用 `contentBlocks`
              拿统一的块结构。
            </p>
          </div>
        </div>

        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>Provider 协议</span>
            <div className="msg-provider">
              <button
                type="button"
                className={provider === 'openai' ? 'active' : ''}
                onClick={() => setProvider('openai')}>
                OpenAI
              </button>
              <button
                type="button"
                className={provider === 'anthropic' ? 'active' : ''}
                onClick={() => setProvider('anthropic')}>
                Anthropic
              </button>
            </div>
          </div>
          <pre className="msg-wire">
            {provider === 'openai' ? selected.openai : selected.anthropic}
          </pre>
        </div>
      </div>

      <p className="demo-note">
        上层只写 LangChain 消息类型；Provider 差异由集成包翻译。不要把 OpenAI 的
        `tool_calls` 结构写进业务代码。
      </p>
    </DemoFrame>
  )
}
