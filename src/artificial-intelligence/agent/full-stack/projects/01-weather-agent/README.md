# 项目 01：天气 Agent（1.2 最小可调用基线）

一次 SDK 调用收进 `chat.ts`，CLI 与 Hono 都只是最小入口。鉴权、错误码、配置校验不在这里，后续章节再加。

## 目录

```text
src/
├── llm.ts       # 唯一 import 'openai'：complete + stream
├── chat.ts      # core：组织 messages，返回答案或流
├── cli.ts       # CLI 入口
└── server.ts    # Hono：POST /api/chat 流式输出
```

依赖方向：

```text
CLI    ─┐
        ├─→ chat.ts ─→ llm.ts (OpenAI SDK)
Hono   ─┘
```

`chat.ts` 不读 `process.env`，不 import `hono`，也不 import `openai`。

## 安装与配置

```bash
bun install
cp .env.example .env
```

必填：`OPENAI_API_KEY`；可选：`OPENAI_BASE_URL`、`DEFAULT_MODEL`、`PORT`。

## 两个入口

CLI：

```bash
bun run chat "杭州明天要带伞吗？"
```

HTTP（流式）：

```bash
bun run dev
curl -N http://127.0.0.1:8787/api/chat \
  -H 'content-type: application/json' \
  -d '{"message":"杭州明天要带伞吗？"}'
```

响应是 SSE：`event: delta` 逐段返回文本，最后一条是 `event: done`。

## 检查

```bash
bun run check
```

只做 `tsc --noEmit`。测试与验收放在 10.4。

## 后续

- 1.3：加 Prompt 契约与结构化输出。
- 1.4：加 `agent.ts`，用 SDK 的 `tools` 手写 ReAct 循环。
- 鉴权、错误码、配置校验：8.2 / 9.6 / 10.4。
