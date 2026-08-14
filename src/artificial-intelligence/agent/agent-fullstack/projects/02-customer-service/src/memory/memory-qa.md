# memory 目录复习 QA

> 针对 `src/memory/` 目录下记忆层文件的问答整理，方便复习。
> 当前收录：`checkpointer.ts`（短期记忆）、`store.ts`（长期记忆）。后续新增内容的 QA 追加到本文档。

---

## Q1：短期记忆（`checkpointer.ts`）的作用是什么？

**核心职责：会话内上下文保持——让同一用户的多轮对话「接得上」。**

LLM 本身是无状态的，每次调用都只看当前输入。没有短期记忆时，第二轮对话的模型看不到第一轮说了什么。短期记忆（Checkpointer）解决的就是这个问题：

- **自动存取**：Agent 每次调用结束，LangGraph 自动把当前对话状态（消息历史、中间变量）序列化保存为 checkpoint；下次以**相同 `thread_id`** 调用时自动加载回来，模型就像「记得」之前的对话。
- **thread_id 是身份**：它决定「哪几轮对话属于同一条线程」。CLI 里 `thread_id` 由 userId 派生（`cs-${userId}`），所以同一用户重启程序后还能接上上轮对话——数据已经落盘。
- **持久化介质**：本项目用 `SqliteSaver`（`@langchain/langgraph-checkpoint-sqlite`）写入本地 SQLite 文件（`CHECKPOINTER_PATH`，默认 `./data/checkpoints.db`）。
- **惰性建表**：`SqliteSaver` 的 `setup()`（PRAGMA WAL + CREATE TABLE）在首次读写时自动执行，无需手动调用。

> ⚠️ **Bun 特有坑**：`SqliteSaver.fromConnString(path)` 内部用 better-sqlite3 的 `new Database()`，在 Bun 下直接 ABI 崩溃。项目里改用 `bun:sqlite` 包了一层 better-sqlite3 兼容适配器再 `new SqliteSaver(adapter)`，详见 [checkpointer.ts](checkpointer.ts) 头部注释。

> **现实类比（Trae IDE）**：你在 Trae 里和 AI 的**同一个对话会话**里连续改代码——上一轮让它把工具函数改成单引号风格，下一轮它就知道继续按单引号写。这就是一条 `thread_id` 线程、一个 Checkpointer：历史存在本地，下次打开 Trae 翻到同一个会话还能接着聊（= 持久化落盘）。如果你**新开一个对话**，AI 就「失忆」了，除非把之前的背景重新描述一遍——没有短期记忆的 Agent 就是这样，每轮都是空白对话。

一句话：**短期记忆 = 「同一条对话线程里，模型记得刚才说过什么」，由 Checkpointer 自动完成。**

---

## Q2：长期记忆（`store.ts`）的作用是什么？

**核心职责：跨对话、跨线程保存事实——让用户换一条新线程（甚至隔几天）后，模型还记得他的偏好。**

与短期记忆的两个关键差异：

| 维度 | 短期记忆（Checkpointer） | 长期记忆（Store） |
|---|---|---|
| 作用域 | 单条线程内（同 `thread_id`） | 所有线程共享（跨 `thread_id`） |
| 存什么 | 消息历史、中间状态 | 用户偏好、事实知识（称呼、语言、配置） |
| 谁写 | LangGraph 自动 | **工具代码显式读写**（`runtime.store`） |

使用方式（本项目 Phase 2 会落地）：
- 读写必须走工具参数里的 `runtime.store`，通过 `namespace + key` 定位数据，例如 `runtime.store.get(["users", userId], "preferences")`。

```
Store 结构（namespace + key 组织）：
["users"] / user-123 / { name: "李华" }
```

- 不能闭包引用外部变量：`createAgent({ store })` 会把 store 注入每个工具调用的 `runtime`，保证**同一 store 实例对所有工具、所有线程可见**——这是「跨线程共享」的机制基础。闭包引用会绕过这套注入机制。

> **现实类比（Trae IDE）**：Trae 里的**「个人规则 / 用户规则」**（比如「永远用 TypeScript 单引号」「注释写中文」）——设置一次，之后无论新开多少个对话、隔几天再来，AI 每次都自动遵守。这就是一个跨线程共享的 Store：偏好存在「用户」这个维度（namespace `["users"]`），而不是存在某一条对话里。状态栏那个「规则生效中」就相当于 store 被成功注入到了 runtime。规则文件被手动改掉（重启前）≈ InMemoryStore「重启即失」。

一句话：**长期记忆 = 「用户换任何会话都记得他的偏好」，由工具代码按需读写 Store。**

---

## Q3：生产环境和开发环境的区别是什么？

| 维度 | 开发环境（本项目现状） | 生产环境 |
|---|---|---|
| 短期记忆 | `SqliteSaver` → 本地 SQLite 文件 `./data/checkpoints.db` | `PostgresSaver`（`@langchain/langgraph-checkpoint-postgres`） → PostgreSQL |
| 长期记忆 | `InMemoryStore` → 进程内存，**重启即失** | `PostgresStore`（`.../store` 子路径） → PostgreSQL |
| 实例部署 | 单进程 | 多实例（水平扩容） |
| 初始化 | `setup()` 首次读写时惰性自动执行 | 建议**部署步骤显式 `await checkpointer.setup()` / `store.setup()`** 建表 |

**为什么要换 Postgres：**

1. **短期记忆**：SQLite 是单机单进程方案。多实例部署时，每个实例有各自的库文件，同一 `thread_id` 的对话可能落在不同实例上，恢复就岔了。PostgreSQL 是共享存储，任何实例都能读到全部线程状态。
2. **长期记忆**：`InMemoryStore` 数据只活在单个进程里——重启就丢，不同实例之间也互不可见。生产必须落到共享数据库。

**换法（对应本项目两处代码的最小改动）：**

```typescript
// checkpointer: SqliteSaver → PostgresSaver
const checkpointer = PostgresSaver.fromConnString(DB_URI)

// store: InMemoryStore → PostgresStore（可配语义检索索引）
const store = PostgresStore.fromConnString(DB_URI, {
  index: { embeddings, dims: 1536 },
})
```

> 补充：`PostgresStore` 的 `index: { embeddings, dims }` 开启**语义检索**（`store.search` 按向量相似度查），`InMemoryStore` 也可配但 Prod 场景才有必要；SQLite 介质对长短期记忆都意味着「单机可用、上云要换库」。

> **现实类比（Trae IDE）**：**开发环境** ≈ 不登录账号的本地 Trae——个人规则、会话历史都存在本机，换个电脑或同事的机器就什么都没有，重启还能丢（内存里那部分）。**生产环境** ≈ 登录同一账号 / 加入团队空间——规则、知识库同步到云端，任何一台电脑登录都能读到同一份数据（= Postgres 共享存储）；团队多人共用同一套「项目规则」，就等价于多个 Agent 实例共享同一个 Store。上云的本质就是把「只在一台机器上存在」的数据变成「任何人、任何时候都拿得到」。

一句话：**开发环境要「轻」（SQLite + 内存，零运维），生产环境要「共享」（Postgres，多实例一致），差别本质上就是单机数据 vs 共享存储。**

---

## Q4：LangGraph 官方支持哪些数据库适配？（生产选型）

**先分清两个接口，它们各自对接存储：**

| 接口 | 角色 | 本项目对应 |
|---|---|---|
| Checkpointer | 短期记忆（线程内） | `checkpointer.ts` |
| Store | 长期记忆（跨线程） | `store.ts` |

**各数据库支持现状：**

| 数据库 | 短期（Checkpointer） | 长期（Store） | 官方? | 定位 |
|---|---|---|---|---|
| SQLite | `SqliteSaver` | — | ✅ | 开发 / 单实例 |
| PostgreSQL | `PostgresSaver` / `AsyncPostgresSaver` | `PostgresStore` | ✅ | **生产首选**，checkpointer + store 双端官方支持 |
| Redis | `RedisSaver`（Python 官方有） | — | ✅（Python） | 高吞吐、可 TTL 过期 |
| MySQL / MariaDB | 社区适配（[langgraph-checkpoint-mysql](https://github.com/tjni/langgraph-checkpoint-mysql)，需 MySQL ≥ 8.0.19） | ❌ 无 | ⚠️ 非官方 | 个人维护，非官方背书 |

**要点：**

- **PostgreSQL 是一等公民**：官方唯一同时覆盖短期 + 长期的数据库，生产直接一个 PG 实例管两端（`PostgresSaver` + `PostgresStore` 同库）。这也是 Q3 换库示例选 PG 的原因。
- **MySQL 只有社区适配，且只覆盖短期**：没有官方 store 适配。选型时别默认「企业都用 MySQL」——LangGraph 生态是 PG 优先。
- **接口是开放的**：`BaseCheckpointSaver` / `Store` 是抽象接口，任何数据库实现这两套接口就能接入（社区 MySQL 适配就是这么来的）。

一句话：**生产要共享存储，官方生产解锁的是 PostgreSQL——它同时兼任短期和长期记忆的存储。**