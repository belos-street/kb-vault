# AI Agent 全栈工程师养成计划

> 从全栈工程师到企业级 AI Agent 工程师的系统化学习路径

## 学习目标

- 掌握 AI Agent 核心概念与架构设计
- 熟练使用 LangChain.js、LangGraph.js、Vercel AI SDK 等主流框架
- 掌握 Milvus、ElasticSearch、Kubernetes 等后端基础设施
- 具备企业级 Agent 项目开发与部署能力
- 成为能够独立设计和实现复杂 Agent 系统的全栈工程师

## 技术栈

| 类别 | 技术选型 |
|------|----------|
| 运行时 | Bun |
| 后端框架 | Fastify |
| 类型系统 | TypeScript |
| Agent 框架 | LangChain.js、LangGraph.js、Vercel AI SDK |
| Agent 协议 | MCP（Model Context Protocol） |
| 向量数据库 | Milvus |
| 搜索引擎 | ElasticSearch |
| 知识图谱 | Neo4j |
| 关系数据库 | PostgreSQL |
| 缓存 | Redis |
| 容器化 | Docker、Kubernetes |
| 可观测性 | LangSmith、Prometheus、Grafana |

## 前置要求

- 熟悉 TypeScript/JavaScript
- 了解 Bun 运行时
- 基本的 Docker 使用经验
- 了解 RESTful API 设计

---

## 第一阶段：AI Agent 基础与认知升级

### 1.1 AI/ML 核心概念科普
→ [📖 详细文档](doc/01-AI-Agent基础与认知升级/01-AI-ML核心概念科普.md)
- Transformer 架构原理
- Embedding 向量化原理
- Tokenization 与上下文窗口
- 主流大模型对比（GPT、Claude、Gemini、开源模型）
- 模型选型与成本优化策略
- **模型选型决策树**（2026年6月）：
  - 复杂推理任务 → Claude Opus 4.6 / GPT-5 Pro（深度思考模式）
  - 代码生成任务 → Claude Opus 4.6 / Claude Sonnet 4.6（SWE-bench 领先）
  - 多模态任务 → Gemini 3.1 Pro（原生多模态，视频/图像/音频）
  - 长文档分析 → Gemini 3.1 Pro（200万token上下文）/ Claude Opus 4.6（100万token）
  - 成本敏感场景 → GPT-4.1（$1.25/$10 per 1M tokens）/ Claude Haiku 4.5
  - 本地部署需求 → Llama 4 / Qwen 3 / DeepSeek R1

### 1.2 Agent 架构设计范式
→ [📖 详细文档](doc/01-AI-Agent基础与认知升级/02-Agent架构设计范式.md)
- Agent 核心组件：LLM + Memory + Tools + Planning
- ReAct（Reasoning + Acting）模式
- Function Calling 机制深度解析
- Agent 通信协议与状态管理
- 多 Agent 协作架构设计

### 1.3 Agent 记忆系统设计
→ [📖 详细文档](doc/01-AI-Agent基础与认知升级/03-Agent记忆系统设计.md)
- 短期记忆：会话上下文管理
- 长期记忆：Mem0 分层记忆架构
- 三路召回：向量检索 + 关键词检索 + 图谱检索
- 记忆压缩与摘要策略
- Redis 短期记忆存储最佳实践

### 1.4 RAG 架构原理与实践
→ [📖 详细文档](doc/01-AI-Agent基础与认知升级/04-RAG架构原理与实践.md)
- RAG（Retrieval-Augmented Generation）核心原理
- RAG 架构：Indexing → Retrieval → Generation
- 文档加载与分割策略
- 向量化与 Embedding 选择
- 检索增强与上下文窗口管理
- RAG 评估指标（Faithfulness、Relevancy、Context Precision）

### 1.5 TypeScript + Bun 在 AI 领域的应用
→ [📖 详细文档](doc/01-AI-Agent基础与认知升级/05-TypeScript-Bun在AI领域的应用.md)
- Bun 运行时优势与性能对比
- TypeScript 类型系统在 Agent 开发中的优势
- Zod Schema 与 Agent 参数校验
- Fastify 框架快速入门
- 类型安全的 Agent 工具链设计

### 1.6 Prompt Engineering 系统讲解
→ [📖 详细文档](doc/01-AI-Agent基础与认知升级/06-Prompt-Engineering系统讲解.md)
- Prompt 设计原则与最佳实践
- Few-shot Learning 与示例选择策略
- Chain-of-Thought（CoT）思维链推理
- Tree-of-Thought（ToT）树状思维推理
- Self-Consistency 自一致性策略
- Prompt 模板化与版本管理
- Prompt 注入攻击防护基础

**实战项目 01**：构建第一个 TypeScript Agent（天气查询助手） → [📁 项目源码](projects/01-weather-agent/README.md)

---

## 第二阶段：LangChain.js 生态深度掌握

### 2.1 LangChain.js 架构概览
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/01-LangChain.js架构概览.md)
- LangChain.js v1.0+ 设计哲学：Model + Harness
- 包生态全景图：`langchain` / `@langchain/core` / `@langchain/langgraph` / `deepagents`
- 与 Python 版的关键区别
- 安装与项目初始化
- `createAgent` 快速体验：最小的 Agent 示例
- LangSmith 链路追踪快速集成

### 2.2 模型与消息系统
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/02-模型与消息系统.md)
- `initChatModel` 模型初始化与多 Provider 支持（OpenAI / Anthropic / Google / Ollama）
- 消息类型体系：HumanMessage / AIMessage / ToolMessage / SystemMessage
- `content_blocks` 响应结构详解（文本、图片、工具调用）
- 流式输出（`streamEvents`）与实时响应
- 模型参数：temperature / maxTokens / timeout

### 2.3 工具系统
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/03-工具系统.md)
- 内置工具集使用
- 自定义工具开发（`tool()` + Zod Schema）
- 工具入参校验与类型安全
- 工具组合与编排
- Runtime Context：工具如何访问用户上下文（用户 ID、API Key 等）
- 工具安全性与权限控制

### 2.4 Agent 构建与配置
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md)
- `createAgent` 完整配置项解析
- systemPrompt 设计原则与优化技巧
- Structured Output（`responseFormat` + Zod Schema）
- Agent 调用模式：`invoke` / `streamEvents`
- Agent 状态管理与 Thread ID
- 对话上下文管理策略

### 2.5 记忆与状态管理
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/05-记忆与状态管理.md)
- `MemorySaver` 会话记忆管理
- 持久化 Checkpointer（数据库级）
- 对话状态管理与恢复
- 上下文窗口与 Token 管理策略
- 长期记忆插件的概念与预览

### 2.6 中间件系统
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/06-中间件系统.md)
- Middleware 架构设计：在 Agent 循环中插入行为
- 内置 Middleware 使用：
  - `todoListMiddleware`：任务规划与追踪
  - `modelRetryMiddleware` / `toolRetryMiddleware`：错误处理与重试
  - `piiMiddleware`：敏感信息过滤
  - `humanInTheLoopMiddleware`：人工审批与干预
- 并发控制与速率限制
- 自定义 Middleware 开发

### 2.7 LangSmith 链路追踪
→ [📖 详细文档](doc/02-LangChain.js生态深度掌握/07-LangSmith链路追踪.md)
- Tracing 快速集成（环境变量配置）
- Trace 分析：工具调用、Token 消耗、延迟
- 调试 Agent 行为与失败定位
- 评估与回归测试
- Prompt 版本管理

**实战项目 02**：智能客服系统（基础版）
- 多轮对话管理（利用 Checkpointer 实现会话持久化）
- 意图识别与槽位填充（利用 Structured Output 规范化输出）
- 知识库集成与实时检索（Tool + RAG 模式）
- 工单系统与人工转接（Human-in-the-Loop 实战）
- 对话质量评估与优化（LangSmith 评估集成）

---

## 第三阶段：LangGraph.js 复杂工作流编排与多 Agent 协作

### 3.1 LangGraph 核心概念
- 图（Graph）与节点（Node）设计
- 状态（State）管理机制
- 条件路由与分支逻辑
- 循环与递归控制

### 3.2 LangGraph 高级模式
- 人机协作（Human-in-the-Loop）
- 子图嵌套与模块化
- 并行执行与异步处理
- 检查点与状态持久化

### 3.3 Agentic RAG 实现
- Agentic RAG 核心概念
- 基于 LangGraph 的自主决策 RAG
- 检索策略动态选择
- 多轮检索与迭代优化
- 自我反思与纠错机制

### 3.4 多 Agent 编排
- 多 Agent 协作模式：Supervisor / Hierarchical / Peer-to-Peer
- 任务分解与子 Agent 委派
- 上下文传递与隔离策略
- Agent 间通信与结果聚合
- 冲突解决与一致性保证
- 多 Agent 调试与追踪

### 3.5 MCP（Model Context Protocol）开发
- MCP 协议核心概念与架构（Server / Client / Transport）
- MCP Server 开发（TypeScript SDK）
- MCP Client 集成与工具注册
- MCP 与 LangChain 工具系统的关系
- 自定义 MCP Server 实战（文件系统、数据库、API 网关）
- MCP 生态与社区工具

### 3.6 DeepAgents 框架实践
→ [📖 详细文档](doc/03-LangGraph.js复杂工作流编排/05-DeepAgents框架.md)
- DeepAgents 定位：基于 LangChain + LangGraph 的开箱即用 Agent 框架
- 虚拟文件系统（`ls` / `read_file` / `write_file` / `edit_file`）
- 子 Agent 委派与上下文隔离
- 自动上下文压缩与摘要
- Shell 执行与沙箱隔离（Sandbox Backend）
- 可插拔文件系统后端
- 声明式文件权限控制
- 技能系统（Skills）与可复用工作流
- 人类介入（Human-in-the-Loop）
- 与 LangChain Agent / LangGraph 的选型对比

### 3.7 LangGraph 企业级实践
- 复杂业务流程建模
- 错误处理与恢复机制
- LLM 调用容错（限流、降级、Fallback 模型链）
- 性能监控与调试技巧
- 多 Agent 编排最佳实践

**实战项目 03**：数据分析助手（多 Agent 协作版）
- 自然语言转 SQL
- 数据可视化生成
- 多数据源集成
- 多 Agent 协作：SQL Agent + 可视化 Agent + 报告 Agent
- 定时报表与预警
- 数据安全与权限控制

---

## 第四阶段：向量数据库与检索系统

### 4.1 Milvus 向量数据库
- Milvus 架构与核心概念
- Collection 设计与索引优化
- 向量相似度搜索算法
- 多向量字段与混合检索
- **向量数据库选型决策树**：
  - 大规模生产环境 → Milvus（分布式、高可用）
  - 云原生快速部署 → Pinecone（全托管、零运维）
  - 开源轻量级 → Qdrant / Weaviate（单机易用）
  - 与 LangChain 生态集成 → Milvus / Pinecone（官方集成完善）
  - 本地开发测试 → Chroma（零配置、SQLite 存储）

### 4.2 ElasticSearch 搜索引擎
- ES 核心概念与架构
- 索引设计与映射策略
- 全文检索与向量检索融合
- 聚合分析与数据洞察

### 4.3 高级检索策略
- 混合检索（Hybrid Search）实现
- 重排序（Reranking）技术
- 查询改写与扩展
- 检索评估与优化

### 4.4 Neo4j 知识图谱与 Graph RAG
- Neo4j 核心概念与 Cypher 查询语言
- 知识图谱构建流程
- 实体识别与关系抽取
- Graph RAG 架构与实现
- 图数据库与向量数据库融合检索
- 知识图谱可视化与探索

### 4.5 Embedding 技术深度实践
- 主流 Embedding 模型对比
- 自定义微调 Embedding
- 多语言 Embedding 方案
- Embedding 缓存与更新策略

**实战项目 04**：企业级知识库系统
- 多格式文档解析（PDF、Word、Excel、PPT）
- 知识图谱构建与应用
- 权限管理与数据隔离
- 知识库版本管理
- 智能推荐与个性化
→ [📁 项目文档](projects/04-kb-agent/README.md)

---

## 第五阶段：Vercel AI SDK 前端集成

### 5.1 Vercel AI SDK 核心功能
- useChat Hook 深度解析
- useCompletion Hook 应用场景
- 流式 UI 渲染优化
- Edge Runtime 与 Serverless 部署

### 5.2 AGUI 协议与流式组件渲染
- AGUI 协议核心概念
- Vercel AI SDK + LangChain 集成
- 流式组件渲染实现
- 实时状态同步与更新
- 自定义流式 UI 组件开发

### 5.3 AI SDK 高级应用
- 多模态交互（文本、图片、音频）
- 实时协作与共享会话
- 自定义 Provider 集成

### 5.4 前端 Agent UI 设计
- 对话式界面设计原则
- 思维链可视化展示
- 工具调用过程展示
- 错误状态与降级体验

**实战项目 05**：实时协作式 AI 写作助手

---

## 第六阶段：后端基础设施与 DevOps

### 6.1 Docker 容器化
- Dockerfile 最佳实践（Bun 运行时）
- 多阶段构建优化
- Docker Compose 编排完整 Agent 服务栈（App + Milvus + ES + Redis + PostgreSQL）
- 容器安全与镜像扫描

### 6.2 部署与运维
- 云平台 Serverless 部署（Vercel / Fly.io / Railway）
- Kubernetes 核心概念（Pod、Service、Deployment，能读懂 YAML 即可）
- ConfigMap 与 Secret 管理
- CI/CD 流水线（GitHub Actions）

### 6.3 Agent 服务架构
- 微服务架构设计
- 服务发现与注册
- 配置中心与动态更新
- 日志收集与链路追踪

### 6.4 数据库与缓存
- PostgreSQL 高级特性（JSONB、全文检索）
- Redis 缓存策略与会话管理
- 数据库连接池与性能优化
- 数据备份与恢复策略

**实战项目 06**：自动化工作流平台
- 工作流定义与执行
- 定时任务与事件触发
- 第三方 API 集成
- 审批流程与权限管理
- 任务队列与并发控制
- 任务失败重试与补偿

---

## 第七阶段：可观测性、评估与测试

### 7.1 LangSmith 全链路观测
- Agent 调试与 Trace 追踪
- RAG 量化评估（Ragas 集成）
- Prompt 版本管理与 A/B 测试
- 生产环境监控与告警
- 成本分析与优化建议

### 7.2 Agent 测试策略
- LLM 调用 Mock 与单元测试
- Agent 集成测试（固定输入 → 断言输出结构）
- E2E 测试与回归测试
- 评估数据集构建与管理
- 持续集成中的 Agent 测试

### 7.3 Agent 评估框架
- Agent 效果评估方法论
- 任务完成率与准确率指标
- 用户满意度评估（CSAT、NPS）
- A/B 测试框架设计
- Multi-Agent 评估策略

### 7.4 性能优化
- LLM 调用优化（缓存、批处理、流式）
- Token 工程（精确计算、动态截断、多轮对话窗口管理）
- 向量检索性能调优
- Bun 运行时性能优化
- Fastify 高性能配置

### 7.5 可观测性建设
- 日志规范与结构化日志
- 指标监控（Prometheus + Grafana）
- 链路追踪（Jaeger/Zipkin）
- 告警规则与通知机制

### 7.6 成本控制
- Token 使用量监控
- 模型调用成本优化
- 模型版本管理与灰度发布
- 成本分摊与预算管理

**实战项目 07**：Agent 系统监控与评估平台（集成 LangSmith）

---

## 第八阶段：安全与合规

### 8.1 Agent 安全防护
- Prompt 注入攻击防护
- 工具调用权限控制
- 输出内容安全过滤
- 敏感信息脱敏处理

### 8.2 数据安全与隐私
- 数据加密存储与传输
- 用户数据脱敏
- GDPR/CCPA 合规实践
- 数据生命周期管理

### 8.3 系统安全加固
- API 网关与限流
- 身份认证与授权（JWT、OAuth2）
- 网络安全与防火墙
- 安全审计与日志

### 8.4 OWASP LLM Top 10 安全风险
- LLM01: Prompt 注入攻击详解
- LLM02: 不安全的输出处理
- LLM03: 训练数据投毒
- LLM04: 模型拒绝服务攻击
- LLM05: 供应链漏洞
- LLM06: 敏感信息泄露
- LLM07: 不安全的插件设计
- LLM08: 过度授权
- LLM09: 过度依赖
- LLM10: 模型窃取

**实战项目 08**：安全加固版智能客服系统（基于项目 02，集成完整安全防护）

---

## 第九阶段：前沿技术与生态扩展

### 9.1 多模态 Agent
- 图像理解与生成
- 语音交互集成（ASR + 流式 TTS）
- 视频分析能力
- 多模态融合策略

### 9.2 语音交互系统
- ASR（自动语音识别）技术
- 流式 TTS（文本转语音）实现
- 语音对话系统设计
- 实时语音交互优化

### 9.3 自主 Agent
- AutoGPT 架构分析
- 自主规划与执行
- 目标分解与任务调度
- 自我反思与改进

### 9.4 Agent 生态与标准
- Agent 互操作性标准
- 开源 Agent 框架对比
- 社区贡献与技术影响力

**实战项目 09**：多模态自主 Agent 系统（支持语音交互）

---

## 学习路径建议

### 时间规划（总计约 6-8 个月）
- 第一阶段：3-4 周（基础认知 + Prompt Engineering）
- 第二阶段：4-5 周（LangChain + 智能客服实战）
- 第三阶段：4-5 周（LangGraph + 多 Agent + MCP + 数据分析助手实战）
- 第四阶段：4-5 周（向量数据库 + 知识库系统实战）
- 第五阶段：1-2 周（Vercel AI SDK，有前端基础可加速）
- 第六阶段：3-4 周（后端基础设施 + 自动化工作流实战）
- 第七阶段：3-4 周（可观测性 + 评估测试 + 监控平台实战）
- 第八阶段：3-4 周（安全合规 + 安全加固实战）
- 第九阶段：3-4 周（前沿技术）

### 学习方法
1. **理论与实践结合**：每学完一个模块立即进行实战项目
2. **代码优先**：所有示例代码都要亲手敲一遍
3. **项目驱动**：以实战项目为核心，倒逼知识点学习
4. **社区参与**：积极参与开源项目，积累技术影响力
5. **持续输出**：写技术博客、做技术分享，巩固学习成果

### 推荐资源
- 官方文档：LangChain.js、LangGraph.js、Vercel AI SDK
- 论文阅读：Attention Is All You Need、ReAct、Toolformer
- 开源项目：Dify、FastGPT、Langflow
- 技术社区：GitHub、Hacker News、AI 技术论坛

---

## 技能树总览

```
AI Agent 全栈工程师
├── 基础层
│   ├── AI/ML 核心概念
│   ├── RAG 架构原理
│   ├── Agent 架构设计
│   ├── Agent 记忆系统（Mem0）
│   ├── Prompt Engineering（CoT/ToT/Few-shot）
│   └── TypeScript + Bun + Fastify
├── 框架层
│   ├── LangChain.js
│   ├── LangGraph.js
│   ├── DeepAgents
│   ├── MCP 协议开发
│   └── Vercel AI SDK + AGUI
├── 数据层
│   ├── Milvus 向量数据库
│   ├── ElasticSearch
│   ├── Neo4j 知识图谱
│   └── PostgreSQL/Redis
├── 基础设施层
│   ├── Docker 容器化
│   ├── Serverless / K8s 基础
│   └── CI/CD 流水线
├── 可观测性层
│   ├── LangSmith 全链路观测
│   ├── Agent 测试与评估框架
│   ├── Prometheus + Grafana
│   └── 链路追踪与日志
├── 项目层
│   ├── 智能客服系统
│   ├── 数据分析助手（多 Agent）
│   ├── 企业级知识库
│   ├── 自动化工作流
│   └── 实时协作 AI 写作
└── 进阶层
    ├── 性能优化与 Token 工程
    ├── 安全合规（OWASP LLM Top 10）
    ├── 语音交互（ASR + TTS）
    └── 多模态与自主 Agent
```

---

## 企业级 Agent 工程师核心能力

1. **架构设计能力**：能够设计可扩展、高可用的 Agent 系统架构
2. **框架精通能力**：熟练使用主流 Agent 框架，理解其设计哲学
3. **工程化能力**：具备完整的 DevOps 能力，从开发到部署全流程
4. **业务理解能力**：能够将业务需求转化为 Agent 解决方案
5. **问题解决能力**：能够快速定位和解决复杂技术问题
6. **持续学习能力**：跟踪前沿技术，保持技术敏感度

---

*本大纲持续更新，根据技术发展和行业需求动态调整*