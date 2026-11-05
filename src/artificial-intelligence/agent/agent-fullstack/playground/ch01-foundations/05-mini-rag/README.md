# 05 · 迷你 RAG

对应文档：[1.4 RAG 架构原理与实践](../../../doc/01-AI-Agent基础与认知升级/04-RAG架构原理与实践.md)

## 场景

三篇公司制度文档，用户问一句话，你要完成一条最小 RAG 链路：

```text
切块 → 建索引（本地向量）→ 召回 topK → 拼上下文 → 假模型回答 → 解析引用
```

不联网、不接向量库，检索用 `@/shared/embed` 的确定性词法向量。

## 你要实现的 API

```ts
interface Doc {
  id: string
  text: string
}

interface Chunk {
  id: string
  docId: string
  text: string
}

interface RankedChunk {
  chunk: Chunk
  score: number
}

interface RagOptions {
  topK?: number // 默认 3
  chunkSize?: number // 默认 80
  chunkOverlap?: number // 默认 20
  maxContextChars?: number // 默认 400
}

interface RagAnswer {
  answer: string
  citations: string[]
  chunks: Chunk[]
}

function chunkDocuments(
  docs: Doc[],
  chunkSize?: number,
  chunkOverlap?: number
): Chunk[]

function retrieve(
  question: string,
  chunks: Chunk[],
  topK?: number
): RankedChunk[]

function answerWithCitations(
  question: string,
  docs: Doc[],
  model: ScriptedModel,
  options?: RagOptions
): Promise<RagAnswer>

function evaluate(
  cases: Array<{ query: string; expectedDocId: string }>,
  docs: Doc[],
  options?: RagOptions
): { hits: number; total: number; hitRate: number }
```

## 行为规则

1. 切块：
   - 步长 `chunkSize - chunkOverlap`，按字符切，允许重叠；
   - chunk id 是 `<docId>#<序号>`，序号从 0 开始；
   - `chunkSize <= 0`、`chunkOverlap < 0`、`chunkOverlap >= chunkSize` → 抛 `RangeError`。
2. 召回：
   - 用 `embed` + `cosineSimilarity` 打分；
   - 过滤掉得分低于 `0.1` 的块（哈希向量有少量碰撞，阈值用来过滤噪声）；
   - 按分数降序取前 `topK`；`topK < 1` → 抛 `RangeError`。
3. 回答：
   - 先切块再召回；一个都没召回时直接返回 `知识库中没有找到相关内容。`，**不调用模型**；
   - 上下文每行格式：`[序号] (chunkId) 文本`，总长不超过 `maxContextChars`（至少保留一行）；
   - 消息为一条 `system`（要求只依据资料、用 `[序号]` 标注引用）+ 一条 `user`（资料 + 问题）；
   - 模型返回 `final` 后，从答案里解析 `[n]`，映射回 chunk id，去重；越界的序号忽略。
4. 评估：
   - 每条用例召回后，只要任意一个 chunk 的 `docId` 等于 `expectedDocId` 就算命中；
   - `hitRate = hits / total`；`total` 为 0 时返回 0。

## 验收标准

1. 20 个字符的文本用 `chunkSize = 10`、`chunkOverlap = 2` 切出 3 块，id 为 `a#0`、`a#1`、`a#2`，最后一块是 `ij`。
2. 非法切块参数抛 `RangeError`。
3. 「年假怎么申请」「报销发票什么时候交」「远程办公每周几天」三条 query 的第一名分别命中 `leave`、`expense`、`remote`。
4. 与语料无重叠的 query 召回空数组。
5. 答案里写 `[1]` 时，`citations` 返回对应 chunk id；模型只被调用一次；`user` 消息里能看到 `[1]` 标记。
6. 无召回时返回固定拒答文本，`citations` 为空，模型调用次数为 0。
7. 三条评估用例全部命中，`hitRate` 为 1。

## 约束

- 不许联网，不许引入真实 embedding / 向量库。
- 不许修改 `index.test.ts` 和 `shared/`。
- 上下文拼接要在 `answerWithCitations` 内部完成，不要塞进测试。

## 提示

<details>
<summary>提示 1 · 方向</summary>

把「切块」和「召回」当成两个独立函数：前者只关心字符串窗口，后者只关心向量打分。`answerWithCitations` 只负责编排：召回 → 拼 prompt → 调模型 → 解析引用。

</details>

<details>
<summary>提示 2 · 关键 API</summary>

- 切块用 `text.slice(start, start + chunkSize)`，步长是 `chunkSize - chunkOverlap`。
- 打分用 `@/shared/embed` 的 `embed()` 和 `cosineSimilarity()`。
- 排序用 `toSorted((a, b) => b.score - a.score)`，再 `slice(0, topK)`。
- 解析引用用 `String.prototype.matchAll(/\[(\d+)\]/g)`。

</details>

<details>
<summary>提示 3 · 结构伪代码</summary>

```text
chunkDocuments:
  校验参数
  对每篇文档:
    从 0 开始，每次前进 size - overlap
    截取 [start, start + size)，生成 id，push

retrieve:
  校验 topK
  queryVec = embed(question)
  对每个 chunk 算 cosine
  filter(score >= 0.1)
  sort desc
  slice(0, topK)

answerWithCitations:
  chunks = chunkDocuments(docs, size, overlap)
  ranked = retrieve(question, chunks, topK)
  如果 ranked 为空: 返回拒答
  逐条拼 "[n] (chunkId) 文本"，累计不超过 maxContextChars
  组装 system / user 消息，调用模型
  从 final 文本里解析 [n]，映射 chunk id，去重
```

</details>

## 进阶（通过后做）

- 同一篇文档命中多个 chunk 时，按 docId 聚合后再取 topK。
- 把词法向量换成一个 5 篇文档的 BM25，比较命中率差异。
- 给答案加「引用覆盖率」检查：答案里的 `[n]` 必须能在上下文里找到，否则判为未通过。

## 运行

```bash
bun test ch01-foundations/05-mini-rag
```
