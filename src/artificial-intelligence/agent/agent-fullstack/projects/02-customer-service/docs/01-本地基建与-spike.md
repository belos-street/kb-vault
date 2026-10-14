# 01 · 本地基建与两个 Spike：先验证再铺功能

> 对应 [todo.md](../todo.md) §1。产出：`docker-compose.yml` + Spike A/B 实测脚本与结论。
> 前置：[00 · 工程初始化](./00-工程初始化.md)。启下：[02 · 数据与 FAQ 底座](./02-数据与-faq-底座.md)。

## 这一步做了什么

| 工作项 | 产出 | 一句话作用 |
| ------ | ---- | ---------- |
| 本地 PostgreSQL | `docker-compose.yml` | 全项目唯一外部服务依赖（订单/工单/checkpoint 同库） |
| **Spike A**：PostgresSaver | `scripts/spike-a-checkpoint.ts` | 验证 Checkpointer 跨进程持久化真的可用 |
| **Spike B**：HITL | `scripts/spike-b-hitl.ts` | 验证中断暴露形态与 resume payload 的精确字段 |

**「Spike 先行」是这一步的方法论**：Checkpointer 持久化和 HITL 恢复是全项目风险最高的
两个 API（文档语焉不详、跨进程行为不可想当然），先花最小成本实测，把结论沉淀下来，
再往上盖功能——避免「全部搭完才发现 API 形态不对」的返工。

## 承上：接住工程初始化的什么

`docker-compose.yml` 对应 `bun run db:up` 脚本（§0 注册）；
Spike 脚本用 Bun 直接跑，产出的经验回填 todo.md「Spike 结论」，给 §2 的
`src/memory/checkpointer.ts` 和 §4 的 HITL 配置当设计依据。

## Spike A：PostgresSaver 最小验证

实测结论（todo.md「Spike 结论」有完整版）：

```typescript
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

const checkpointer = PostgresSaver.fromConnString(url) // 直接返回实例，非 { pool, checkpointer }
await checkpointer.setup() // 首次必须：建 checkpoints 等 4 张表
// ... 跨进程同 thread_id 读写验证 ...
checkpointer.end() // 进程退出前必须调用，否则 pg 连接挂住进程
```

四个关键发现：

1. `fromConnString` **直接返回实例**（不是包装对象）；
2. 首次使用必须 `await setup()` 建 4 张表（`checkpoints` / `checkpoint_blobs` /
   `checkpoint_writes` / `checkpoint_migrations`）；
3. 跨进程验证通过：write 4 条 → 新进程同 `thread_id` 读 4 条 → 续聊 6 条 ✓；
4. ⚠️ invoke 中途抛错时，**已完成 super-step 的消息也会被 checkpoint**（残留脏数据）——
   调试期建议每次用新 `thread_id`。

## Spike B：HITL 最小验证

实测结论：中断与恢复的精确形态。

```typescript
// 1. 中断暴露：invoke 结果的 __interrupt__ 数组
result.__interrupt__ // [{ id, value: { actionRequests, reviewConfigs } }]

// 2. 恢复：同 thread_id + Command resume
import { Command } from '@langchain/langgraph'
agent.invoke(
  new Command({
    resume: {
      decisions: [
        { type: 'approve' }, // 按原参数执行
        { type: 'edit', editedAction: { name, args } }, // 修订参数直达工具
        { type: 'reject', message } // 工具不执行，ToolMessage(status: error) 进上下文
      ]
    }
  }),
  config
)
```

另一条测试手法结论：**`fakeModel`（自 `langchain` 导入）FIFO 排队**——
`respondWithTools([...])` 排工具调用轮，`.respond(factory)` 排恢复后的最终话术轮；
`createAgent` 的 model 参数传 fake 需 `as never` 绕过类型（运行时兼容）。
（spike 期结论：§4 最终代码已在 `BuildAgentOptions.model: string | BaseChatModel`
类型化后消解，不再需要 `as never`）
这条结论直接决定了 §4 全部 agent 测试的写法。

## 验证方式

```bash
bun run db:up
bun scripts/spike-a-checkpoint.ts   # 跨进程读写计数正确
bun scripts/spike-b-hitl.ts         # 三分支行为逐一确认
```

## 启下：为下一步铺垫什么

Spike A 的结论直接变成 `src/memory/checkpointer.ts` 的
实现细节（`setup()` 封装 + `end()` 收尾）；PostgreSQL 就位后，§2 往同库里放业务数据
（orders / tickets）——「业务数据 + checkpoint 同库不同表，本地一份 pg 全搞定」。
Spike B 的结论则要等到 §4 的 HITL 中间件接入时才用上。

## 参考链接

- [LangGraph.js Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)（Checkpointer / `thread_id` 会话持久化、PostgresSaver 故障排查）
- [@langchain/langgraph-checkpoint-postgres（npm）](https://www.npmjs.com/package/@langchain/langgraph-checkpoint-postgres)（`fromConnString` / `setup()` API）
- [LangChain.js Human-in-the-loop](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)（Spike B 验证的中断/恢复语义官方章节）
