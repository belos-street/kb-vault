# services 目录复习 QA

> 针对 `src/services/` 目录下各服务文件的问答整理，方便复习。
> 当前收录：`knowledge.ts`、`order.ts`、`ticket.ts`。后续新增服务的 QA 追加到本文档。

---

# knowledge.ts

> FAQ 关键词检索（`src/services/knowledge.ts`）与 `test/knowledge.test.ts` 相关问答。

## Q1：测试中这两行断言是什么意思？

```typescript
expect(results.length).toBeGreaterThan(0)
expect(results[0].question).toContain('退货')
```

对 query「你们的退货政策是什么？」的检索结果做两层验证：

- **L7**：断言**能命中**（召回）——结果数组非空，至少一条 FAQ 的关键词被 query 命中（query 包含「退货」「退货政策」）。
- **L8**：断言**排序正确**——`results[0]` 是按关键词命中数排序后的第一名，其 `question` 必须含「退货」，确保得分最高的确实是退货条目，而不是碰巧命中的其他条目。

一句话：**前者测召回，后者测排序质量。**

---

## Q2：`toBeGreaterThan(0)` 就是 `results.length > 0` 吗？

是的，**严格大于**。Bun（Jest）数值断言一族：

| 断言 | 等价表达式 |
|---|---|
| `toBeGreaterThan(0)` | `> 0` |
| `toBeGreaterThanOrEqual(0)` | `>= 0` |
| `toBeLessThan(2)` | `< 2` |
| `toBeLessThanOrEqual(2)` | `<= 2` |

---

## Q3：`searchKnowledge` 的算法逻辑是什么？

```typescript
export function searchKnowledge(query: string, topK = 3): FaqEntry[] {
  return faqs
    .map((faq) => ({
      faq,
      score: faq.keywords.filter((k) => query.includes(k)).length
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.faq)
}
```

四步流水线：

1. **打分**（`.map`）：每条 FAQ 数一下 `keywords` 中有多少个被 query 包含，该数量即 `score`。
2. **过滤**（`.filter`）：`score === 0` 的直接丢弃——无关问题返回空数组的原因。
3. **排序**（`.sort`）：按 `score` 从高到低，关键词命中最多的排最前。
4. **截取**（`.slice`）：取前 `topK` 条（默认 3）。

注意两点：

- 返回的不是「匹配最多的一个」，而是**匹配最多的前 topK 个**。
- 匹配方向是 `query.includes(k)`：**关键词必须是 query 的子串**才算命中。所以 query 里的「快递」命中不了关键词「快递费」，「退款」命中不了「退款到账」。这也是关键词方案与真实向量检索（Embedding 语义匹配）的差距所在（文件头注释已说明此处是模拟实现）。

---

## Q4：`question` 字段的作用是什么？

三个字段各司其职：

| 字段 | 职责 |
|---|---|
| `keywords` | 负责**被搜到**——检索打分唯一依据 |
| `answer` | 负责**被回答**——回复用户的知识依据 |
| `question` | 负责**被理解/被引用**——可读性元信息 |

`question` 的具体用途：

- **不参与检索**：`searchKnowledge` 只读 `keywords`，`question` 在算法中零参与，改成任意字符串检索结果不变。
- **测试断言**：测试用 `results[0].question` 判断命中的是不是正确的条目。
- **给 LLM 的上下文**：`searchKnowledge` 注册为 Agent tool 后，LLM 拿到结果时靠 `question` 理解这条知识对应什么问题、判断相关性、多条结果间取舍、必要时引用出处。

---

## Q5：确认——`question` 只是给 LLM / 调用方的语义化提示？

对，在**当前实现**下成立。但注意边界：这是关键词打分方案的特性，不是必然。真实向量检索场景下通常会把 `question` 和 `answer` 一起向量化参与语义匹配——那时 `question` 就回到检索主链路了。当前分开设计（`keywords` 检索、`question` 展示）只是因为用了模拟实现。

---

# order.ts & ticket.ts

> Mock 订单服务（`src/services/order.ts`）与 Mock 工单服务（`src/services/ticket.ts`）相关问答。

## Q1：订单和工单的区别是什么？如何理解这两个数据模型？

**核心区别：业务实体 vs 服务流程记录。**

- **订单（Order）是交易事实**——记录「用户买了什么、多少钱、到哪一步了」，是电商系统预先存在的核心业务数据，客服只是查询和依据它做判断。
- **工单（Ticket）是服务过程记录**——记录「用户这次来咨询了什么问题、处理到哪一步了」，是对话发生时才产生的衍生数据。

### 数据模型对比

| 维度 | `Order` | `Ticket` |
|---|---|---|
| 本质 | 交易凭证 | 问题跟踪单 |
| 谁产生 | 用户**下单时**产生（在客服场景之前就已存在） | 用户**咨询时**产生（客服对话的产物） |
| 业务字段 | `product_name`、`amount`、`ordered_at`、`delivered_at`——围绕**钱和货** | `summary`——围绕**问题本身** |
| 状态机 | `shipped → delivered → refunding → refunded`（或 `cancelled`），由**履约/售后流程**驱动 | `open → processing → resolved → closed`，由**客服处理进度**驱动 |
| 数据来源 | Mock 中预置了 13 条既有订单，供查询 | 初始为空数组 `[]`，靠 `createTicket` 动态增长 |
| 写操作 | **受控**：只能通过 `applyRefund` 改状态（先校验后变更），外部拿到的是浅拷贝 | 只创建、只查询，无状态流转函数（Mock 简化） |

### 理解要点

1. **状态机是模型的灵魂。** 两个模型最重要的都不是字段，而是 `status` 枚举定义的生命周期。订单状态决定「能干什么」——`canRefund` 的 `switch` 就是状态机的直接翻译：每个状态给出明确的允许/拒绝理由。工单状态决定「处理到哪了」。

2. **订单是「读多写少 + 受控写」。** `getOrderById` 返回 `{ ...order }` 浅拷贝，防止外部改坏内部数据；状态变更唯一入口 `applyRefund` 先校验（`canRefund`）后写入。这是把**业务规则收敛在服务层**的典型做法——Agent/LLM 不需要自己判断能不能退，调 `applyRefund` 拿到 `{ ok, reason }` 即可。

3. **工单是「客服 Agent 的副作用出口」。** 在 Agent 架构里，LLM 本身不产生持久状态，需要落地的动作（创建工单、发起退款）都收敛为 tool 调用这两个服务。工单模型极简（没有关联订单字段），是因为 Mock 阶段只需演示「创建 + 查询」；真实系统里工单通常会加 `order_id` 字段关联到订单，形成 `Ticket → Order` 的引用关系。

4. **时间字段反映模型语义。** 订单有 `ordered_at`/`delivered_at` 两个时间点，因为退款时效规则（签收后 7 天）依赖二者；工单只有 `created_at`，因为当前规则不涉及处理时限。字段多少完全由业务规则决定——「先有规则、后有模型」。

一句话总结：**订单回答「这单生意现在怎样」，工单回答「这个问题现在处理得怎样」；前者是客服的判断依据，后者是客服的工作产物。**
