// 工具回归测试（todo 2.4）：直接 invoke 工具，覆盖参数校验 / 无效订单 / 不可退款 / 知识库未命中
// 工具通过 runtime.context.userId 读身份，invoke 时在 config.context 注入（探测确认可行）
import { describe, expect, test } from 'bun:test'
import {
  queryOrderTool,
  createRefundTool,
  searchKnowledgeTool
} from '../src/agent/tools/index'

const context = { userId: 'U1001', userName: '李华' }

/** 工具 invoke 的最小接口面：输入未知类型，config 只关心 context（4 个工具输入 schema 不同，统一收窄） */
interface InvokableTool {
  invoke(
    input: unknown,
    config?: { context?: Record<string, string> }
  ): Promise<unknown>
}

/** 携带运行时 context 直接调用工具 */
const run = (tool: InvokableTool, input: unknown) =>
  tool.invoke(input, { context })

describe('工具参数校验', () => {
  test('query_order 缺 order_id 抛解析异常', async () => {
    await expect(run(queryOrderTool, {})).rejects.toThrow(
      /did not match expected schema/
    )
  })

  test('create_refund 只传订单号缺 reason 抛解析异常', async () => {
    await expect(
      run(createRefundTool, { order_id: 'ORD-2601' })
    ).rejects.toThrow(/did not match expected schema/)
  })
})

describe('query_order', () => {
  test('命中订单返回商品与状态', async () => {
    const res = String(await run(queryOrderTool, { order_id: 'ORD-2601' }))
    expect(res).toContain('无线蓝牙耳机')
    expect(res).toContain('已签收')
  })

  test('不存在的订单号返回引导话术', async () => {
    const res = String(await run(queryOrderTool, { order_id: 'ORD-9999' }))
    expect(res).toContain('未找到该订单')
  })

  test('无法查询其他用户的订单', async () => {
    // ORD-2607 属于 U1002，U1001 查不到
    const res = String(await run(queryOrderTool, { order_id: 'ORD-2607' }))
    expect(res).toContain('未找到该订单')
  })
})

describe('create_refund', () => {
  test('超期订单（签收超 7 天）不可退款', async () => {
    const res = String(
      await run(createRefundTool, { order_id: 'ORD-2602', reason: '不想要了' })
    )
    expect(res).toContain('无法发起退款')
    expect(res).toContain('退款时效')
  })

  test('不存在的订单返回未找到', async () => {
    const res = String(
      await run(createRefundTool, { order_id: 'ORD-9999', reason: '不想要了' })
    )
    expect(res).toContain('无法发起退款')
    expect(res).toContain('未找到该订单')
  })
})

describe('search_knowledge', () => {
  test('命中 FAQ 返回问答内容', async () => {
    const res = String(
      await run(searchKnowledgeTool, { query: '退货政策是什么' })
    )
    expect(res).toContain('Q：')
    expect(res).toContain('A：')
  })

  test('未命中返回转人工引导话术', async () => {
    const res = String(
      await run(searchKnowledgeTool, { query: '你们的 CEO 是谁' })
    )
    expect(res).toContain('知识库未检索到相关内容')
  })
})
