# 第四阶段实验台

配合 [4.1](../01-Milvus与Qdrant向量数据库.md) – [4.5](../05-文档入库与治理.md) 的可运行示例。所有示例在本地 Docker 栈上实跑通过（macOS arm64 / Docker 29.7 / Bun 1.4）。

## 快速开始

```bash
# 1. 起栈（首次拉镜像约 6 GB，Milvus 冷启动约 90s）
docker compose -f docker-compose.kb.yml up -d
docker compose -f docker-compose.kb.yml ps

# 2. 装依赖
bun install

# 3. 若 ES 数据卷已存在，RRF 需要 trial 许可（详见 4.2）
curl -X POST "http://localhost:9200/_license/start_trial?acknowledge=true"

# 4. 逐个跑
bun run demo:milvus
bun run demo:qdrant
bun run demo:es
bun run demo:hybrid    # 纯内存，不需要任何服务
bun run demo:neo4j
bun run demo:ingest
bun run demo:docx      # 纯内存：生成最小 .docx → HTML → Markdown
```

只做某一篇的实验，可以只起对应子集：

```bash
docker compose -f docker-compose.kb.yml up -d milvus-standalone qdrant   # 4.1
docker compose -f docker-compose.kb.yml up -d elasticsearch              # 4.2
docker compose -f docker-compose.kb.yml up -d neo4j                      # 4.4
docker compose -f docker-compose.kb.yml up -d postgres redis milvus-standalone  # 4.5
```

## 脚本与可断言结果

| 脚本            | 对应章节 | 依赖服务            | 关键断言                                                                                |
| --------------- | -------- | ------------------- | --------------------------------------------------------------------------------------- |
| `src/milvus.ts` | 4.1      | Milvus              | 写入总数一致；dense/BM25/hybrid top1；过滤负向对照（不带过滤召回 internal、带过滤排除） |
| `src/qdrant.ts` | 4.1      | Qdrant              | `query` top1 命中；BM25（multilingual 分词）top1 命中；payload filter 生效              |
| `src/es.ts`     | 4.2      | Elasticsearch       | BM25/kNN/RRF top1 命中；聚合总数守恒                                                    |
| `src/hybrid.ts` | 4.3      | 无                  | RRF Recall@3 ≥ 单路；失败 query 唯一且为改写型；两段式精排 top1 命中                    |
| `src/neo4j.ts`  | 4.4      | Neo4j               | 向量 top1；实体扩展；两跳关联；Chunk 节点带 tenantId/visibility                         |
| `src/ingest.ts` | 4.5      | PG + Redis + Milvus | 全量、幂等、增量+旧块清理、dead、public 过滤、空间拒绝/允许两分支                       |
| `src/docx.ts`   | 4.5      | 无                  | 标题转 Markdown 标题、正文完整、无 HTML/XML 残留                                        |

所有脚本失败时抛 `断言失败：xxx` 并以非零码退出，可直接接 CI。

## 数据

`data/docs/` 是 6 篇虚构产品文档，每篇 6 个块。`src/embedding.ts` 是**确定性哈希替身**（字符 bigram 哈希 + L2 归一化），只反映字面重合，用于零 API Key 跑通链路；换真实模型只需替换 `embed()` / `embedChunk()` 实现。

## 清理

```bash
docker compose -f docker-compose.kb.yml down        # 停止，保留数据卷
docker compose -f docker-compose.kb.yml down -v     # 停止并清空数据
```

## 排障

| 现象                                   | 处理                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Milvus 一直 `starting`                 | 等满 90s 的 `start_period`；`docker logs kb-milvus` 看 etcd/MinIO 连接 |
| ES 403 `license is non-compliant`      | 执行上面的 `_license/start_trial`                                      |
| Bun 下 ES 客户端报 `response.headers`  | 已内置 `Connection: HttpConnection`，不要删                            |
| Milvus 建集合报 `ERR_INVALID_ARG_TYPE` | `type_params` 的值必须是字符串                                         |
| 端口冲突                               | 改 `docker-compose.kb.yml` 的宿主机端口映射，同步改 `.env`             |
