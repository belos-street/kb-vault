# 知识库 Agent 系统 — 学习 Todo

> 对应需求文档：[README.md](README.md)（下文以「R5/R6.2」等引用章节）
> 大纲文档：`doc/01-AI-Agent基础与认知升级/04-RAG架构原理与实践.md`（RAG 理论）、`doc/02-LangChain.js生态深度掌握/01/02`（框架用法）；大纲「4.3 高级检索策略」为 RRF/检索优化参考
> 学习方式：按 Phase 顺序推进，每步先读对应章节，再动手实现，最后跑验证。

---

## ⚠️ 动手前必读（已踩坑结论，遇到同名坑不要重复踩）

| # | 坑 | 结论 | 出处 |
| --- | --- | --- | --- |
| 1 | Qdrant point id 合法性 | 只接受 **uint64 或标准 UUID**，cuid / `chunk_1` 等字符串**不合法**。`DocumentChunk.id` 用 `@default(uuid())`；`Document.id` 仅 PG 内部用可保持 cuid | R5 |
| 2 | pg_trgm 中文 2 字查询 | GIN 索引只对 **≥3 字符**查询生效；**2 字中文词 `%词%`（如「扫描」）不走索引，退化为全表扫描**。chunk 万级以下可接受；万级以上需切 3 字关键词 / 引入 ES（大纲 4.2） | R6.2 |
| 3 | Prisma 7 + Bun | Rust-free 客户端：generator `provider = "prisma-client"` 且 **output 必填**；datasource **url 移入 `prisma.config.ts`**；配 `@prisma/adapter-pg` driver adapter；命令用 `bunx --bun prisma` | R5 关键说明 4 |
| 4 | pg_trgm 扩展与 GIN 索引 | Prisma 不支持扩展 / GIN 索引，需 **migration 生成后手写 SQL** 追加（`CREATE EXTENSION` + `CREATE INDEX ... gin (content gin_trgm_ops)`） | R6.2 |
| 5 | bge-m3 维度 | 经 Ollama OpenAI 兼容接口 `/v1/embeddings`，**1024 维**，Qdrant collection 创建时维度必须一致（不一致 upsert 报错） | R6.1 伪代码 |
| 6 | keyword 整句 ILIKE 零命中 | 拿整句直接 `ILIKE '%整句%'` 命中率约等于 0；**必须先关键词提取**（切词 → 去停用词 → 保专名）再逐个检索 | R6.2 |

---

## Phase 0：环境准备

> 对应 README「三 技术栈选型」「四 目录结构」「七 package.json」。

- [ ] `bun init` 初始化工程，按 R4 目录结构建骨架（`src/entry/web/`、`src/service/document|sync|retrieval|agent`、`src/repository`、`src/embedding`、`src/config`、`src/types`、`docs/`、`scripts/`）
- [ ] 安装依赖（R7）：`langchain` `@langchain/core` `@langchain/textsplitters` `@langchain/openai` `@langchain/deepseek` `@prisma/client` `@prisma/adapter-pg` `@qdrant/js-client-rest` `dotenv` `hono` `@hono/cors` `zod`；dev：`prisma` `@types/bun` `typescript` `vitest`
  - ⚠️ 本期裁剪 CLI：**不装** `commander` / `@inquirer/prompts`（R7 保留为远期设计，见 README 1.1 / 十 决策 8）
- [ ] 复制 `.env.example` → `.env`：`DATABASE_URL`（PG16）、`QDRANT_URL`、`LLM_API_KEY`（DeepSeek）、`EMBEDDING_BASE_URL`（Ollama `http://localhost:11434/v1`）、`EMBEDDING_MODEL=bge-m3`、`CORS_ORIGIN=http://localhost:5173`、`AUTH_ENABLED=false`
- [ ] 起本地依赖：Docker 跑 **PostgreSQL 16** + **Qdrant**（镜像 `qdrant/qdrant`，映射 6333/6334）；`ollama pull bge-m3`
- [ ] `tsconfig.json`：`strict`、`moduleResolution: bundler`、`target: ES2022+`

**验证**：`bunx --bun prisma -v` 正常；`curl localhost:6333` 返回 Qdrant 信息；Ollama `/v1/embeddings` 冒烟返回 1024 维向量。

---

## Phase 1：P0 骨架（建库 + scripts 运维脚本）

> 对应 README「九 P0」验收标准：`npm run init` 建表成功。

### 1.1 配置层 `src/config/env.ts` ✅

**目标**：环境变量 zod 校验，导出类型化 `env`。

**关键产出**：
- `z.object` 定义 `DATABASE_URL / QDRANT_URL / LLM_API_KEY / EMBEDDING_BASE_URL / EMBEDDING_MODEL / CORS_ORIGIN / AUTH_ENABLED`
- 解析失败给出明确错误（缺哪个变量一目了然）

**验证**：缺 `DATABASE_URL` 启动时报错信息清晰。

### 1.2 Prisma Schema + 迁移 `prisma/schema.prisma`

**目标**：三张表（R5 照抄）：`Document`、`DocumentChunk`、`SyncRun`。

**关键产出**：
- generator：`provider = "prisma-client"`，`output = "../src/generated/prisma"`（⚠️ 坑 3）
- datasource：仅 `provider = "postgresql"`，**url 留空**（移入 prisma.config.ts）
- `DocumentChunk`：`id @default(uuid())`（⚠️ 坑 1）、`@@unique([documentId, chunkIndex])`、`@@index([path])`、`@@index([contentHash])`、`@@index([content])`
- `prisma.config.ts`：datasource url + driver adapter

**API 提示**：
- `bunx --bun prisma migrate dev --name init` 生成迁移
- ⚠️ 迁移生成后**手写 SQL 追加**（⚠️ 坑 4）：`CREATE EXTENSION IF NOT EXISTS pg_trgm;` + `CREATE INDEX idx_chunk_content_trgm ON "DocumentChunk" USING gin (content gin_trgm_ops);`（可放同一迁移文件底部，或拆新 migration）

**验证**：`npm run init` 或 `bunx --bun prisma migrate dev` 成功，`\d "DocumentChunk"` 能看到 content 的 gin 索引。

### 1.3 Qdrant 客户端 `src/repository/qdrant.ts`

**目标**：封装 QdrantClient + ensureCollection。

**关键产出**：
- `new QdrantClient({ url: env.QDRANT_URL })`（`@qdrant/js-client-rest`）
- `ensureCollection("kb_chunks")`：不存在则 create，**向量维度 1024、距离 cosine**（⚠️ 坑 5）；存在但维度不符时先删除重建

**验证**：启动后 collection 出现且维度 1024。

### 1.4 运维脚本 `scripts/`（原 CLI，本期裁剪后形态）

**目标**：建库与同步触发入口。本期**不做问答类 CLI**（裁剪理由见 README 1.1 / 十 决策 8），运维触发改极简脚本。

**关键产出**：
- `scripts/init.ts`：建 schema + collection + 全量索引
- `scripts/sync.ts`：全量重建（发布后手动跑）
- `scripts/status.ts`：读 SyncRun 最近一行并打印统计
- package.json scripts：`"init": "bun run scripts/init.ts"`、`"sync": "bun run scripts/sync.ts"`、`"status": "bun run scripts/status.ts"`

**验证**：`bun run scripts/status.ts` 正常执行输出统计（或提示无记录）。

---

## Phase 2：P1 文档管线（全量重建同步）

> 对应 README「6.1 SyncService」伪代码 +「6.3 分块策略」。验收：指定目录全量索引成功；改文件后 `npm run sync` 结果与文件系统一致。

### 2.1 文档加载 `src/service/document/loader.ts`

**目标**：扫描并加载 markdown 源。

**关键产出**：
- 按 glob `**/*.md` 遍历文档根目录（可用 `Bun.Glob` 或 `fast-glob`）
- 排除 `node_modules`、`.git` 等；返回相对路径列表（path 即 Document.path 唯一标识）

**验证**：对准测试文档目录（5-10 个 md）能列全。

### 2.2 分块 `src/service/document/chunker.ts`

**目标**：标题层级分块 + 字符兜底。

**关键产出**：
- 主：`MarkdownHeaderTextSplitter` 按标题分块，**标题路径写入 metadata（titles 数组）**（上下文完整 + 可溯源）
- 兜底：`RecursiveCharacterTextSplitter({ chunkSize: 800, overlap: 80 })`

**API 提示**：`@langchain/textsplitters`；对照 [RAG 文档](../../doc/01-AI-Agent基础与认知升级/04-RAG架构原理与实践.md) 分块章节与 R6.3 分块策略。

**验证**：带多级标题的 md 分块后 `metadata.titles` 正确、超长无标题文档落到兜底。

### 2.3 Embedding Provider `src/embedding/`

**目标**：可插拔 Embedding 抽象（R6.3 分块策略末条）。

**关键产出**：
- `EmbeddingProvider` 接口：`embed(texts: string[]): Promise<number[][]>`
- `OllamaEmbedding` 实现：`@langchain/openai` OpenAI 兼容（`baseURL = EMBEDDING_BASE_URL`、`model = bge-m3`）→ 1024 维（⚠️ 坑 5）

**验证**：单条文本返回 1024 维向量。

### 2.4 文档管线 `src/service/document/pipeline.ts`

**目标**：DocumentService 串联 加载 → 分块 → Embedding。

**关键产出**：
- 逐文件：加载 → 分块 → 计算 `contentHash` → **同轮按 hash 去重**（相同 chunk 复用向量，省 LLM API 调用）
- 组装 Chunk：`chunkIndex / tokenCount / metadata.titles / path`（path 与 Document 相同，双向冗余起点）

**验证**：重复文件内容只触发一次 embedding。

### 2.5 PG 写入 `src/repository/document.ts`

**目标**：事务内写 Document + Chunks。

**关键产出**：
- `$transaction`：`createDocument` + `createManyChunks`（同一事务，任一侧失败整体回滚）
- 返回 documentId 供 Qdrant 侧使用

**验证**：库中 Document 一行、Chunk 多行，`@@unique([documentId, chunkIndex])` 生效。

### 2.6 Qdrant 写入 `src/repository/qdrant.ts`（upsert）

**目标**：每个 chunk 一个 point，payload 冗余。

**关键产出**：
- `point id = chunk id`（⚠️ 坑 1）、`vector = 1024 维`
- payload：`{ documentId, path, titles, content }`（R5.1 ③ 示例）

**验证**：Qdrant Dashboard 或 API 查到 point，payload 完整。

### 2.7 SyncService `src/service/sync/sync.ts`

**目标**：全量重建编排 + SyncRun 审计（R6.1 伪代码照抄）。

**关键产出**：
- `rebuildSync()`：写 SyncRun RUNNING → 清空 PG（DocumentChunk/Document）+ recreate collection → 逐文件 2.4→2.5→2.6 → SUCCESS/FAILED 收尾
- 失败路径：任一步 throw → SyncRun FAILED + error；重跑从清空重新开始，**无脏数据**
- `scripts/` 接通（`npm run init` / `npm run sync` / `npm run status`）

**验证**：
- `npm run init` 全量索引成功，`npm run status` 统计正确（fileCount/chunkCount）
- 改一个 md 内容后 `npm run sync`：PG 行数与 Qdrant points 与文件系统一致
- 停掉 Qdrant 再 `npm run sync` → FAILED；恢复后重跑 → SUCCESS（幂等验证）

---

## Phase 3：P2 问答（混合检索 + 生成）

> 对应 README「6.2 混合检索」「6.3 问答流程」。验收：专名问题 keyword 通道命中；答案带来源。

### 3.1 关键词提取 `src/service/retrieval/keywords.ts`

**目标**：问题 → 关键词集合（R6.2 新增步骤）。

**关键产出**：
- 切词：中文 2 字滑动窗口 n-gram + 英文/数字按空白与标点切
- 去停用词：`的 / 怎么 / 用 / 是` 等高频无义词表
- 保专名：`cleancode / scan / CLI` 等走**专名白名单**（可从历史检索词沉淀）
- 输出 `string[]`（去重、限长，如 ≤5 个）

**验证**：「cleancode scan 怎么用」→ `["cleancode", "scan"]`（专名保留、停用词剔除）。

### 3.2 混合检索 `src/service/retrieval/hybrid.ts`

**目标**：dense + keyword 双通道 → RRF 融合（R6.2 流程图照抄）。

**关键产出**：
- **dense 通道**：问题向量化 → Qdrant `search` top-10
- **keyword 通道**：关键词**逐个** `ILIKE '%kw%'`（或 OR 合并）`DocumentChunk.content` top-10（⚠️ 坑 6；2 字中文词不强制命中、容忍全表扫描 ⚠️ 坑 2）
- **RRF 融合**：`score = Σ 1 / (rrf_k + rank)`，`rrf_k = 60`，取 top-5（参考大纲「4.3 高级检索策略」）
- 结果统一携带 `path` 与 `titles`（PG 侧读 `DocumentChunk.path`，Qdrant 侧读 payload，两侧同源，无需 join——R5 关键说明 2）

**验证**：`cleancode scan` 问题 keyword 通道命中 2.2 的 chunk；语义近义问题（「怎么审查代码安全」）dense 命中；融合结果前 5 均带 path。

### 3.3 System Prompt `src/service/agent/prompt.ts`

**目标**：约束模型只依据上下文回答（R6.3 节点职责）。

**关键产出**：
- 角色：企业内部知识库助手
- 规则：只依据上下文回答；上下文不足时明说"资料未覆盖"；答案标注来源（`sources` 路径）；禁止编造

**验证**：直接引用进 3.4 pipeline。

### 3.4 AgentService `src/service/agent/service.ts`

**目标**：一轮 Runnable pipeline（R6.3，不引入 LangGraph）。

**关键产出**：
- `RunnableSequence`：`{ context: hybridTopK, question }` → SYSTEM_PROMPT → chatModel → `parseAnswerAndSources`（解析答案 + 收集 `sources[]`）
- LLM 接入：`@langchain/deepseek`（DeepSeek flash）或 OpenAI 兼容；`temperature` 调低（如 0.2）
- 流式：返回 `Promise<Stream>` 或 async generator，由 Web 入口消费（Phase 4 接入 SSE）

**API 提示**：`RunnableSequence.from([...])` 见 [文档 02-01](../../doc/02-LangChain.js生态深度掌握/01-LangChain.js架构概览.md)；`parseAnswerAndSources` 可用 zod 结构化输出或约定分隔符解析。

**验证**：临时脚本 / Phase 4 的 curl 触达 AgentService，问「cleancode scan 怎么用」输出答案 + 来源「docs/command-line.md」；超域问题（"今天天气"）明确拒绝不幻觉。

---

## Phase 4：P3 Web 入口（Hono + SSE + 浮框组件）

> 对应 README「八 入口设计」。验收：Web 浮框走 Service 可用、流式输出正常（本期不做 CLI，问答唯一入口为 Web）。

### 4.1 Web 服务 `src/entry/web/server.ts`

**目标**：Hono + SSE 转发，仅 HTTP 适配（不含业务逻辑）。

**关键产出**：
- `POST /api/chat`：body `{ message }` → AgentService → **SSE**（`text/event-stream`，事件携带增量文本，结束事件附 `sources`）
- CORS：`app.use("*", cors(...))` — `CORS_ORIGIN`（env，逗号分隔白名单）放行宿主页面 origin；`allowMethods` POST/OPTIONS，`allowHeaders` Content-Type / Authorization（配合鉴权预留）；preflight 由 CORS 中间件统一处理
- 鉴权预留：`app.use("/api/*", authMiddleware)`，当前 no-op（`AUTH_ENABLED=false` 时直接放行）；预留 `AuthContext` 透传（R「鉴权预留设计」）

**API 提示**：Hono 原生 SSE（`c.req.raw.signal` 感知断开）或 streaming helper；参考 Hono 官方 SSE 示例。

**验证**：`curl -N -X POST /api/chat` 看到增量块 + 结尾 sources；前端起在另一端口（如 5173）跨域直连 8787，浏览器 Console 无 CORS 报错、SSE 流式正常渲染。

### 4.2 Web 浮框组件 `src/entry/web/ui/`

**目标**：原生 Web Components widget，零框架依赖，可嵌入任意前端。

**关键产出**：
- `FloatButton` + 浮框（打开/关闭、输入、消息列表）
- **Shadow DOM 隔离样式**，不污染宿主；`POST /api/chat` + `fetch` 读 SSE 流渲染
- 编译为**单文件 ESM 产物 `dist/kb-chat-widget.js`**（esbuild/vite；**不做 npm 包**），宿主 `<script type="module" src=".../kb-chat-widget.js">` 引入即用（custom element 注册走 import 副作用）

**验证**：本地静态页引入组件，问「cleancode scan」流式出答案 + 来源链接；同时在 React / Vue 两个最小宿主项目各引入一次均可用。

### 4.3 前端方案决策记录（为何不用 Vercel AI SDK）

> **结论：本期前端用 Web Components 自研 widget，不引入 Vercel AI SDK。** 对应 README 八 8.2 说明。

| 维度 | Web Components（选定） | Vercel AI SDK（`useChat`） |
| --- | --- | --- |
| 框架绑定 | 零依赖，任意宿主（React / Vue / 原生均 `<script>` 即用） | hooks 绑定 React / Vue / Svelte，宿主框架不符则无法使用 |
| 体积 | 自研纯 TS，约 5-10KB gzip | 实际打包 ~45KB gzip（核心 12-15 + provider ~19） |
| 嵌入方式 | **ESM 单文件自包含，`<script type="module">` 即用**；样式 Shadow DOM 隔离不污染宿主 | 需改宿主组件代码接入 hook，样式随宿主体系 |
| 与大纲关系 | — | 属大纲第五阶段（AI SDK 前端集成），留到后续项目练手 |

**验证**：React + Vue 两个宿主各以 `<script type="module">` 引入编译产物，冒烟通过。

---

## Phase 5：测试与收尾

- [ ] 单测（vitest）：chunker（标题分块 / 兜底）、keywords（切词 / 停用词 / 专名）、RRF 融合（手工排名样例断言）、repository（事务写读、unique 约束）
- [ ] 端到端：10+ 个 md 文档库 → `npm run init` → 5 条真实问答（2 专名 + 2 语义 + 1 超域）断言命中与溯源
- [ ] 幂等与失败恢复：连续两次 `npm run sync` 结果一致；停 Qdrant 触发 FAILED → 恢复重跑 SUCCESS
- [ ] Web 入口回归：走一遍 5 条问答（2 专名 + 2 语义 + 1 超域），流式 + 溯源 + 超域拒答均正常
- [ ] 更新 README「当前实现状态」标注 / 补充实测结论到 todo（新踩的坑按上面的表格式追加）
- [ ] 提交 git（`feat: kb-agent ...`，参考仓库提交规范）

---

## 学习要点速查（阶段映射）

| 能力 | 核心 API / 做法 | 出处 |
| --- | --- | --- |
| Prisma 7 + Bun | `bunx --bun prisma`、`prisma.config.ts`、`@prisma/adapter-pg` | R5 关键说明 4 |
| 全文检索 | `pg_trgm` + GIN 索引（迁移手写 SQL）⚠️ 中文 2 字不走索引 | R6.2 |
| 分块 | `MarkdownHeaderTextSplitter` + `RecursiveCharacterTextSplitter` | R6.3 / RAG 文档 |
| Embedding | Ollama OpenAI 兼容 `/v1/embeddings`、bge-m3 1024 维 | R3 / 大纲 4.5 |
| 向量检索 | `@qdrant/js-client-rest`：`ensureCollection` / `upsert` / `search` | R6.2 / 大纲 4.1 选型树 |
| 混合检索 | dense + keyword 双通道 + 自实现 RRF（`rrf_k=60`） | R6.2 / 大纲 4.3 |
| 问答编排 | `RunnableSequence.from([...])` 一轮 pipeline | R6.3 / 文档 02-01 |
| 溯源 | payload/path 双向冗余，`sources[]` 随答案输出 | R5 关键说明 2 / R6.3 |
| SSE 流式 | Hono `text/event-stream`，Web 浮框增量渲染 | R8.2 |
| web widget | Web Components + Shadow DOM，零框架依赖 | R8.2 |

---

## 参考文档

- [README.md](README.md)（本文档唯一权威：五 数据模型 / 6.1 同步 / 6.2 检索 / 6.3 问答 / 八 入口 / 九 落地阶段）
- [04-RAG架构原理与实践.md](../../doc/01-AI-Agent基础与认知升级/04-RAG架构原理与实践.md)（RAG 理论：加载-分块-嵌入-检索-生成链路）
- [05-TypeScript-Bun在AI领域的应用.md](../../doc/01-AI-Agent基础与认知升级/05-TypeScript-Bun在AI领域的应用.md)（Bun 运行时）
- [01-LangChain.js架构概览.md](../../doc/02-LangChain.js生态深度掌握/01-LangChain.js架构概览.md)、[02-模型与消息系统.md](../../doc/02-LangChain.js生态深度掌握/02-模型与消息系统.md)
- 大纲「第四阶段：向量数据库与检索系统」（4.1 选型决策树 / 4.2 ES 升级路径 / 4.3 混合检索与 RRF / 4.5 Embedding）
- 官方：[Qdrant point id 约束](https://qdrant.tech/documentation/concepts/points/)、[Prisma 7 & Driver Adapter](https://www.prisma.io/docs/orm/overview/databases/database-drivers)、[pg_trgm 文档](https://www.postgresql.org/docs/16/pgtrgm.html)