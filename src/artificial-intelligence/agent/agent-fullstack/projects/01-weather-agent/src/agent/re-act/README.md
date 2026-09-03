# ReAct 循环

ReAct（**Rea**soning + **Act**ing）是 Agent 最核心的架构模式。整个天气助手的"大脑"就是 `runAgent` 这个函数。

```
Retrieve → Think → Act → Observe → Response
```

---

## 消息协议：Message 接口

在理解流程前，先搞懂 Agent 内部传递的数据格式。

```ts
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[] // assistant 要调用的工具列表
  tool_call_id?: string // 标记这条 tool 消息回应的是哪次调用
  name?: string // 工具名
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}
```

这基本就是 OpenAI Chat Completion 的格式。每条消息有一个角色（谁说的）和内容。特别的：

- **assistant** 可以不带 content（空字符串），而是带 `tool_calls` 表示"我不说话，我要调工具"
- **tool** 消息必须带 `tool_call_id` 指向上一条 assistant 的某个 tool_call，表示"这是你刚才调那个工具的结果"

这个协议是整个 ReAct 循环能跑起来的基础。

---

## 参数签名

```ts
async function runAgent(
  userMessage: string, // 用户本次输入
  history: Message[], // 之前的对话记录
  onStep?: (step: StepEvent) => void, // 阶段回调
  client?: OpenAI // 可注入的 LLM 客户端（默认全局 openai），测试时传 mock
): Promise<string> // 最终回答
```

**为什么传 history 而不是自己维护？** 因为 history 的管理权在调用方（CLI）。CLI 可以决定哪些消息进历史、是否裁剪过长历史、是否加密持久化。`runAgent` 只管读，不管写。

**为什么用 onStep 回调？** 解耦。`runAgent` 只关心流程编排，不关心 UI。CLI 用回调打印 `📖 🔧 📡`，换成 Web 界面就可以换成 WebSocket 推送进度。

---

## Step 0: Retrieve — 知识检索

```ts
const faq = retrieveFaq(userMessage)
const ragContext = faq
  ? `参考知识：\n问：${faq.question}\n答：${faq.answer}`
  : undefined
```

**做了什么：** 用户输入先过一遍 FAQ 关键词匹配。如果命中（比如"台风天注意什么"），把答案格式化成一段文字。

**ragContext 怎么用？** 它被传给 `buildMessages()`，拼进 system prompt 末尾：

```ts
// buildMessages 内部（简化）：
const systemContent = ragContext
  ? `${SYSTEM_PROMPT}\n\n---\n${ragContext}\n---`
  : SYSTEM_PROMPT
```

LLM 看到 system prompt 里多了"参考知识：问：台风天出门需要注意什么？答：..."，就知道可以直接用这个回答问题，不需要调工具。

**为什么叫 RAG？** Retrieval-Augmented Generation（检索增强生成）。先检索知识库，再把检索结果"增强"到 LLM 的输入里。虽然这里只是简单的关键词匹配，但架构思想是一样的——换掉 `retrieveFaq` 换成向量检索，就是完整的 RAG。

---

## Step 1: Think — LLM 思考

```ts
const messages = buildMessages(userMessage, history, ragContext)
const openaiTools = toOpenAiTools()

const response = await client.chat.completions.create({
  model: config.DEFAULT_MODEL, // 可配置，默认 deepseek-v4-flash
  messages: messages as unknown as ChatCompletionMessageParam[],
  tools: openaiTools.length > 0 ? openaiTools : undefined,
  tool_choice: 'auto'
})
```

### buildMessages 做了什么

把 4 部分拼成一个数组：

```
[
  { role: 'system', content: systemPrompt + ragContext },
  ...FEWSHOT_EXAMPLES,    // 仅首轮
  ...history,             // 之前的对话
  { role: 'user', content: '北京天气怎么样？' }
]
```

关键细节：

- **few-shot 只在首轮**：`history.length === 0` 时才带。如果第二轮还带 few-shot，不仅浪费 token，而且示例中的 tool_call_id 会和实际的冲突（LLM 可能混淆"示例的调用"和"实际的调用"）
- **cityHint 动态生成**：每次构建 system prompt 时重新从 `CITY_ALIASES` 生成城市列表，确保只维护一份数据

### toOpenAiTools 做了什么

把项目自定义的 `Tool` 接口转成 OpenAI 的 `ChatCompletionTool` 格式：

```ts
// Tool 定义（项目内部）：
{ name: 'get_weather', description: '...', parameters: {...}, execute: fn }

// 转为 OpenAI 格式：
{ type: 'function', function: { name: 'get_weather', description: '...', parameters: {...} } }
```

`execute` 不会传给 OpenAI——LLM 不需要知道怎么执行，只需要知道怎么调用。

### tool_choice: 'auto'

告诉 LLM："你可以自己决定要不要调工具"。还有其他选项：

- `'none'`：禁止调工具
- `'required'`：必须调工具
- `{ type: 'function', function: { name: 'get_weather' } }`：强制调特定工具

`'auto'` 最灵活，让 LLM 根据上下文判断。比如"你好"就不会调，"北京天气"就会调。

---

## Think 之后的分叉

```ts
const choice = response.choices[0]
if (!choice) return '助手暂时无法响应，请稍后再试。'

if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
  return choice.message.content ?? ''
}
```

**两个分叉：**

| 情况     | 用户的输入                    | LLM 的回复                 | 流程           |
| -------- | ----------------------------- | -------------------------- | -------------- |
| 直接回答 | "你好" / "台风天注意什么"     | `{ content: "你好！..." }` | 直接返回，结束 |
| 调工具   | "北京天气" / "北京和上海谁冷" | `{ tool_calls: [...] }`    | 继续 Act       |

**为什么需要 `?? ''` 而不是直接 `choice.message.content`？** TypeScript 的类型定义说 `content` 可能是 `string | null`。当 LLM 决定调工具时，它可能不生成任何文字内容（`content: null`），只带 `tool_calls`。这里用 `?? ''` 兜底。

**`tool_calls` 是数组**：LLM 可以一次请求调用多个工具。比如"北京和上海哪个更暖和"，LLM 写一次 response 里带两个 tool_call，一个查北京一个查上海。

---

## Step 2: Act — 执行工具

```ts
const assistantMessage = {
  role: 'assistant' as const,
  content: choice.message.content ?? '',
  tool_calls: choice.message.tool_calls
}

for (const tc of choice.message.tool_calls) {
  const toolCall = tc as {
    id: string
    function: { name: string; arguments: string }
  }

  const tool = getToolByName(toolCall.function.name)
  const args = JSON.parse(toolCall.function.arguments)
  const result = await tool.execute(args)

  toolResults.push({
    role: 'tool',
    content: result,
    tool_call_id: toolCall.id,
    name: toolCall.function.name
  })
}
```

### 第一步：保存 assistant 消息

```ts
const assistantMessage = { role: 'assistant', content: '', tool_calls: [...] }
```

这条消息记录"LLM 当时决定调哪些工具"。之后发给 LLM 做 Observe 时，LLM 需要看到自己刚才的"想法"，理解上下文。

为什么 `content` 可能是空字符串？因为 LLM 调工具时可以一句废话不说，直接返回 `tool_calls`。但消息格式要求必须有 `content` 字段，所以存 `''`。

### 第二步：遍历执行工具

**类型断言 `tc as { id: string; function: { name: string; arguments: string } }`**：OpenAI SDK 的 `ChatCompletionMessageToolCall` 类型比我们需要的复杂（有 `type: 'function'` 等运行时确定的字段），但我们只需要 `id` 和 `function.name` + `function.arguments`，所以用 as 简化。

**JSON.parse 解析参数**：LLM 返回的 `arguments` 是 JSON 字符串（LLM 的 API 就是这么设计的），比如 `'{"city":"北京"}'`。需要 parse 成对象才能传给 `tool.execute()`。

**`tool.execute()` 返回字符串**：WeatherService 返回的是 `WeatherData` 对象，但工具在 execute 里做了 `JSON.stringify(weatherData)`。为什么返回字符串而不是对象？

1. `Tool` 接口定义是 `execute: () => Promise<string> | string` — 统一用字符串，兼容各种工具
2. 有些工具可能返回文件内容、API 响应原文等非 JSON 数据
3. LLM 接收工具结果时，字符串格式最通用

### 第三步：处理并行调用

```ts
// LLM 一次返回两个 tool_call：
tool_calls = [
  {
    id: 'call_1',
    function: { name: 'get_weather', arguments: '{"city":"北京"}' }
  },
  {
    id: 'call_2',
    function: { name: 'get_weather', arguments: '{"city":"上海"}' }
  }
]
```

这里用 `for...of` 顺序执行（有 `no-await-in-loop` 的 lint warning），理想情况应该用 `Promise.all` 并行。但对入门 demo 来说顺序执行更简单可靠，而且两个 `get_weather` 都是 Mock 服务的同步操作，实际区别不大。

### 错误处理

```ts
try {
  const args = JSON.parse(toolCall.function.arguments)
  const result = await tool.execute(args)
  toolResults.push({ role: 'tool', content: result, ... })
} catch (e) {
  toolResults.push({ role: 'tool', content: `工具执行失败：${e.message}`, ... })
}
```

两个可能的错误：

1. **JSON.parse 失败**：LLM 生成的 JSON 格式不对（极少发生，但可能）。错误消息被捕获，LLM 看到"工具执行失败：Unexpected token..."后可能会说"抱歉，查询出错了"
2. **tool.execute 失败**：比如空的 city 参数被 Zod 拒绝，抛出 `参数校验失败：city: 城市名不能为空`

错误不会阻止整个流程——哪个工具失败就把错误信息记录到 toolResults 里，其他工具照常执行，LLM 最终会看到混合的"成功+失败"结果并给出合理回复。

---

## Step 3: Observe — 回传结果

```ts
const finalMessages = [...messages, assistantMessage, ...toolResults]

const finalResponse = await openai.chat.completions.create({
  model: config.DEFAULT_MODEL,
  messages: finalMessages,
  tools: openaiTools,
  tool_choice: 'auto'
})

return finalChoice?.message.content ?? ''
```

### finalMessages 的结构

发给 LLM 的最终消息列表是"原封不动追加"的形式：

```
# messages 部分（和第一轮一样）
system: 你是天气助手...
user: 北京天气怎么样？

# 追加：assistant 之前说的"我要调工具"
assistant: (content: '', tool_calls: [{...}])

# 追加：工具返回的结果
tool: (content: '{"temperature":25,...}', tool_call_id: 'call_...')
```

LLM 看了完整上下文后，就能基于实际数据生成最终回答。

### 为什么还要传 tools + tool_choice？

因为 LLM 在 Observe 阶段**有可能**还想再调工具。比如：

```
用户: 北京天气怎么样？
LLM: (调 get_weather，拿到 25°C)
LLM: 等等，我再查一下明天的是不是更准确？
LLM: (又调 get_weather...)
```

这就是"多轮 ReAct"。我们的实现里第一次 Observe 拿到结果后没检查是否又调了工具（简化处理），但架构上支持——如果 `finalResponse.choices[0].message.tool_calls` 不为空，可以递归继续。

---

## 完整数据流示例

以用户说"北京今天天气怎么样？"为例，走一遍完整的数据流：

### 1. 输入

```
userMessage = "北京今天天气怎么样？"
history = []
```

### 2. Retrieve

```
retrieveFaq("北京今天天气怎么样？")
→ 检测到"北京"在城市列表里，跳过 FAQ
→ 返回 null，ragContext = undefined
```

### 3. buildMessages

```
messages = [
  { role: 'system', content: '你是天气助手...\n\n支持的城市：北京、上海...' },
  ...FEWSHOT_EXAMPLES,  // 5 个示例
  { role: 'user', content: '北京今天天气怎么样？' }
]
```

### 4. toOpenAiTools

```
openaiTools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询指定城市的实时天气信息...',
      parameters: { type: 'object', properties: { city: { type: 'string' } } }
    }
  }
]
```

这里 `parameters` 来自 `z.toJSONSchema(getWeatherSchema)`，是 Zod 根据 `getWeatherSchema` 自动生成的 JSON Schema。

### 5. Think — 调用 LLM

发送给 LLM 的请求（简化）：

```
POST https://api.deepseek.com/v1/chat/completions
{
  model: "deepseek-v4-flash",
  messages: [
    { role: "system", content: "你是天气助手..." },
    { role: "user", content: "北京今天天气怎么样？" }
  ],
  tools: [{ type: "function", function: { name: "get_weather", ... } }],
  tool_choice: "auto"
}
```

### 6. LLM 返回

```json
{
  "choices": [
    {
      "message": {
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"city\":\"北京\"}"
            }
          }
        ]
      }
    }
  ]
}
```

### 7. Act — 执行

```
getToolByName("get_weather") → 找到 weather-tool.ts 里的 getWeatherTool

JSON.parse('{"city":"北京"}') → { city: '北京' }

getWeatherSchema.safeParse({ city: '北京' })
→ 通过校验，返回 { success: true, data: { city: '北京' } }

getWeather("北京")
→ 返回 { city: "北京", temperature: 25, feelsLike: 27, ... }

JSON.stringify({ city: "北京", temperature: 25, ... })
→ '{"city":"北京","temperature":25,...}'

toolResults = [
  { role: 'tool', content: '{"city":"北京","temperature":25,...}', tool_call_id: 'call_abc123', name: 'get_weather' }
]
```

这里 `getWeather` 返回的是对象，但 `tool.execute` 要求返回字符串，所以做了 `JSON.stringify`。LLM 在下一步会解析这个 JSON 字符串。

### 8. Observe — 回传结果

```
finalMessages = [
  // 原始消息
  { role: 'system', content: '你是天气助手...' },
  { role: 'user', content: '北京今天天气怎么样？' },

  // assistant 的调用请求
  { role: 'assistant', content: '', tool_calls: [{ id: 'call_abc123', ... }] },

  // 工具结果
  { role: 'tool', content: '{"city":"北京","temperature":25,...}', tool_call_id: 'call_abc123' }
]
```

### 9. 最终回答

LLM 看到工具返回的数据，用自然语言回复：

```json
{
  "choices": [
    {
      "message": {
        "content": "北京今天天气晴朗，气温 25°C，体感温度 27°C..."
      }
    }
  ]
}
```

### 10. 返回

```ts
return '北京今天天气晴朗，气温 25°C，体感温度 27°C...'
```

---

## 设计决策

### 为什么用 `as unknown as ChatCompletionMessageParam[]`？

OpenAI SDK 的 `ChatCompletionMessageParam` 是一组联合类型（每个 role 有不同的字段要求），而我们构造消息时是动态拼装的，严格类型检查成本很高。断言收敛在两处 API 调用边界，且用 `as unknown as` 显式声明跨类型转换——比 `as any` 更诚实：不会顺带关掉其他检查，字段拼错仍会被类型系统在别处抓住。这是类型安全与实用性之间的折中，而非放弃类型安全。

### 为什么 history 不自动管理？

`runAgent` 不负责把本轮对话写回 history，因为：

1. **调用方知道需要什么**：CLI 需要完整历史，Web 可能需要裁剪或加密
2. **灵活性**：调用方可以决定哪些消息进历史（比如只保留 user + assistant，丢弃 system + tool）
3. **单一职责**：`runAgent` 只做"一次问答"，不管理状态

CLI 调用后手动 push：

```ts
history.push({ role: 'user', content: input })
history.push({ role: 'assistant', content: reply })
```

### 为什么不支持流式输出？

目前是等 LLM 完整回复才返回。改成流式需要：

1. `openai.chat.completions.create({ stream: true })`
2. 在回调里不断把 token 发给 CLI
3. CLI 用 `process.stdout.write` 逐字打印

对入门 demo 来说，非流式更简单易读。流式可以作为进阶练习。

---

## 调用链全景

```
src/cli.ts                          ← CLI 交互终端
  └─ runAgent()                     ← src/agent/re-act/re-act.ts（核心引擎）
       ├─ retrieveFaq()             ← src/agent/rag/faq.ts
       ├─ buildMessages()           ← src/prompts/system.ts
       ├─ toOpenAiTools()           ← src/agent/tools/weather-tool.ts
       ├─ openai.chat.completions   ← 调用 LLM API
       ├─ getToolByName()           ← src/agent/tools/weather-tool.ts
       └─ tool.execute()            ← getWeatherTool.execute()
```

---

## 扩展思路

- **多轮 ReAct**：Observe 后检查是否有新的 tool_calls，递归调用 runAgent
- **流式输出**：stream: true，CLI 逐字显示
- **更多工具**：注册到 tools 数组即可自动注入
- **Tool 类型文件合并**：`StepEvent`、`Tool`、`Message` 可统一到 `src/agent/type.ts`
