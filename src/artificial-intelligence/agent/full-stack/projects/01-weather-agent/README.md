# 项目 01：天气 Agent（1.2 解耦基线）

用 OpenAI SDK 调模型，把「模型调用」收进 core：CLI 和 HTTP 共用同一个 `ask()`，后端只做适配。

## 目录

```text
src/
├── config.ts             # Zod 校验 env，只在组装根使用
├── llm/
│   ├── types.ts          # ChatMessage / LlmReply / LlmClient
│   └── openai.ts         # 唯一 import 'openai' 的文件
├── services/chat.ts      # createChatService(deps)：纯用例
├── routes/chat.ts        # POST /api/chat：校验 + 序列化
├── middleware/auth.ts    # API Key 鉴权
├── lib/errors.ts         # AppError
├── app.ts                # createApp(deps)：Hono 适配层
├── cli.ts                # CLI 入口
└── server.ts             # HTTP 组装根
```

依赖方向：

```text
CLI  ─┐
      ├─→ services/chat.ts ─→ llm/types.ts ←─ llm/openai.ts (OpenAI SDK)
HTTP ─┘
```

`services/chat.ts` 不读 `process.env`，不 import `hono`，也不 import `openai`；换入口、换 SDK 都不影响它。

## 安装与配置

```bash
bun install
cp .env.example .env
```

必填：`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`DEFAULT_MODEL`、`SERVICE_API_KEY`。

## 两个入口

CLI：

```bash
bun run chat "杭州明天要带伞吗？"
```

HTTP：

```bash
bun run dev
curl -s http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-key' \
  -H 'content-type: application/json' \
  -d '{"threadId":"t1","message":"杭州明天要带伞吗？"}'
```

两个入口调用的是同一个 `ask()`，Prompt、超时、错误映射只在 core 里维护一份。

## 验收

```bash
bun run check
```

包含 `tsc --noEmit`、单元测试和 5 条验收：

1. CLI/core 与 `/api/chat` 返回同一个结果。
2. 非法入参 400 `invalid_input`。
3. 无 API Key 401。
4. `AppError` 映射为 504 `upstream_timeout`。
5. 缺少必填环境变量时启动即失败。

验收不启动端口，也不调用真实 LLM：注入 fake `LlmClient` 即可。

## 后续

- 1.3：在 `services/` 下加 Prompt 契约与结构化输出。
- 1.4：新增 `services/agent.ts`，用 SDK 的 `tools` 手写 ReAct 循环；CLI 和 HTTP 继续共用同一个 core。
