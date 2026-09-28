# M5 文章 CRUD、状态机与 OpenAPI

> 对应 [TODO M5](../TODO.md) ｜ FR-3/10/11/15/16 ｜ 教程 §5/§6 ｜ 预计 90 分钟

## 这一步做什么

文章全生命周期：CRUD + 分页过滤、表驱动状态机、乐观锁、软删除、`createRoute` 三同源的 OpenAPI 文档。

## 状态机：元数据表 + 纯函数（domain/post-transitions.ts）

```ts
export const actionOrigin: Record<PostAction, PostStatus> = {
  submit: 'DRAFT', approve: 'PENDING_REVIEW', reject: 'PENDING_REVIEW', archive: 'PUBLISHED'
}
export const transitions: Record<PostStatus, Partial<Record<PostAction, TransitionRule>>> = {
  DRAFT: { submit: { to: 'PENDING_REVIEW', roles: [], ownerAllowed: true } },
  PENDING_REVIEW: { approve: { to: 'PUBLISHED', roles: ['editor', 'admin'] }, reject: { ... } },
  PUBLISHED: { archive: { to: 'ARCHIVED', roles: ['editor', 'admin'], ownerAllowed: true } },
  ARCHIVED: {}
}
export const canTransition = (actor, post, action): TransitionDecision => { ... }
```

「角色 × 状态 × 操作」三维判定全在一张表里，新增规则 = 改表数据，判定逻辑零改动。纯函数不碰 DB，表驱动用例覆盖全流转矩阵。

## 流转的并发语义（services/posts.ts）

```ts
const res = await tx.post.updateMany({
  where: { id, status: from, deletedAt: null },   // 条件更新：状态没被并发改过才命中
  data: { status: to },
})
if (res.count === 0) {
  const current = await tx.post.findFirst(...)
  if (current.status === to) return current      // 重复请求 → 幂等 200
  throw apiError.unprocessable(...)              // 真正的非法流转 → 422
}
```

**0 行判定规则**是本项目最值得学的细节：条件更新命中 0 行时，必须回查区分「重复提交」（幂等 200）和「状态漂移后的非法操作」（422）——否则两者无法区分，客户端没法做安全重试。注意权限判定用 `actionOrigin` 的**源状态视角**调 `canTransition`，不能传当前状态（幂等重放会被误判 NO_RULE）。

## 乐观锁（updatePost）

`updateMany({ where: { id, version } })` + `version: { increment: 1 }`，0 行 → 409。条件更新 + 原子递增，并发双写必有一个 409（tests/concurrency.test.ts 用 `Promise.all` 锁定该行为）。

## 软删除

`deletedAt: new Date()`，列表/详情统一过滤；删文章同事务级联软删其评论 + 写审计（OK）。

## 踩坑实录

事务里 `updateMany` 命中 0 行后的回查必须放**同一事务**内——放事务外的话，回查前被并发软删会 `findUniqueOrThrow` 抛 P2025 → 500。

## 验证

`/api/doc`（当时 8 条路径的 OpenAPI 3.0.0，M6 评论后增至 10 条）+ `/ui`（Scalar）可访问；2xx/4xx 全路径测试。

## 面试可答

> **问：状态机为什么要表驱动，switch/case 不行吗？**
> switch 把规则埋在控制流里，改一条规则要读懂整段逻辑；表把「什么状态、谁、能做什么」变成数据，判定逻辑与规则解耦——新增规则是改配置不是改代码，且纯函数形态天然可单测。这就是教程「元数据 + 中间件工厂」思路的落地。
