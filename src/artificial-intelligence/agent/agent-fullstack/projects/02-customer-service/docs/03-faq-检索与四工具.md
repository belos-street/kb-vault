# 03 · FAQ 检索与四工具：「检索即工具」的形态认知

> 对应 [todo.md](../todo.md) §3。产出：关键词 FAQ 检索 + 四个 `tool()` 工具 + 权限约束 + 单测。
> 前置：[02 · 数据与 FAQ 底座](./02-数据与-faq-底座.md)。启下：[04 · 意图分类与 Agent 主循环](./04-意图分类与-agent-主循环.md)。

## 这一步做了什么

| 工作项 | 产出 | 一句话作用 |
| ------ | ---- | ---------- |
| FAQ 关键词检索 | `src/services/faq-search.ts` | 2-4 字滑动窗口 + 重叠比 ≥0.35，复用 01 手法 |
| 四工具 | `src/agent/tools/` | query_order / search_policy / process_refund / create_ticket |
| 权限约束 | 各工具 `runtime.context.userId` | 跨用户订单查不到、建单只能给自己建 |
| 单测 | `test/faq.test.ts` + `test/tools.test.ts` | 三路径 + Zod 拒绝/越权/错误处理全覆盖 |

## 承上：为什么检索做成工具

RAG 整条线不在本项目范围（留待第四章），但「**对 Agent 而言 RAG 只是一个工具**」的
认知现在就要建立：`search_policy` 与 `query_order` 在 Agent 眼里没有本质区别——
第四章把检索后端整体换成向量库（切块 → Embedding → Qdrant + rerank）时，
工具接口零改动。检索实现复用 01 的关键词手法，学习成本为零，本步重心全在
`tool()` + Zod 的工具系统本身。

## 关键设计逐个看

### 1. faq-search.ts：滑动窗口 + 重叠比

中文分段后每段做 2-4 字滑动窗口（「退款政策」→ 退款 / 款政 / 政策 / 退款政 …），
与条目词表双向包含匹配，`重叠比 = 命中词数 / 条目词表长度 ≥ 0.35` 命中取最高分。
未命中统一返回 `FAQ_MISS = '知识库未覆盖'`——服务层不掺话术，由工具层转给模型
（模型据此建议建单转人工）。

### 2. 四工具：`tool()` + Zod 的标准形态

```typescript
export const queryOrder = tool(
  async ({ order_id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    const userId = runtime.context?.userId
    if (!userId) return '系统异常：缺少用户身份，无法查询订单'
    const order = await getOrderById(order_id)
    if (!order) return `未找到订单 ${order_id}，请确认订单号是否正确`
    if (order.user_id !== userId) return '无权查看他人订单'
    return fmtOrder(order)
  },
  { name: 'query_order', description: '...', schema: z.object({ ... }) }
)
```

四个约定同时体现在这一段代码里：

1. **Zod schema 入参校验**：非法参数在框架层被拒，到不了业务函数；
2. **`runtime.context.userId` 权限约束**：用户身份不进模型上下文，模型被骗也越不了权
   （权限最小化 = 注入防护纵深的一环）；
3. **校验失败返回原因不抛异常**：`ToolMessage` 把「订单不可退：在途」带回上下文，
   模型自纠或礼貌转告——错误处理策略的核心手法；
4. **工具描述即 prompt**：`search_policy` 的描述写明「仅限政策/规则类问题」，
   引导模型把订单类问题路由给 `query_order`。

### 3. 退款校验是纯代码，不是 LLM

`src/services/order-service.ts` 的 `checkRefundable(order, now)` 用 `switch` 判
状态 + 7 天窗口（`now` 可注入，测试不依赖真实时钟）——数值比较交给代码，
不让 LLM 比日期，这是「能用确定性代码就不用模型」的直接体现。

## 踩坑记录：returnDirect 的取舍（⚠️ 重要）

原设计 `query_order` 开 `returnDirect: true`（确定性结果直接回传，省一次模型加工）。
实测 langchain 1.5.x（1.5.16 未修）后弃用，两个原因：

1. **框架 bug**：returnDirect 工具执行后 AgentNode 早退（空 update），
   但 afterModel 路由器在「结构化输出未产出」时又把任务送回 model 节点——
   两者打架，无限空转打满 recursion limit；
2. **语义冲突**：框架语义里 returnDirect 会**终止整轮对话**——README 的退款全链
   （查单 → 退单 → 工单单轮完成）根本跑不完。

决策：四工具统一普通工具。确定性快照照样原样回传（工具返回什么用户看到什么，
模型不改写数据行）；「直接回传」的用户体验损失微乎其微，换来全链路可跑。
测试侧把「returnDirect 生效」改写为「returnDirect 取舍（框架坑记录）」，
断言四工具均不开——**测试断言的是决策本身，防止后人无意中加回去**。

## 验证方式

```bash
bun test test/faq.test.ts    # 命中 / 阈值边界 / 未命中三路径
bun test test/tools.test.ts  # Zod 拒绝 / 跨用户被拒 / 不可退返回原因 / 退款落库
```

## 启下：为下一步铺垫什么

工具层、数据层、检索层全部就位且单测覆盖——§4 开始组装 `createAgent` 主循环：
四工具挂上模型、意图分类器在入口做路由、中间件栈做质检。工具描述里的分工
（政策 → search_policy、订单 → query_order）也正是分类器路由规则的业务蓝本。
