import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type DutyId = 'loop' | 'messages' | 'schema' | 'validate' | 'execute' | 'state'

interface Duty {
  id: DutyId
  label: string
  short: string
  hand: string
  framework: string
  you: string
}

const duties: Duty[] = [
  {
    id: 'loop',
    label: '工具循环',
    short: 'for + maxSteps',
    hand: '手写 for 循环、判断 tool_calls、控制 maxSteps，循环退出条件自己维护。',
    framework: 'agent.invoke 内部跑循环，模型返回工具调用就执行，没有就结束。',
    you: '决定 recursionLimit / maxSteps 的业务上限。'
  },
  {
    id: 'messages',
    label: '消息回填',
    short: 'assistant → tool',
    hand: '手动 push assistant 消息、执行工具、按 tool_call_id 回填 ToolMessage。',
    framework:
      '框架维护消息状态，自动把 assistant(tool_calls) 与 ToolMessage 接起来。',
    you: '设计 system prompt 与历史裁剪策略。'
  },
  {
    id: 'schema',
    label: '工具 Schema',
    short: 'JSON parameters',
    hand: '在请求里手写 JSON Schema，再在运行时写一份 Zod 校验，两处容易漂移。',
    framework:
      'tool() 把实现、description、Zod Schema 绑在一处，模型看到的参数结构由 Schema 生成。',
    you: '写清工具边界：什么时候用、什么时候不要用。'
  },
  {
    id: 'validate',
    label: '参数校验',
    short: 'safeParse',
    hand: 'runTool 里 parse JSON、safeParse、拼错误信息、回填 invalid_arguments。',
    framework:
      '工具执行前自动过 Zod；参数不合法时返回 error ToolMessage，模型可修正。',
    you: '决定哪些错误可重试，哪些直接 fail closed。'
  },
  {
    id: 'execute',
    label: '工具执行',
    short: 'runTool',
    hand: '自己查工具表、执行函数、把返回值 JSON.stringify 成 tool 消息。',
    framework: 'ToolNode 负责查找与执行，支持并行 tool_calls。',
    you: '工具内部的权限、幂等与业务错误语义。'
  },
  {
    id: 'state',
    label: '多轮状态',
    short: 'messages 数组',
    hand: '自己维护 messages 数组，进程重启或换入口就丢上下文。',
    framework: 'checkpointer + thread_id 自动保存与恢复状态。',
    you: '选择 MemorySaver / PostgresSaver，定 thread_id 规则。'
  }
]

export function FrameworkRewriteDemo() {
  const [selectedId, setSelectedId] = useState<DutyId>('loop')
  const selected = duties.find((item) => item.id === selectedId) ?? duties[0]!

  return (
    <DemoFrame
      title="1.4 手写 vs 2.1 createAgent"
      hint="点一行职责，看框架接管了什么，你还剩什么。">
      <div className="fw-grid">
        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>职责</span>
            <span>{duties.length} 项</span>
          </div>
          <div className="fw-list">
            {duties.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`fw-row${selectedId === item.id ? ' active' : ''}`}
                onClick={() => setSelectedId(item.id)}>
                <strong>{item.label}</strong>
                <small>{item.short}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>{selected.label}</span>
            <span>对照</span>
          </div>
          <div className="tool-result">
            <span>1.4 手写</span>
            <p>{selected.hand}</p>
          </div>
          <div className="tool-result ok">
            <span>2.1 createAgent</span>
            <p>{selected.framework}</p>
          </div>
          <div className="tool-result fail">
            <span>你仍然要做</span>
            <p>{selected.you}</p>
          </div>
        </div>
      </div>

      <div className="fw-summary">
        <div>
          <strong>框架接管</strong>
          <span>循环 / 消息回填 / Schema / 校验 / 执行 / 状态</span>
        </div>
        <div>
          <strong>你负责</strong>
          <span>工具语义 / Prompt / 权限 / 失败策略</span>
        </div>
      </div>

      <p className="demo-note">
        createAgent 不是把 Agent 变简单，而是把循环与状态这类通用部分收走，
        让你只写业务差异。
      </p>
    </DemoFrame>
  )
}
