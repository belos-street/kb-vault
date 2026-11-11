# 项目 01：天气 Agent（1.2 服务基线）

这是项目 01 的第一步：先把 1.1 的裸调用包成可运行的服务。1.3 会加 Prompt 契约，1.4 会把 `callModel` 换成 ReAct + weather 工具，最终合成天气 Agent。

## 目录

```text
src/
├── agents/chat.ts        # 只负责调用模型
├── services/chat.ts      # 超时、错误映射
├── routes/chat.ts        # /api/chat：校验 + 响应
├── routes/chat-stream.ts # /api/chat/stream：meta / delta / done
├── middleware/auth.ts    # API Key 最小鉴权
├── lib/errors.ts         # AppError 与状态码
├── server.ts             # 组装根
└── acceptance.ts         # 1.2 的 4 条验收
```

## 安装与配置

```bash
bun install
cp .env.example .env
```

至少填：

```bash
LLM_API_KEY=sk-xxx
SERVICE_API_KEY=dev-key
```

## 运行

```bash
bun run dev
# 或
bun run start
```

## 验收

```bash
bun run check
```

会跑 `tsc --noEmit` 和 4 条验收：

1. 非法入参返回 400 `invalid_input`。
2. 无 API Key 返回 401。
3. SSE 按 `meta → delta → done` 输出。
4. 上游超时映射为 504 `upstream_timeout`。

## 手动调用

```bash
curl -s http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-key' \
  -H 'content-type: application/json' \
  -d '{"threadId":"t1","message":"杭州明天要带伞吗？"}'

curl -N http://127.0.0.1:8787/api/chat/stream \
  -H 'authorization: Bearer dev-key' \
  -H 'content-type: application/json' \
  -d '{"threadId":"t1","message":"杭州明天要带伞吗？"}'
```

## 下一讲接什么

- 1.3：在 `services/chat.ts` 上增加 Prompt 契约 / 结构化输出，route 不变。
- 1.4：把 `agents/chat.ts` 的内部实现换成 ReAct 循环 + weather 工具，`callModel({ messages, signal })` 的接口尽量保持稳定。
