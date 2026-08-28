# agent 目录复习 QA

> 针对 `src/agent/` 目录下 Agent 相关文件的问答整理，方便复习。
> 当前收录：[schema.ts](schema.ts)（意图分类 Schema）。后续新增内容的 QA 追加到本文档。

---

## Q1：schema.ts 为什么要叫「schema」？

**schema 不是项目自创的名字，而是数据校验 / 序列化领域的通用术语——「数据结构的声明」**：规定数据长什么样、有哪些字段、每个字段什么类型、有何约束。

zod 本身的定位就是一个 schema 声明库，`z.object({...})` 声明出来的对象就叫 schema。这一个对象同时干两件事：

1. **运行时校验**：面对一段未知数据（比如 LLM 返回的 JSON），按 schema 逐字段验证类型与合法性（`safeParse`），非法时按 `.catch` 兜底而不是抛错。
2. **编译期类型**：`z.infer<typeof IntentSchema>` 把 schema「反向推导」成 TS 类型，Agent 层引用类型时无需再手写一份 interface——**一份声明，运行时与编译期共用，两处不会漂移**。

`services/` 目录里那些 TS interface 只有编译期类型；而 LLM 输出的 JSON 是**运行时值**，TS 类型编译后就不存在了，没法校验它，所以必须有 zod schema。这也是 LangChain Agent 结构化输出的标准做法（文档 2.4 §4）：把 schema 作为 `responseFormat` 传给模型，模型按这个结构返回。

一句话：**这个文件是「意图分类结果」的数据契约——模型必须按 `{ intent, slots, reply }` 结构返回，文件名取其通用术语 schema。**

---

## Q2：zod 的这些属性都是干嘛的？

schema.ts 用到的 zod API 分四组：

### 结构主干（定义"长什么样"）

| API               | 作用                                               | 本文件用法                              |
| ----------------- | -------------------------------------------------- | --------------------------------------- |
| `z.object({...})` | 定义对象结构：字段名 + 字段类型，类似 TS interface | 意图结果的外壳                          |
| `z.string()`      | 字符串类型                                         | `order_id`、`product_name`、`reason`... |
| `z.number()`      | 数字类型                                           | `slots.amount`（金额，元）              |

### 枚举与联合（限定取值）

| API                    | 作用                           | 本文件用法                  |
| ---------------------- | ------------------------------ | --------------------------- |
| `z.enum([...])`        | 枚举——值必须是列表其一         | 6 个合法意图                |
| `z.literal('unknown')` | 字面量——值必须精确等于该字符串 | 兜底意图                    |
| `z.union([...])`       | 联合——值匹配任一成员即可       | `enum ∪ literal('unknown')` |

三者的组合逻辑（todo 2.1 兜底策略）：

```
合法意图   → 命中 z.enum → 返回原枚举值
其他字符串 → 命中 z.literal('unknown') → 返回 'unknown'
```

> ⚠️ 为什么兜底要并进 union，而不是直接在 enum 上 `.catch`？zod 4.4 的 enum 不允许 `.catch()` 一个非枚举成员（TS 类型直接报错）。union 方案语义不变，且推断类型天然包含 `'unknown'`。

### 字段修饰（给单个字段加规则）

| API                | 作用                                           | 本文件用法                 |
| ------------------ | ---------------------------------------------- | -------------------------- |
| `.optional()`      | 字段可缺省——解析时缺了不报错，值为 `undefined` | `slots` 全部槽位 + `reply` |
| `.describe('...')` | 描述信息——**纯元数据，不参与校验**             | 每个字段的中文说明         |

`describe` 的价值在 LLM 场景：这些描述会进入给模型的 schema（responseFormat 的 JSON Schema），等于告诉模型「`order_id` 是订单号、形如 ORD-2601」，模型据此正确填充。没有 describe，模型只能靠字段名猜。

### 解析兜底与类型推导

| API                            | 作用                                             | 本文件用法                     |
| ------------------------------ | ------------------------------------------------ | ------------------------------ |
| `.catch('unknown')`            | 解析失败兜底：**值不合法时不抛错**，替换为默认值 | intent 非法 → `'unknown'`      |
| `z.infer<typeof IntentSchema>` | 从 schema 推导 TS 类型，导出 `IntentOutput`      | Agent 层直接引用，不用手写类型 |

一句话：**`z.object / z.string / z.number` 搭骨架，`z.enum / z.literal / z.union` 定取值，`.optional / .describe` 调字段，`.catch` 保解析不崩，`z.infer` 把声明变类型。**

---

## Q3：`IntentSchema` 必须按 `{ intent, slots, reply }` 返回吗？这是 langchain.js 的规范吗？

### 必须按这个结构返回吗？

**是，但"必须"是本项目自己定下的，不是框架强制的。**

`IntentSchema` 被配成**意图分类器**这个独立 Agent 的 `responseFormat`（README「设计预览」）：

```typescript
export const classifier = createAgent({
  name: 'intent_classifier',
  model: process.env.CLASSIFIER_MODEL ?? 'openai:gpt-5.4-mini',
  systemPrompt: '你是一个客服意图分类器...不要调用任何工具。',
  responseFormat: IntentSchema, // Structured Output：强制输出 { intent, slots }
  tools: []
})
```

"必须按这个结构返回"是**把 schema 塞进 `responseFormat` 之后 LangChain 才产生的约束**。字段名、三个字段的取舍都是项目设计的；如果当初设计成 `{ category, entities }`，Agent 就会输出 `{ category, entities }`。

`reply` 可缺省（`.optional()`），`slots` 里每个槽位也可缺省；真正必填的只有 `intent`（缺了会被 `.catch('unknown')` 兜底而不是抛错）。

### 三个字段分别代表什么？

| 字段     | 代表什么                                                                                                            | 谁来消费                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `intent` | **本次会话的意图分类**（6 种 + `unknown` 兜底），决定后续走哪条流程                                                 | CLI 路由逻辑：`order_query` → 查订单、`faq_query` → 知识库检索、`handoff` → 转人工、`unknown` → 不拦截直接交主 Agent |
| `slots`  | **结构化抽取的关键实体**（order_id / product_name / amount / reason / contact），分类器把长句子里的关键信息"提出来" | 主 Agent 或工具调用方，省得模型再从原文里找；可能是空，因为用户一句话未必带全                                        |
| `reply`  | 仅 `greeting` / `handoff` 两个**可直接回答**的意图下填现成话术；其余意图留空                                        | CLI：命中这两个意图时**直接用这段文案回复，不用再跑主 Agent**，省一次大模型调用；其余意图由主 Agent 生成真实回复     |

一句话：**`intent` 决定"往哪走"，`slots` 把要用的信息提前抽出来，`reply` 是少数场景的"免跑主 Agent"快车道。**

### 这是 langchain.js 的规范吗？

**不是字段规范，但"机制"是。**

- **LangChain 给的是机制**：`responseFormat: zodSchema` + `structuredResponse`（底层走函数调用/结构化输出）——这是框架级的标准做法（文档 2.4 §4）。zod schema 里的 `.describe()` 会进入给模型的 schema，模型据此知道该填什么。
- **字段设计是项目的**：`{ intent, slots, reply }` 的命名、语义、哪些可选，完全是本项目自己定的，LangChain 不关心这些字段，只保证"输出符合你给的 schema"。
