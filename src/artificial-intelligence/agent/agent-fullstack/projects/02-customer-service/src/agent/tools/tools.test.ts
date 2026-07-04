import { describe, expect, it } from 'bun:test'
import { queryOrder } from './queryOrder.ts'
import { createRefund } from './createRefund.ts'
import { searchKnowledgeTool as searchKnowledge } from './searchKnowledge.ts'
import { createTicketTool as createTicket } from './createTicket.ts'

/** 构造模拟 runtime，注入 context */
function mockRuntime(userId = 'USER-001', userName = '张三'): any {
  return {
    context: { userId, userName },
    store: { get: async () => null, put: async () => {} }
  }
}

/** 调用工具，模拟 invoke 传入 runtime */
async function callTool(
  tool: any,
  args: Record<string, unknown>,
  runtime: any
) {
  return tool.invoke({ ...args }, runtime)
}

describe('queryOrder', () => {
  it('有效订单应返回订单信息', async () => {
    const result = await callTool(
      queryOrder,
      { orderId: 'ORD-2026001' },
      mockRuntime()
    )
    expect(result).toContain('ORD-2026001')
    expect(result).toContain('无线蓝牙耳机')
    expect(result).toContain('已发货')
    expect(result).toContain('299')
  })

  it('无效订单号应返回引导话术', async () => {
    const result = await callTool(
      queryOrder,
      { orderId: 'INVALID' },
      mockRuntime()
    )
    expect(result).toContain('未找到')
    expect(result).toContain('INVALID')
  })

  it('非用户自己的订单应返回引导话术', async () => {
    const result = await callTool(
      queryOrder,
      { orderId: 'ORD-2026001' },
      mockRuntime('USER-004')
    )
    expect(result).toContain('未找到')
  })
})

describe('createRefund', () => {
  it('有效订单应创建退款工单', async () => {
    const result = await callTool(
      createRefund,
      { orderId: 'ORD-2026002', reason: '商品与描述不符' },
      mockRuntime()
    )
    expect(result).toContain('退款申请已提交')
    expect(result).toMatch(/TK\d+/)
  })

  it('已发货订单不可退款应返回具体原因', async () => {
    const result = await callTool(
      createRefund,
      { orderId: 'ORD-2026001', reason: '不想要了' },
      mockRuntime()
    )
    expect(result).toContain('无法申请退款')
    expect(result).toContain('未签收')
  })

  it('超期订单不可退款应返回具体原因', async () => {
    const result = await callTool(
      createRefund,
      { orderId: 'ORD-2026003', reason: '不想要了' },
      mockRuntime()
    )
    expect(result).toContain('无法申请退款')
    expect(result).toContain('超过')
  })

  it('不存在的订单应返回引导话术', async () => {
    const result = await callTool(
      createRefund,
      { orderId: 'NOT-EXIST', reason: '破损' },
      mockRuntime()
    )
    expect(result).toContain('未找到')
  })
})

describe('searchKnowledge', () => {
  it('命中 FAQ 应返回问答对', async () => {
    const result = await callTool(
      searchKnowledge,
      { query: '退货政策' },
      mockRuntime()
    )
    expect(result).toContain('退货政策')
    expect(result).toContain('7 天')
    expect(result).toContain('【1】')
  })

  it('未命中应返回转人工提示', async () => {
    const result = await callTool(
      searchKnowledge,
      { query: '你们的 CEO 是谁' },
      mockRuntime()
    )
    expect(result).toContain('转接人工客服')
  })

  it('多关键词命中应返回多条结果', async () => {
    const result = await callTool(
      searchKnowledge,
      { query: '退款多久到账' },
      mockRuntime()
    )
    expect(result).toContain('【1】')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('createTicket', () => {
  it('应创建工单返回工单号', async () => {
    const result = await callTool(
      createTicket,
      { summary: '订单破损需处理', priority: 'high' },
      mockRuntime()
    )
    expect(result).toContain('工单已创建')
    expect(result).toContain('紧急')
    expect(result).toMatch(/TK\d+/)
  })

  it('无优先级时可正确创建', async () => {
    const result = await callTool(
      createTicket,
      { summary: '咨询换货问题' },
      mockRuntime()
    )
    expect(result).toContain('工单已创建')
    expect(result).toMatch(/TK\d+/)
  })

  it('不同优先级显示不同标记', async () => {
    const result = await callTool(
      createTicket,
      { summary: '简单问题', priority: 'low' },
      mockRuntime()
    )
    expect(result).toContain('低优先级')
  })
})
