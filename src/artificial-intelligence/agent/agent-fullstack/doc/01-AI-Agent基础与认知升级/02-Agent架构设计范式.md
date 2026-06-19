# 1.2 Agent 架构设计范式

> 理解 AI Agent 的核心架构，掌握从单 Agent 到多 Agent 的设计范式

## 学习目标

- 理解 Agent 的核心组件：LLM + Memory + Tools + Planning
- 掌握 ReAct（Reasoning + Acting）模式
- 深入理解 Function Calling 机制
- 了解 Agent 通信协议与状态管理
- 掌握多 Agent 协作架构设计

---

## 1. Agent 核心组件

### 1.1 什么是 AI Agent

AI Agent 是能够自主感知环境、做出决策、执行行动的智能系统。与传统 LLM 对话不同，Agent 具备：

- **自主性**：能够独立规划和执行任务
- **工具使用**：能够调用外部工具完成任务
- **记忆能力**：能够记住历史交互信息
- **迭代优化**：能够根据结果调整策略

### 1.2 Agent 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agent 架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    LLM      │  │   Memory    │  │    Tools    │        │
│  │  (大脑)     │  │  (记忆)     │  │  (工具)     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │  Planning   │                           │
│                   │  (规划)     │                           │
│                   └──────┬──────┘                           │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │   Action    │                           │
│                   │  (执行)     │                           │
│                   └─────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 LLM（大脑）

LLM 是 Agent 的核心，负责：
- 理解用户意图
- 生成推理过程
- 决定下一步行动
- 生成最终响应

**LLM 在 Agent 中的角色**：
```typescript
interface AgentLLM {
  // 理解任务
  understand(task: string): TaskUnderstanding;
  
  // 推理决策
  reason(context: Context): Decision;
  
  // 生成响应
  generate(decision: Decision): Response;
}
```

### 1.4 Memory（记忆）

Memory 让 Agent 能够记住历史信息，包括：

**短期记忆（Working Memory）**：
- 当前对话上下文
- 任务执行状态
- 中间计算结果

**长期记忆（Long-term Memory）**：
- 用户偏好
- 历史交互记录
- 知识库信息

**记忆管理策略**：
```typescript
interface MemoryManager {
  // 存储记忆
  store(memory: Memory): void;
  
  // 检索记忆
  retrieve(query: string, topK: number): Memory[];
  
  // 压缩记忆
  compress(memories: Memory[]): Summary;
  
  // 遗忘过期记忆
  forget(criteria: ForgettingCriteria): void;
}
```

### 1.5 Tools（工具）

Tools 让 Agent 能够与外部世界交互，包括：

**内置工具**：
- 代码执行器
- 文件读写
- 网络请求

**外部工具**：
- API 调用
- 数据库查询
- 第三方服务

**工具定义**：
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (params: any) => Promise<ToolResult>;
}

// 示例：天气查询工具
const weatherTool: Tool = {
  name: "get_weather",
  description: "获取指定城市的天气信息",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "城市名称" }
    },
    required: ["city"]
  },
  execute: async (params) => {
    const weather = await fetchWeather(params.city);
    return { temperature: weather.temp, condition: weather.condition };
  }
};
```

### 1.6 Planning（规划）

Planning 让 Agent 能够制定执行计划，包括：

**任务分解**：
```typescript
interface TaskPlanner {
  // 分解复杂任务
  decompose(task: Task): SubTask[];
  
  // 制定执行顺序
  sequence(subTasks: SubTask[]): ExecutionPlan;
  
  // 动态调整计划
  replan(currentPlan: ExecutionPlan, feedback: Feedback): ExecutionPlan;
}
```

**规划策略**：
- **前向规划**：从当前状态出发，逐步向前推导
- **后向规划**：从目标状态出发，反向推导步骤
- **分层规划**：将任务分为多个抽象层次

---

## 2. ReAct 模式

### 2.1 什么是 ReAct

ReAct（Reasoning + Acting）是 2022 年提出的 Agent 范式，核心思想是让 LLM 交替进行推理和行动。

**ReAct 循环**：
```
Thought: 我需要查询北京的天气
Action: get_weather(city="北京")
Observation: 北京今天晴，25°C
Thought: 我已经获取到天气信息，可以回答用户了
Answer: 北京今天天气晴朗，温度25°C。
```

### 2.2 ReAct 的优势

**1. 可解释性**：
- 每一步推理过程都是可见的
- 用户可以理解 Agent 的决策逻辑
- 便于调试和优化

**2. 灵活性**：
- 可以根据中间结果调整策略
- 支持动态工具选择
- 处理复杂多步骤任务

**3. 可靠性**：
- 推理过程有迹可循
- 减少幻觉和错误
- 提高任务完成率

### 2.3 ReAct 实现

```typescript
interface ReActAgent {
  // 推理步骤
  thought(context: string): string;
  
  // 行动步骤
  action(thought: string): Action;
  
  // 观察结果
  observation(action: Action): string;
  
  // 主循环
  async run(task: string): Promise<string> {
    let context = task;
    let result = '';
    
    while (!isComplete(result)) {
      const thought = this.thought(context);
      const action = this.action(thought);
      const observation = await this.execute(action);
      
      context = `${context}\nThought: ${thought}\nAction: ${action}\nObservation: ${observation}`;
      result = observation;
    }
    
    return result;
  }
}
```

### 2.4 ReAct 与 Chain-of-Thought 的区别

| 特性 | Chain-of-Thought | ReAct |
|------|------------------|-------|
| 推理方式 | 纯推理 | 推理 + 行动 |
| 工具使用 | 不支持 | 支持 |
| 外部交互 | 不支持 | 支持 |
| 适用场景 | 简单推理任务 | 复杂多步骤任务 |

---

## 3. Function Calling 机制

### 3.1 什么是 Function Calling

Function Calling 是 LLM 调用外部函数的能力。它是 Agent 工具使用的基础。

**工作流程**：
```
1. 用户: "帮我查一下北京的天气"
2. LLM: 决定调用 get_weather 函数，参数为 { city: "北京" }
3. 系统: 执行函数，返回结果
4. LLM: 根据结果生成响应
```

### 3.2 Function Calling 实现

**OpenAI 格式**：
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-5",
  messages: [{ role: "user", content: "北京天气怎么样？" }],
  tools: [{
    type: "function",
    function: {
      name: "get_weather",
      description: "获取指定城市的天气信息",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名称" }
        },
        required: ["city"]
      }
    }
  }]
});

// 检查是否需要调用函数
if (response.choices[0].message.tool_calls) {
  const toolCall = response.choices[0].message.tool_calls[0];
  const result = await executeFunction(toolCall.function.name, 
                                        JSON.parse(toolCall.function.arguments));
  
  // 将结果返回给 LLM
  const finalResponse = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      ...messages,
      response.choices[0].message,
      { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) }
    ]
  });
}
```

### 3.3 Function Calling 最佳实践

**1. 函数定义清晰**：
```typescript
// ✅ 好的定义
{
  name: "search_products",
  description: "搜索商品，支持关键词、价格范围、分类筛选",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "搜索关键词" },
      minPrice: { type: "number", description: "最低价格" },
      maxPrice: { type: "number", description: "最高价格" },
      category: { type: "string", description: "商品分类" }
    }
  }
}

// ❌ 不好的定义
{
  name: "search",
  description: "搜索",
  parameters: { type: "object", properties: {} }
}
```

**2. 错误处理**：
```typescript
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

async function executeTool(name: string, params: any): Promise<ToolResult> {
  try {
    const result = await tools[name].execute(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**3. 并行调用**：
```typescript
// 支持并行调用多个函数
const response = await openai.chat.completions.create({
  model: "gpt-5",
  messages: [{ role: "user", content: "比较北京和上海的天气" }],
  tools: [weatherTool],
  tool_choice: "auto"
});

// LLM 可能返回多个 tool_calls
const toolCalls = response.choices[0].message.tool_calls;
const results = await Promise.all(
  toolCalls.map(call => executeFunction(call.function.name, 
                                        JSON.parse(call.function.arguments)))
);
```

---

## 4. Agent 通信协议与状态管理

### 4.1 Agent 通信协议

在多 Agent 系统中，Agent 之间需要通信协作。

**消息格式**：
```typescript
interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'error' | 'status';
  content: any;
  timestamp: Date;
}
```

**通信模式**：

**1. 同步通信**：
```typescript
const response = await agentA.sendMessage(agentB, {
  type: 'request',
  content: { task: 'analyze_data', data: [...] }
});
```

**2. 异步通信**：
```typescript
agentA.sendMessage(agentB, {
  type: 'request',
  content: { task: 'long_running_task' }
}).then(response => {
  console.log('Task completed:', response);
});
```

**3. 发布/订阅**：
```typescript
// 订阅事件
eventBus.subscribe('task_completed', (event) => {
  console.log('Task completed by:', event.agent);
});

// 发布事件
eventBus.publish('task_completed', { agent: 'agentA', result: '...' });
```

### 4.2 状态管理

**Agent 状态**：
```typescript
interface AgentState {
  id: string;
  status: 'idle' | 'thinking' | 'acting' | 'waiting' | 'error';
  currentTask?: Task;
  memory: Memory;
  context: Context;
}

class StateManager {
  private states: Map<string, AgentState> = new Map();
  
  getState(agentId: string): AgentState {
    return this.states.get(agentId);
  }
  
  updateState(agentId: string, updates: Partial<AgentState>): void {
    const current = this.states.get(agentId);
    this.states.set(agentId, { ...current, ...updates });
  }
}
```

**状态持久化**：
```typescript
interface StatePersistence {
  // 保存状态
  save(state: AgentState): Promise<void>;
  
  // 加载状态
  load(agentId: string): Promise<AgentState>;
  
  // 检查点
  checkpoint(state: AgentState): Promise<string>;
  
  // 恢复到检查点
  restore(checkpointId: string): Promise<AgentState>;
}
```

---

## 5. 多 Agent 协作架构设计

### 5.1 多 Agent 系统的优势

**1. 专业化分工**：
- 每个 Agent 专注于特定领域
- 提高任务完成质量
- 便于维护和优化

**2. 并行处理**：
- 多个 Agent 同时执行任务
- 提高系统吞吐量
- 减少响应时间

**3. 鲁棒性**：
- 单个 Agent 故障不影响整体
- 支持故障转移
- 系统更可靠

### 5.2 多 Agent 架构模式

**1. 主从模式（Master-Slave）**：
```
┌─────────────┐
│   Master    │
│   Agent     │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
┌─────┐  ┌─────┐
│Slave│  │Slave│
│Agent│  │Agent│
└─────┘  └─────┘
```

**特点**：
- Master 负责任务分配和协调
- Slave 负责具体执行
- 简单易实现
- Master 可能成为瓶颈

**2. 对等模式（Peer-to-Peer）**：
```
┌─────┐  ┌─────┐  ┌─────┐
│Agent│◄─►│Agent│◄─►│Agent│
│  A  │  │  B  │  │  C  │
└─────┘  └─────┘  └─────┘
```

**特点**：
- Agent 之间平等协作
- 无单点故障
- 通信复杂度高
- 适合分布式场景

**3. 分层模式（Hierarchical）**：
```
        ┌─────────┐
        │ 顶级    │
        │ Agent   │
        └────┬────┘
       ┌─────┴─────┐
       ▼           ▼
   ┌─────┐     ┌─────┐
   │中层 │     │中层 │
   │Agent│     │Agent│
   └──┬──┘     └──┬──┘
      │           │
   ┌──┴──┐     ┌──┴──┐
   ▼     ▼     ▼     ▼
┌────┐┌────┐┌────┐┌────┐
│底层││底层││底层││底层│
│Agent││Agent││Agent││Agent│
└────┘└────┘└────┘└────┘
```

**特点**：
- 多层管理结构
- 适合复杂任务
- 可扩展性好
- 通信路径长

### 5.3 多 Agent 协作实现

**基于 LangGraph 的多 Agent 系统**：
```typescript
import { StateGraph, END } from '@langchain/langgraph';

// 定义 Agent 状态
interface AgentState {
  task: string;
  results: Map<string, any>;
  currentAgent: string;
  messages: Message[];
}

// 创建 Agent 节点
const researcherNode = async (state: AgentState) => {
  const research = await researcherAgent.execute(state.task);
  return { results: { ...state.results, research } };
};

const writerNode = async (state: AgentState) => {
  const article = await writerAgent.execute(state.results.research);
  return { results: { ...state.results, article } };
};

const reviewerNode = async (state: AgentState) => {
  const review = await reviewerAgent.execute(state.results.article);
  return { results: { ...state.results, review } };
};

// 构建工作流
const workflow = new StateGraph<AgentState>({
  channels: {
    task: null,
    results: null,
    currentAgent: null,
    messages: null
  }
});

// 添加节点
workflow.addNode('researcher', researcherNode);
workflow.addNode('writer', writerNode);
workflow.addNode('reviewer', reviewerNode);

// 定义边
workflow.addEdge('researcher', 'writer');
workflow.addEdge('writer', 'reviewer');
workflow.addEdge('reviewer', END);

// 设置入口
workflow.setEntryPoint('researcher');

// 编译并执行
const app = workflow.compile();
const result = await app.invoke({ task: "写一篇关于 AI Agent 的文章" });
```

### 5.4 多 Agent 通信模式

**1. 请求-响应模式**：
```typescript
class RequestResponseAgent {
  async sendRequest(target: string, request: Request): Promise<Response> {
    const message = {
      id: generateId(),
      from: this.id,
      to: target,
      type: 'request',
      content: request
    };
    
    return await this.messageBus.send(message);
  }
}
```

**2. 广播模式**：
```typescript
class BroadcastAgent {
  async broadcast(message: any): Promise<void> {
    const agents = await this.discoverAgents();
    await Promise.all(
      agents.map(agent => this.sendMessage(agent.id, message))
    );
  }
}
```

**3. 协商模式**：
```typescript
class NegotiationAgent {
  async negotiate(proposal: Proposal): Promise<Agreement> {
    const responses = await this.broadcast({
      type: 'proposal',
      content: proposal
    });
    
    const accepted = responses.filter(r => r.accepted);
    if (accepted.length > responses.length / 2) {
      return { agreed: true, proposal };
    }
    
    return this.reviseProposal(proposal, responses);
  }
}
```

---

## 实践练习

### 练习 1：实现简单的 ReAct Agent

```typescript
// 实现一个能查询天气和时间的 ReAct Agent
class SimpleReActAgent {
  private tools: Map<string, Tool>;
  
  constructor() {
    this.tools = new Map();
    this.tools.set('get_weather', weatherTool);
    this.tools.set('get_time', timeTool);
  }
  
  async run(task: string): Promise<string> {
    let context = `Task: ${task}\n`;
    
    while (true) {
      // 推理
      const thought = await this.think(context);
      context += `Thought: ${thought}\n`;
      
      // 决定行动
      const action = await this.decideAction(thought);
      if (action.type === 'answer') {
        return action.content;
      }
      
      // 执行行动
      const result = await this.executeAction(action);
      context += `Action: ${action.name}(${JSON.stringify(action.params)})\n`;
      context += `Observation: ${JSON.stringify(result)}\n`;
    }
  }
  
  private async think(context: string): Promise<string> {
    // 调用 LLM 进行推理
    return await llm.query(`Based on the context, what should I think?\n${context}`);
  }
  
  private async decideAction(thought: string): Promise<Action> {
    // 根据推理决定行动
    return await llm.query(`What action should I take?\nThought: ${thought}`);
  }
}
```

### 练习 2：实现多 Agent 协作系统

```typescript
// 实现一个研究-写作-审阅的多 Agent 系统
class MultiAgentSystem {
  private researcher: Agent;
  private writer: Agent;
  private reviewer: Agent;
  
  async process(topic: string): Promise<string> {
    // 1. 研究员收集资料
    const research = await this.researcher.execute({
      task: `Research about: ${topic}`,
      tools: ['web_search', 'document_reader']
    });
    
    // 2. 作家撰写文章
    const draft = await this.writer.execute({
      task: `Write an article based on: ${research}`,
      tools: ['text_generator']
    });
    
    // 3. 审阅者检查质量
    const review = await this.reviewer.execute({
      task: `Review and improve: ${draft}`,
      tools: ['grammar_checker', 'fact_checker']
    });
    
    return review;
  }
}
```

---

## 技术对比

### ReAct vs CoT vs AutoGPT

| 特性 | ReAct | CoT | AutoGPT |
|------|-------|-----|---------|
| **推理方式** | 推理+行动交替 | 纯推理链 | 自主规划+执行 |
| **工具使用** | ✅ 支持 | ❌ 不支持 | ✅ 支持 |
| **可解释性** | ✅ 高（有观察反馈） | ⚠️ 中（只有推理过程） | ⚠️ 低（黑盒决策） |
| **灵活性** | ✅ 高（可中途调整） | ❌ 低（一次性推理） | ✅ 高（自主决策） |
| **适用场景** | 需要外部信息的任务 | 纯推理任务 | 复杂多步骤任务 |
| **代表框架** | LangChain Agent | Chain-of-Thought | AutoGPT、BabyAGI |

**选择建议**：
- 需要调用外部工具 → ReAct
- 纯推理任务（如数学证明）→ CoT
- 复杂多步骤任务（如项目管理）→ AutoGPT

### 单 Agent vs 多 Agent 架构

| 特性 | 单 Agent | 多 Agent |
|------|----------|----------|
| **复杂度** | 低 | 高 |
| **可扩展性** | ⚠️ 有限 | ✅ 强 |
| **专业化程度** | 通用型 | 专业型 |
| **调试难度** | 低 | 高 |
| **适用场景** | 简单任务 | 复杂任务 |
| **通信开销** | 无 | 有 |

**选择建议**：
- 任务简单、单一目标 → 单 Agent
- 任务复杂、需要多领域知识 → 多 Agent
- 需要高可用性和容错 → 多 Agent

---

## 面试问答

> **问：ReAct 和 CoT 有什么区别？**
>
> 答：ReAct 是**推理+行动**交替进行，CoT 是**纯推理链**。具体区别：
> 1. ReAct 可以调用外部工具获取信息，CoT 只能基于已有知识推理
> 2. ReAct 有观察反馈机制，可以中途调整策略；CoT 是一次性推理
> 3. ReAct 适合需要外部信息的任务，CoT 适合纯推理任务
>
> 示例：回答"今天北京天气如何"——ReAct 会调用天气 API，CoT 只能基于已有知识猜测。

> **问：如何设计一个可靠的 Agent？**
>
> 答：关键设计原则：
> 1. **工具设计**：工具职责单一、参数明确、有错误处理
> 2. **Prompt 设计**：明确角色、任务、约束条件
> 3. **状态管理**：记录推理过程、工具调用结果、错误信息
> 4. **错误处理**：重试机制、降级策略、用户反馈
> 5. **安全防护**：输入验证、权限控制、敏感信息过滤

> **问：Function Calling 的原理是什么？**
>
> 答：Function Calling 的工作流程：
> 1. 用户定义工具的 JSON Schema（名称、描述、参数）
> 2. 将工具定义和用户问题一起发送给 LLM
> 3. LLM 分析问题，决定是否需要调用工具
> 4. 如果需要，返回工具名称和参数
> 5. 应用层执行工具调用，将结果返回给 LLM
> 6. LLM 基于工具结果生成最终回答

> **问：多 Agent 通信有哪些模式？**
>
> 答：主要有三种模式：
> 1. **请求-响应模式**：Agent A 向 Agent B 发送请求，等待响应
> 2. **广播模式**：Agent A 向所有 Agent 发送消息，无需等待响应
> 3. **协商模式**：多个 Agent 通过提案-投票达成共识
>
> 选择建议：简单任务用请求-响应，通知类用广播，需要共识用协商。

> **问：如何处理 Agent 的死循环问题？**
>
> 答：Agent 可能因为推理错误陷入死循环，解决方案：
> 1. **最大循环次数限制**：设置上限，超过则强制结束
> 2. **状态检测**：检测重复状态，避免重复推理
> 3. **超时机制**：设置时间限制，超时则停止
> 4. **人工干预**：在关键节点引入人工审核
> 5. **回退机制**：检测到异常时回退到上一个正常状态

---

## 实践练习

### 练习 1：实现简单的 ReAct Agent

**要求**：实现一个能查询天气和时间的 ReAct Agent，理解 ReAct 的推理-行动循环。

**提示**：
- 实现 `think`、`decideAction`、`executeAction` 三个核心方法
- 使用 LLM 进行推理和决策
- 需要处理工具调用失败的情况

**预期效果**：
- 输入"今天北京天气如何"，能调用天气工具获取结果
- 输入"现在几点了"，能调用时间工具获取结果
- 输入无法回答的问题，能给出合理的回答

```typescript
// 实现一个能查询天气和时间的 ReAct Agent
interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

interface Action {
  type: 'tool_call' | 'answer';
  name?: string;
  params?: any;
  content: string;
}

class SimpleReActAgent {
  private tools: Map<string, Tool>;
  private maxIterations = 10;
  
  constructor() {
    this.tools = new Map();
    this.tools.set('get_weather', {
      name: 'get_weather',
      description: '获取指定城市的天气信息',
      execute: async (params) => {
        // 模拟天气 API 调用
        return { city: params.city, temperature: 25, weather: '晴' };
      }
    });
    this.tools.set('get_time', {
      name: 'get_time',
      description: '获取当前时间',
      execute: async () => {
        return { time: new Date().toISOString() };
      }
    });
  }
  
  async run(task: string): Promise<string> {
    let context = `Task: ${task}\n`;
    let iterations = 0;
    
    while (iterations < this.maxIterations) {
      iterations++;
      
      // 推理
      const thought = await this.think(context);
      context += `Thought: ${thought}\n`;
      
      // 决定行动
      const action = await this.decideAction(thought);
      
      if (action.type === 'answer') {
        return action.content;
      }
      
      // 执行工具调用
      const tool = this.tools.get(action.name!);
      if (!tool) {
        context += `Error: Tool ${action.name} not found\n`;
        continue;
      }
      
      try {
        const result = await tool.execute(action.params);
        context += `Action: ${action.name}(${JSON.stringify(action.params)})\n`;
        context += `Observation: ${JSON.stringify(result)}\n`;
      } catch (error) {
        context += `Error: ${error}\n`;
      }
    }
    
    return "抱歉，我无法回答这个问题。";
  }
  
  private async think(context: string): Promise<string> {
    // 调用 LLM 进行推理
    // 这里使用模拟实现，实际应调用真实 LLM
    return "我需要分析用户的任务，决定是否需要调用工具。";
  }
  
  private async decideAction(thought: string): Promise<Action> {
    // 根据推理决定行动
    // 这里使用模拟实现，实际应调用真实 LLM
    return { type: 'answer', content: '这是模拟回答' };
  }
}

// 使用示例
const agent = new SimpleReActAgent();
const result = await agent.run("今天北京天气如何");
console.log(result);
```

---

### 练习 2：实现多 Agent 协作系统

**要求**：实现一个研究-写作-审阅的多 Agent 系统，理解多 Agent 协作流程。

**提示**：
- 设计三个专业化 Agent：研究员、作家、审阅者
- 定义清晰的输入输出格式
- 处理 Agent 之间的通信和错误

**预期效果**：
- 输入主题，研究员收集资料
- 基于资料，作家撰写文章
- 审阅者检查质量并提出修改建议
- 最终输出高质量的文章

```typescript
// 实现一个研究-写作-审阅的多 Agent 系统
interface AgentInput {
  task: string;
  tools: string[];
  context?: string;
}

interface AgentOutput {
  result: string;
  metadata?: Record<string, any>;
}

class SpecializedAgent {
  constructor(
    private name: string,
    private role: string,
    private tools: string[]
  ) {}
  
  async execute(input: AgentInput): Promise<AgentOutput> {
    console.log(`${this.name} 开始执行任务: ${input.task}`);
    
    // 这里使用模拟实现，实际应调用真实 LLM
    const result = await this.processTask(input);
    
    return {
      result,
      metadata: { agent: this.name, timestamp: new Date().toISOString() }
    };
  }
  
  private async processTask(input: AgentInput): Promise<string> {
    // 模拟任务处理
    return `[${this.name}] 完成任务: ${input.task}`;
  }
}

class MultiAgentSystem {
  private researcher: SpecializedAgent;
  private writer: SpecializedAgent;
  private reviewer: SpecializedAgent;
  
  constructor() {
    this.researcher = new SpecializedAgent('研究员', '收集和分析资料', ['web_search', 'document_reader']);
    this.writer = new SpecializedAgent('作家', '撰写文章', ['text_generator']);
    this.reviewer = new SpecializedAgent('审阅者', '检查质量', ['grammar_checker', 'fact_checker']);
  }
  
  async process(topic: string): Promise<string> {
    // 1. 研究员收集资料
    const research = await this.researcher.execute({
      task: `研究主题: ${topic}`,
      tools: ['web_search', 'document_reader']
    });
    
    // 2. 作家撰写文章
    const draft = await this.writer.execute({
      task: `基于以下资料撰写文章:\n${research.result}`,
      tools: ['text_generator'],
      context: research.result
    });
    
    // 3. 审阅者检查质量
    const review = await this.reviewer.execute({
      task: `审阅并改进以下文章:\n${draft.result}`,
      tools: ['grammar_checker', 'fact_checker'],
      context: draft.result
    });
    
    return review.result;
  }
}

// 使用示例
const system = new MultiAgentSystem();
const result = await system.process("AI Agent 技术发展趋势");
console.log(result);
```

---

## 总结

**核心要点**：
1. **Agent 核心组件**：LLM + Memory + Tools + Planning
2. **ReAct 模式**：推理与行动交替进行，提高可解释性和灵活性
3. **Function Calling**：LLM 调用外部函数的机制，是工具使用的基础
4. **状态管理**：管理 Agent 的状态和上下文信息
5. **多 Agent 协作**：通过专业化分工和并行处理提高系统能力

**下一步**：
- 学习 Agent 记忆系统设计（1.3）
- 动手实现简单的 ReAct Agent
- 尝试使用 LangChain 构建 Agent

---

*参考资料*：
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Function Calling Guide - OpenAI](https://platform.openai.com/docs/guides/function-calling)
- [LangChain Agent Documentation](https://js.langchain.com/docs/modules/agents/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)