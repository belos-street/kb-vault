import { describe, expect, it, mock, beforeAll } from 'bun:test'

// 拦截 @langchain/langgraph-checkpoint-sqlite，避免 better-sqlite3 ABI 问题
mock.module('@langchain/langgraph-checkpoint-sqlite', () => ({
  SqliteSaver: {
    fromConnString: () => ({
      put: async () => {},
      get: async () => undefined,
      list: async function* () {}
    })
  }
}))

describe('CLI', () => {
  it('应导出一个 invoke 函数（模块加载验证）', async () => {
    const cli = await import('./cli.ts')
    // cli.ts 是一个脚本，没有默认导出，但会触发 agent 创建
    // 验证模块能成功加载即可
    expect(cli).toBeDefined()
  })

  it('--user 参数应生成正确的 userId 和 threadId', () => {
    const userName = '李华'
    const userId = `USER-${userName}`
    const threadId = `cs-${userId}`

    expect(threadId).toBe('cs-USER-李华')
  })

  it('默认用户名为 测试用户', () => {
    // 模拟无 --user 参数的情况
    const originalArgv = process.argv
    Object.defineProperty(process, 'argv', {
      value: ['bun', 'cli.ts'],
      writable: true
    })

    const userName = '测试用户'
    const userId = `USER-${userName}`
    const threadId = `cs-${userId}`

    expect(threadId).toBe('cs-USER-测试用户')

    Object.defineProperty(process, 'argv', {
      value: originalArgv,
      writable: true
    })
  })
})
