# 01-weather-agent 实现 TODO

按以下顺序逐步实现本项目，每完成一步都可独立运行验证。

## 步骤 1：项目初始化

- [x] 创建 `projects/01-weather-agent/` 目录
- [x] 生成 `package.json`
- [x] 安装依赖：`zod`、`openai`、向量库 `vectra`
- [x] 配置 `tsconfig.json`
- [x] 创建 `.env.example` 环境变量模板

## 步骤 2：定义类型与配置

- [x] 在 `src/agent/types.ts` 中定义 `Message`、`Tool`、`ToolCall`、`WeatherData` 等核心类型
- [x] 在 `src/config.ts` 中读取 `.env` 配置，封装 LLM Provider 选择逻辑
- [x] 使用 Zod 校验环境变量配置

## 步骤 3：实现模拟天气服务

- [x] 在 `src/services/weather.ts` 中创建 Mock 天气数据
- [x] 实现 `getWeather(city: string)` 方法
- [x] 设计常见城市映射（中文名、英文名、别名如"帝都"→"北京"）
- [x] 处理无效城市名异常

## 步骤 4：实现系统 Prompt 与工具定义

- [x] 在 `src/prompts/system.ts` 中编写天气助手角色 Prompt
- [x] 添加 Few-shot 示例（单城市查询、多城市对比、上下文省略）
- [x] 在 `src/agent/tools.ts` 中定义 `get_weather` 工具的 JSON Schema
- [x] 使用 Zod 校验工具调用参数

## 步骤 5：实现 ReAct 循环

- [x] 在 `src/agent/re-act.ts` 中实现 `Think → Act → Observe → Response` 循环
- [x] 让 LLM 决定是否需要调用工具
- [x] 执行工具调用并获取观察结果
- [x] 基于观察结果生成最终回复

## 步骤 6：实现短期记忆

- [x] 在 `src/memory/short-term.ts` 中实现会话历史管理
- [x] 维护多轮对话记录
- [x] 实现上下文省略补全（如"那上海呢？"）
- [x] 设置会话容量上限，自动清理旧消息

## 步骤 7：实现 RAG 天气 FAQ

- [x] 准备 `src/rag/faq-data.json` 天气 FAQ 数据
- [x] 在 `src/rag/indexer.ts` 中将 FAQ 文档切片并向量化
- [x] 在 `src/rag/retriever.ts` 中实现向量检索
- [x] 在 ReAct 循环中集成 FAQ 检索分支

## 步骤 8：实现 CLI 交互

- [x] 在 `src/cli.ts` 中实现交互式命令行
- [x] 读取用户输入并调用 Agent
- [x] 在终端打印 `[思考]`、`[调用]`、`[观察]`、`[回复]` 过程
- [x] 支持 `exit` 命令退出

## 步骤 9：编写测试

- [x] 编写 `test/tools.test.ts`：验证工具参数校验、Mock 天气服务
- [x] 编写 `test/memory.test.ts`：验证上下文补全、历史管理
- [x] 编写 `test/agent.test.ts`：验证 ReAct 循环核心路径

## 步骤 10：运行验证

- [x] 执行 `bun test` 通过所有单元测试
- [ ] 运行 `bun run cli` 进行手动对话测试（需配置 LLM API Key）
- [ ] 测试单城市查询、多城市对比、上下文省略、FAQ 增强四类场景（需手动运行 CLI）
