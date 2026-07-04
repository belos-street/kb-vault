import { describe, expect, it, mock } from 'bun:test'

// 拦截 @langchain/langgraph-checkpoint-sqlite，避免 better-sqlite3 ABI 问题
mock.module('@langchain/langgraph-checkpoint-sqlite', () => ({
  SqliteSaver: {
    fromConnString: () => ({
      put: async () => { },
      get: async () => undefined,
      list: async function* () { }
    })
  }
}))

const { agent } = await import('./agent.ts')

describe('agent', () => {
  it('应成功创建 Agent 实例', () => {
    expect(agent).toBeDefined()
    expect(typeof agent.invoke).toBe('function')
  })

  it('应注册 4 个工具', () => {
    const toolNames = (agent.options.tools ?? []).map((t: any) => t.name)
    expect(toolNames).toContain('queryOrder')
    expect(toolNames).toContain('createRefund')
    expect(toolNames).toContain('searchKnowledge')
    expect(toolNames).toContain('createTicket')
    expect(toolNames.length).toBe(4)
  })

  it('应配置 checkpointer', () => {
    expect(agent.options.checkpointer).toBeDefined()
  })

  it('应配置 store', () => {
    expect(agent.options.store).toBeDefined()
  })

  it('应注册 3 个中间件（summarization + PII + HITL）', () => {
    expect(agent.options.middleware?.length).toBe(3)
  })

  it('应配置 contextSchema', () => {
    expect(agent.options.contextSchema).toBeDefined()
  })

  it('应包含 systemPrompt', () => {
    const prompt = agent.options.systemPrompt
    expect(prompt).toBeDefined()
    if (typeof prompt === 'string') {
      expect(prompt.length).toBeGreaterThan(0)
    }
  })

  it('应使用环境变量或默认模型名', () => {
    expect(agent.options.model).toBeDefined()
    expect(typeof agent.options.model).toBe('string')
  })
})
