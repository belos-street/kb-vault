# 项目 01：天气 Agent（1.2 基线 + 1.4 工具循环）

一次 SDK 调用收进 `chat.ts`，工具循环收进 `agent.ts`；CLI 与 Hono 只做最小入口。1.2 的 Zod 校验、API Key 鉴权与统一错误码已经落在这里。

## 目录

```text
src/
├── llm.ts        # 唯一 import 'openai'：complete / stream / chat
├── chat.ts       # core：组织 messages，返回答案或流
├── agent.ts      # core：ReAct 工具循环
├── cli.ts        # CLI：一次性问答
├── agent-cli.ts  # CLI：工具循环
└── server.ts     # Hono：/api/chat 流式 + /api/agent 一次性
```

依赖方向：

```text
CLI / agent-cli / Hono  ──→  chat.ts / agent.ts  ──→  llm.ts (OpenAI SDK)
```

`chat.ts` 与 `agent.ts` 不读 `process.env`，不 import `hono`，也不 import `openai`。

## 安装与配置

```bash
bun install
cp .env.example .env
```

必填：

- `OPENAI_API_KEY`
- `SERVICE_API_KEY`（至少 8 位，用于本地接口鉴权）

可选：`OPENAI_BASE_URL`、`DEFAULT_MODEL`、`LLM_TIMEOUT_MS`、`PORT`。

## CLI

```bash
bun run chat "杭州明天要带伞吗？"
bun run agent "杭州明天要带伞吗？"
```

`chat` 走 `chat.ask`；`agent` 走 `createAgent` 的工具循环。

## HTTP

```bash
bun run dev

# 流式：/api/chat
curl -N http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-secret' \
  -H 'content-type: application/json' \
  -d '{"message":"杭州明天要带伞吗？"}'

# 工具循环：/api/agent
curl http://127.0.0.1:8787/api/agent \
  -H 'authorization: Bearer dev-secret' \
  -H 'content-type: application/json' \
  -d '{"message":"杭州明天要带伞吗？"}'
```

`/api/chat` 返回 SSE：`event: delta` 逐段返回文本，最后一条是 `event: done`；`/api/agent` 返回 `{ "reply": "..." }`。

错误码与失败出口：

| 出口 | code |
|------|------|
| HTTP 401 | `unauthorized` |
| HTTP 400 | `invalid_body` |
| HTTP 422 | `agent_error` |
| `/api/chat` SSE `event: error` | `upstream_error` |
| 启动 | 环境变量不合法：打印字段错误并直接退出 |

## 检查

```bash
bun run check
```

只做 `tsc --noEmit`。测试与验收放在 10.4。

## 状态

- 1.2 已完成：Zod env / body 校验、API Key 鉴权、统一错误码、SSE。
- 1.4 已完成：`ChatMessage` 判别联合、`chat()` 适配、`agent.ts` 工具循环、`/api/agent` 与 `bun run agent`。
