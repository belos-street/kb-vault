// 自建链路追踪回归测试（todo 4.1'）：
// fakeModel 驱动一次含工具调用的 invoke，断言 JSONL 输出包含
// llm_end / tool_end / trace_summary，且 summary 正确聚合调用次数
import { describe, expect, test } from 'bun:test'
import { fakeModel } from '@langchain/core/testing'
import { AIMessage } from '@langchain/core/messages'
import { InMemoryStore } from '@langchain/langgraph'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCustomerSupportAgent } from '../src/agent/agent'
import { createCheckpointer } from '../src/memory/checkpointer'
import { JsonlTraceHandler } from '../src/observability/tracer'

const context = { userId: 'U1001', userName: '李华' }

describe('自建链路追踪（JsonlTraceHandler）', () => {
  test('一次含工具调用的 invoke 产出 Run Tree JSONL 与 trace_summary', async () => {
    const model = fakeModel()
      .respondWithTools([
        { name: 'save_preference', args: { key: 'nickname', value: '小李' } }
      ])
      .respond(new AIMessage('好的，已记住叫你小李。'))
    const agent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })

    // DI：写进系统临时目录，不污染项目 data/
    const path = join(mkdtempSync(join(tmpdir(), 'trace-')), 'traces.jsonl')
    const handler = new JsonlTraceHandler(path)

    await agent.invoke(
      { messages: [{ role: 'user', content: '以后叫我小李' }] },
      {
        configurable: { thread_id: 'trace-t1' },
        context,
        callbacks: [handler]
      }
    )

    const lines = readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>)
    const events = lines.map((line) => line.event)

    expect(events).toContain('llm_end')
    expect(events).toContain('tool_end')
    expect(events).toContain('trace_summary')

    // 工具行能对上工具名
    const toolLine = lines.find((line) => line.event === 'tool_end')
    expect(toolLine?.name).toBe('save_preference')
    expect(JSON.stringify(toolLine?.output)).toContain('nickname')

    // 汇总行：两次模型调用 + 一次工具调用，token 为数字且非负
    const summary = lines.find((line) => line.event === 'trace_summary')
    expect(summary?.llm_calls).toBe(2)
    expect(summary?.tool_calls).toBe(1)
    expect(Number(summary?.duration_ms)).toBeGreaterThanOrEqual(0)
    expect(Number(summary?.prompt_tokens)).toBeGreaterThanOrEqual(0)

    // 每个 event 行都有 ISO 时间戳，llm/tool 行带 parent_run_id（Run Tree 结构）
    for (const line of lines) {
      expect(typeof line.ts).toBe('string')
      expect(Number.isNaN(Date.parse(line.ts as string))).toBe(false)
    }
    expect(typeof toolLine?.parent_run_id).toBe('string')
  })
})
