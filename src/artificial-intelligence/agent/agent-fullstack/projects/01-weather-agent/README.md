# 实战项目 01：构建第一个 TypeScript Agent（天气查询助手）

## 项目概述

构建一个基于 ReAct 模式的**命令行（CLI）天气查询 Agent**，支持自然语言对话式天气查询。用户直接在终端输入问题，Agent 内部通过 Function Calling 调用**模拟天气服务**，并在终端实时展示思考、调用、观察、回复的完整推理过程。

> 本项目为第一阶段收官项目，采用 CLI 形式而非 Web 前端，天气数据也完全使用 Mock 数据，目的是让学习者专注于 Agent 核心机制（ReAct、工具调用、记忆、RAG），避免被外部 API 和前端工程分散注意力。

## 知识点映射

| 文档 | 应用点 |
|------|--------|
| **01-AI/ML 核心概念** | Token 消耗估算（每次查询的 prompt + response token 数）、模型选型决策（选择适合推理+工具调用的模型） |
| **02-Agent 架构设计范式** | **核心应用** — ReAct 模式实现（思考→调用天气服务→观察结果→回复）、Agent 核心四件套（LLM + Memory + Tools + Planning）的完整实现 |
| **03-记忆系统设计** | 短期记忆 — 维护多轮对话中的历史城市查询记录（如"北京呢？"自动补全为"北京天气"）、会话上下文管理 |
| **04-RAG 架构原理** | 轻量级应用 — 天气 FAQ 知识库的向量索引与检索（What/Why/How 类常见问题）、城市别名映射增强（如"帝都"→"北京"） |
| **05-TypeScript+Bun** | **工程基础** — Bun 运行时搭建、TypeScript 类型守卫（WeatherResponse、CityQuery 等类型定义）、Zod 校验（用户输入的参数校验） |
| **06-Prompt Engineering** | 系统 Prompt 设计（天气助手角色定义）、Few-shot 示例（"北京天气怎么样？" → 调用 getWeather("Beijing")）、CoT 处理复合查询（"北京和上海哪个更冷？" → 分别查两地天气再比较） |

## 项目亮点

1. **手写 ReAct 循环**：不依赖 LangChain 的 Agent 框架（如 `createReactAgent` / `AgentExecutor`），使用官方 LLM SDK 自行实现 Think → Act → Observe → Response 循环，深入理解 Agent 核心机制
2. **类型安全**：全程 TypeScript + Zod，从工具参数到天气返回数据都经过类型校验
3. **终端流式输出**：在命令行实时展示 Agent 推理过程（[思考] → [调用] → [观察] → [回复]）
4. **上下文感知**：支持"北京今天多少度？" → "那上海呢？" 这样的省略问法
5. **RAG 知识增强**：通过天气 FAQ 向量库提升对常见问题（如"台风天出门需要注意什么？"）的回答质量

## 技术栈

```
Runtime: Bun 1.2+
Language: TypeScript 5.x
Interface: CLI（命令行交互）
Validation: Zod
LLM: OpenAI 兼容 API（通过 `openai` 官方 SDK 调用 Function Calling，不依赖 LangChain Agent 框架）
Weather Service: Mock 数据（内置模拟天气服务，无需外部 API Key）
Vector Store: HNSWlib / LanceDB（轻量级本地向量库，用于天气 FAQ）
```

## 为什么使用 Mock 天气数据

1. **学习聚焦**：项目的核心是 Agent 机制（ReAct、Function Calling、记忆、RAG），天气数据只是工具调用的载体
2. **零外部依赖**：不需要申请天气 API Key，降低上手门槛，开箱即用
3. **场景可控**：可以设计丰富的 Mock 数据（晴天、暴雨、台风、高温等），方便测试错误处理和多城市对比
4. **成本为零**：不会产生任何 API 调用费用

## 模型选型建议

| 场景 | 推荐模型 | 说明 |
|------|----------|------|
| 默认开发 | GPT-5 | 工具调用稳定，响应速度快 |
| 复杂推理/对比 | GPT-5 Pro / Qwen 3-72B | "北京和上海哪个更冷？" 等比较类问题表现更好 |
| 成本敏感/批量测试 | GPT-4.1 | 成本低，适合高并发测试 |
| 国内访问 | Qwen 3 / DeepSeek V3 | 均提供 OpenAI 兼容接口，中文场景友好 |

## 功能清单

- [x] 单城市天气查询（"北京今天天气怎么样？"）
- [x] 多城市对比查询（"北京和上海哪个更暖和？"）
- [x] 上下文省略查询（"北京呢？" → 基于上轮对话自动补全）
- [x] 终端流式输出（实时展示 Agent 推理过程）
- [x] 天气 FAQ 增强（向量检索常见问题补充回答）
- [x] 错误处理（无效城市名、工具调用异常等）

## 设计预览

```typescript
// ReAct 循环核心流程（伪代码）
async function agentLoop(query: string, history: Message[]) {
  // 1. 思考：分析用户意图，决定调用哪个工具
  const thought = await llm.think(query, history, tools);
  
  if (thought.needsTool) {
    // 2. 行动：调用模拟天气服务
    const weatherData = await callWeatherService(thought.city);
    
    // 3. 观察：将服务结果提供给 LLM
    const response = await llm.observe(weatherData, query);
    return response;
  }
  
  // 4. 直接回复（如问候、闲聊）
  return llm.reply(query);
}
```

### CLI 交互示例

```bash
$ bun run cli

🌤️  天气助手已启动，输入问题开始对话（输入 exit 退出）

> 北京今天天气怎么样？
[思考] 用户想查询北京的天气，需要调用 get_weather 工具
[调用] get_weather({"city": "北京"})
[观察] 北京今天晴，温度 25°C，湿度 45%
[回复] 北京今天天气晴朗，温度 25°C，湿度 45%，适合外出。

> 那上海呢？
[思考] 用户省略了城市，根据上下文推断为上海
[调用] get_weather({"city": "上海"})
[观察] 上海今天多云，温度 22°C，湿度 60%
[回复] 上海今天多云，温度 22°C，湿度 60%，比北京凉快一些。

> 台风天出门需要注意什么？
[思考] 这是一个天气相关的常识问题，先检索 FAQ 知识库
[检索] 找到 3 条相关 FAQ
[回复] 台风天出门建议：避免前往海边、低洼地带；穿戴雨衣而非雨伞；远离广告牌、大树等危险物。

> exit
👋 再见！
```

## 目录结构

```
01-weather-agent/
├── README.md               # 本文件（项目摘要）
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript 配置
├── .env.example            # 环境变量模板
├── src/
│   ├── cli.ts              # CLI 入口：交互式命令行
│   ├── agent/
│   │   ├── reAct.ts        # ReAct 循环核心
│   │   ├── tools.ts        # 工具定义（天气服务调用）
│   │   └── types.ts        # Agent 相关类型定义
│   ├── prompts/
│   │   └── system.ts       # 系统 Prompt 模板
│   ├── services/
│   │   └── weather.ts      # 模拟天气服务
│   ├── memory/
│   │   └── shortTerm.ts    # 短期记忆管理
│   └── rag/
│       ├── indexer.ts      # 天气 FAQ 索引构建
│       ├── retriever.ts    # 向量检索器
│       └── faq-data.json   # 天气 FAQ 原始数据
└── test/
    ├── agent.test.ts       # ReAct 循环单元测试
    ├── tools.test.ts       # 工具调用参数校验测试
    └── memory.test.ts      # 短期记忆上下文补全测试
```

## 错误处理策略

| 异常类型 | 处理策略 |
|----------|----------|
| 无效城市名 | LLM 引导用户"未找到该城市，请检查城市名称是否正确" |
| 工具参数格式错误 | Zod 校验失败，返回具体错误信息 |
| 工具调用异常 | 记录日志，返回友好提示 |
| LLM 调用失败 | 记录日志，返回友好提示 |

## 测试覆盖

| 测试文件 | 覆盖范围 |
|----------|----------|
| `agent.test.ts` | ReAct 循环核心逻辑、单/多城市查询路径 |
| `tools.test.ts` | 天气服务参数校验、Mock 响应、边界场景 |
| `memory.test.ts` | 上下文省略补全、会话历史管理、容量限制 |

## 实现步骤

详细的开发 TODO 和实现步骤请见 [TODO.md](TODO.md)。

## 本地运行

```bash
# 1. 进入项目目录
cd projects/01-weather-agent

# 2. 安装依赖
bun install

# 3. 复制环境变量模板
cp .env.example .env
# 编辑 .env 填入 LLM API Key

# 4. 启动 CLI 交互
bun run cli
```

## .env.example 示例

```env
# LLM API 配置
OPENAI_API_KEY=sk-xxxxxxxx
# 如果使用 OpenAI 兼容的第三方服务（如 OpenRouter、SiliconFlow、本地 vLLM），可配置自定义 Base URL
# OPENAI_BASE_URL=https://api.openai.com/v1

# 默认使用的模型
DEFAULT_MODEL=gpt-5

# 可选：向量库路径
VECTOR_STORE_PATH=./data/vector-store
```

---

> 此项目将第一阶段 6 篇文档的核心概念融会贯通，是理解 Agent 工作机理的最佳起点。
