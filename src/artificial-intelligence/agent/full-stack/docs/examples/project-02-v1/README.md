# 项目 02 v1：客服系统最小收口

把 2.1 createAgent、2.3 工具契约、2.4 多轮状态、2.5 HITL 装进一个可启动的 Hono 服务。

## 安装

```bash
bun install
```

## 无 Key 验收

```bash
bun run demo
```

预期 3 个 PASS：

1. 同一个 `threadId` 的第二轮记住第一轮。
2. FAQ 工具命中，返回退款时效。
3. `refund` 触发 HITL，approve 后继续执行。

## 启动服务

```bash
SERVICE_API_KEY=dev-key \
OPENAI_API_KEY=sk-xxx \
PORT=8787 \
bun run start
```

可选环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `SERVICE_API_KEY` | 无（必填） | 客户端 `Authorization: Bearer <key>` |
| `OPENAI_API_KEY` | 无（必填） | 模型 Key |
| `PRIMARY_MODEL` | `gpt-4o-mini` | 主模型 |
| `FALLBACK_MODEL` | `openai:gpt-4o-mini` | 主模型失败后的 fallback |
| `PORT` | `8787` | 服务端口 |

请求头模拟身份（生产应换成 token / session 解析）：

- `authorization: Bearer dev-key`
- `x-user-id: u_1024`
- `x-role: admin`（`agent` 或 `admin`）
- `x-tenant-id: t_acme`
- `x-trace-id`（可选；不传则服务端生成）

## 调用示例

```bash
# FAQ
curl -s http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-key' \
  -H 'x-role: admin' \
  -H 'x-tenant-id: t_acme' \
  -H 'content-type: application/json' \
  -d '{"threadId":"t1","message":"退款多久到账？"}'

# 触发退款审批（返回 202）
curl -s http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-key' \
  -H 'x-role: admin' \
  -H 'x-tenant-id: t_acme' \
  -H 'content-type: application/json' \
  -d '{"threadId":"t1","message":"退掉 ORD-1024"}'

# 审批通过（同一 threadId）
curl -s http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-key' \
  -H 'x-role: admin' \
  -H 'x-tenant-id: t_acme' \
  -H 'content-type: application/json' \
  -d '{"threadId":"t1","decision":"approve"}'
```

## 错误码

| HTTP | code | 场景 |
|------|------|------|
| 400 | `invalid_input` | 请求体不合法 |
| 401 | `unauthorized` | 缺少 / 错误 API Key |
| 403 | `permission_denied` | 工具权限不足（角色不是 admin） |
| 422 | `max_steps_exceeded` / `schema_unrecoverable` | 业务失败 |
| 429 | `upstream_rate_limited` | 上游限流 |
| 500 | `server_misconfigured` / `internal_error` | 服务配置或未知错误 |
| 502 | `upstream_error` | 上游 5xx / 网络错误 |
| 504 | `upstream_timeout` | 30s 超时 |

## 与 §4.1 验收标准的对应

| 标准 | 落点 |
|------|------|
| 可启动 | 本文的安装与启动命令 |
| 可降级 | `modelRetryMiddleware` + `modelFallbackMiddleware` + 30s `AbortSignal` |
| 可鉴权 | `src/auth.ts` 的 `apiKeyAuth`，身份注入 `userId / role / tenantId` |
| 可追踪 | 响应头 `x-trace-id`，完成/错误日志带 traceId、延迟、token、成本 |
| 可测试 | `bun run demo` 3 个 PASS，假模型不需要 Key |
| 可算账 | 响应 `usage` 返回 input / output token 与示例成本 |

## 边界

- 结构化意图（`responseFormat`）由 2.3 单独覆盖，本示例不纳入。
- 审批 API 只暴露 `approve` / `reject`；`edit` 需要参数编辑 UI，配置见 2.5。
- 成本单价是示例值，生产按当期价目表替换。
- 生产鉴权应从 token / session 解析角色，不要信任客户端 `x-role`。
