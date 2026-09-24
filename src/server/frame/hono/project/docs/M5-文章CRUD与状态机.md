# M5 文章 CRUD 与状态机

> 所属：[project](../) 实现教学 ｜ 前置：[M4](./M4-认证与RBAC.md) ｜ 对应代码：`src/domain/post-transitions.ts`、`src/services/posts.ts`、`src/routes/posts.ts`、`src/schemas/posts.ts`

**一句话定位**：业务规则增强的核心篇——表驱动状态机、可见性矩阵、乐观锁、幂等流转、软删级联，全部落在「routes → services → domain → lib」四层里。

**面试可答**：状态流转用「以动作源状态为条件的 updateMany」实现——0 行时回查当前状态，已是目标态则幂等返回 200，否则 422；一条 SQL 判断同时解决并发安全与幂等重放。

---

## 1. 分层：为什么代码不在 handler 里

先看一次请求穿过的层（PRD §2.1 分层约定的落地）：

```
routes/posts.ts        HTTP 编排：解析、校验、调服务、包信封      ← 不写业务规则
  └─ services/posts.ts  事务编排：查库、权限、条件更新、审计      ← 不解析 HTTP
      └─ domain/post-transitions.ts  纯规则：状态机判定           ← 不碰 DB，纯函数
          └─ lib/{db,errors}.ts      基础设施
```

收益立竿见影：`domain/post-transitions.ts` 是纯函数，它的测试（6 条矩阵用例）**不需要数据库、毫秒级跑完**；services 的事务逻辑变更不碰路由层。反过来，如果全堆在 handler 里，状态机测试就得起数据库。

## 2. 状态机：`domain/post-transitions.ts`

### 2.1 元数据表

```ts
export const actionOrigin: Record<PostAction, PostStatus> = {
  submit: 'DRAFT',
  approve: 'PENDING_REVIEW',
  reject: 'PENDING_REVIEW',
  archive: 'PUBLISHED',
}

export const transitions: Record<PostStatus, Partial<Record<PostAction, TransitionRule>>> = {
  DRAFT:         { submit: { to: 'PENDING_REVIEW', roles: [], ownerAllowed: true } },
  PENDING_REVIEW: {
    approve: { to: 'PUBLISHED', roles: ['editor', 'admin'] },
    reject:  { to: 'DRAFT', roles: ['editor', 'admin'] },
  },
  PUBLISHED:     { archive: { to: 'ARCHIVED', roles: ['editor', 'admin'], ownerAllowed: true } },
  ARCHIVED: {},   // 终态
}
```

- **一张表回答三个问题**：从哪来（键）、谁允许（roles + ownerAllowed）、到哪去（to）。加一个状态/动作 = 改一行表，不用动判定逻辑
- `roles: []` + `ownerAllowed: true` 的组合读作「仅作者本人」；`roles: ['editor','admin']` 无 ownerAllowed 读作「仅 staff，作者本人也不行」——PRD §4.1.2 的「作者 approve 自己的文章 → 403」就是这条
- 与 [10-实战B §3](../../doc/10-实战B-企业级REST-API.md) 的 `requireRole()` 中间件工厂同一思想：**元数据 + 机制分离**

### 2.2 纯函数判定

```ts
export const canTransition = (
  actor: Actor,
  post: { authorId: string; status: PostStatus },
  action: PostAction,
): TransitionDecision => {
  const rule = transitions[post.status][action]
  if (!rule) return { allowed: false, reason: 'NO_RULE' }
  if (rule.roles.includes(actor.role) || (rule.ownerAllowed === true && actor.id === post.authorId)) {
    return { allowed: true }
  }
  return { allowed: false, reason: 'FORBIDDEN' }
}
```

不碰 DB、不抛异常、返回判定对象——测试就是查表对答案。

## 3. 流转的核心：条件更新 + 0 行回查（services 层）

这是全项目最精的一段逻辑（`services/posts.ts` 的 `transitionPost`）：

```ts
const from = actionOrigin[action]        // 动作的源状态，如 submit → DRAFT
const rule = transitions[from][action]
// ...角色判定（不通过 → DENIED 审计 + 403）...
const to = rule.to

const updated = await prisma.$transaction(async (tx) => {
  // ① 条件更新：只有「仍处于源状态」的行才会被改
  const res = await tx.post.updateMany({
    where: { id, status: from, deletedAt: null },
    data: { status: to },
  })
  if (res.count === 0) {
    // ② 0 行 → 回查当前状态
    const current = await tx.post.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw apiError.notFound()
    if (current.status === to) return current   // ③ 已是目标态 → 幂等成功
    throw apiError.unprocessable(`非法流转：当前状态 ${current.status} 不能执行 ${action}`)
  }
  // ④ 流转与审计同事务
  await tx.auditLog.create({ data: { userId: user.id, action: 'POST_TRANSITION',
    resource: `post:${id}`, detail: `${from} -> ${to}`, result: 'OK' } })
  return tx.post.findUniqueOrThrow({ where: { id } })
})
```

**关键设计：为什么用 `actionOrigin[action]` 而不是 `post.status` 做 where 条件？**

因为幂等重放的请求里，数据库当前状态已经变了：

```
第一次 submit：DB 是 DRAFT → updateMany(status=DRAFT) 命中 1 行 → PENDING_REVIEW
重复   submit：请求还带着 submit 语义，DB 已是 PENDING_REVIEW
              ├─ 若 where 用当前状态：查不到 submit 规则 → 误判 422 ❌
              └─ 若 where 用 actionOrigin（DRAFT）：命中 0 行 → 回查
                    current(PENDING_REVIEW) === to(PENDING_REVIEW) → 200 幂等 ✅
```

一条 `updateMany` 同时解决**并发安全**（两个 editor 同时 approve 只有一个命中）与**幂等重放**（网络重试不报错），测试里的「重复 submit 幂等返回 200」就是验这条。

三种 0 行结果对照 PRD §4.1 的判定规则：

| 0 行原因 | 回查结果 | 响应 |
|----------|----------|------|
| 重复提交（已是目标态） | `current === to` | 200 幂等 |
| 状态被别人流转走 | `current !== to` | 422 |
| 文章刚被删 | `current == null` | 404 |

> ⚠️ **Prisma v7 踩坑**：`updateMany` 返回的是 `BatchPayload` 对象，取行数要 `res.count`，直接 `res === 0` 编译报错（`BatchPayload` 与 `number` 无重叠）。

## 4. 乐观锁：`updatePost`

```ts
const res = await prisma.post.updateMany({
  where: { id, version: input.version, deletedAt: null },
  data: {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    version: { increment: 1 },
  },
})
if (res.count === 0) throw apiError.conflict()   // 409，提示刷新重试
```

- 客户端必须带着**它读到的 `version`** 来改——两份副本同时编辑，先提交的正常改，后提交的 version 过期命中 0 行 → 409
- 与流转同一个模式：**条件更新 + 0 行即冲突**。区别只在条件是 `version` 而非 `status`
- 为什么不用悲观锁（`SELECT ... FOR UPDATE`）：博客编辑冲突率极低，为 0.1% 的冲突给 100% 的读操作上写锁不值——**冲突率决定锁策略**

> ⚠️ updateMany 与回查必须**同事务**：两步之间若被并发软删，事务外的 findUnique 会抛 P2025 → 变成 500。transitionPost 的回查同理（它本来就在事务内）。

## 5. 可见性矩阵：`visibilityWhere`

```ts
const visibilityWhere = (user: AuthUser | undefined) => {
  if (!user) return { status: 'PUBLISHED' as const }                              // 匿名
  if (isStaff(user)) return {}                                                    // editor/admin
  return { OR: [{ status: 'PUBLISHED' as const }, { authorId: user.id }] }        // 登录用户
}
```

一段 where 子句实现 PRD §4.1.1 整张矩阵，list 和 detail 共用。两个细节：

- **展开顺序即优先级**：`{ deletedAt: null, ...筛选, ...visibilityWhere(user) }`——visibility 放最后，匿名用户就算传 `?status=DRAFT` 也会被覆盖成 PUBLISHED，矩阵不可被参数绕过
- **详情对不可见资源返回 404 而非 403**——不泄露「这篇文章存在但你看不了」，枚举攻击拿不到信号

配套中间件是 M4 的 `optionalAuth`，但它**不挂 `posts.use('*')`**——posts 经 `api.route('/', posts)` 合并到 api 根后，`'*'` 会波及 auth 子路由（隐式耦合；当前幂等无害，但 optionalAuth 一旦加副作用就会误伤 auth 接口）。做法是把 `middleware: [optionalAuth]` 写进六个 `createRoute` 声明里逐路由显式挂载；写操作在 handler 里 `requireUser(c)` 补 401。

## 6. 软删除与审计

```ts
const deleted = await prisma.$transaction(async (tx) => {
  const { count } = await tx.post.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } })
  if (count > 0) {
    await tx.comment.updateMany({ where: { postId: id, deletedAt: null }, data: { deletedAt: new Date() } })  // 级联软删
    await tx.auditLog.create({ data: { userId: user.id, action: 'DELETE_POST', resource: `post:${id}`, result: 'OK' } })
  }
  return count
})
```

- **软删三件套同事务**：主资源标记 + 级联子资源 + 审计记录，要么全成要么全无
- 全站查询统一带 `deletedAt: null` 过滤——漏一处就是「已删文章复活」事故，所以过滤收在 services 层统一做
- 流转被拒也记审计（`result: 'DENIED'`）——安全审计的价值一半在「谁试图做坏事」

## 7. OpenAPI 三同源与文档端点

```ts
const transitionRoute = createRoute({
  method: 'post',
  path: '/posts/{id}/transition',
  request: { params: idParam, body: { content: { 'application/json': { schema: transitionPostSchema } } } },
  responses: {
    200: { /* ... */ }, 403: { /* ... */ }, 404: { /* ... */ }, 422: { /* ... */ },
  },
})
```

- 路径参数用 `z.coerce.number()`——URL 里来的是字符串，coerce 一步到位
- 声明的每个状态码都对应 `services` 里真实 throw 的分支——「文档与实现对不上」在机制上不可能发生
- `api.doc('/doc', ...)` + `app.get('/ui', Scalar({ url: '/api/doc' }))` → `/ui` 可视化调试

## 8. 对比板块：并发控制三角

| 方案 | 机制 | 适用 | 本项目落点 |
|------|------|------|-----------|
| **乐观锁（本项目）** | version 条件更新，冲突方收到 409 重试 | 冲突率低（编辑、审核） | PATCH /posts/:id |
| 悲观锁 | `SELECT FOR UPDATE` 阻塞其他写 | 冲突率高（库存扣减） | 未用——博客无此场景 |
| 状态条件更新 | `where: { status: from }` | 状态机类资源 | 流转接口（兼做幂等） |

## 9. 自测

- [ ] 幂等重放为什么必须用 `actionOrigin` 而不是数据库当前状态做条件？
- [ ] 可见性矩阵的 where 展开顺序为什么不能反？
- [ ] 乐观锁的 409 响应里该不该带最新 version？（思考：前端拿到后怎么重试最顺）
- [ ] 为什么 `canTransition` 返回判定对象而不是直接 throw？

---

## 🔗 参考资料

- Prisma updateMany / BatchPayload：https://www.prisma.io/docs/orm/reference/prisma-client-reference
- 教程对应节：[10-实战B §5/§6](../../doc/10-实战B-企业级REST-API.md)、[05-类型安全与校验](../../doc/05-类型安全与校验.md)

## 📌 小结

- 四层分工：routes 编排 / services 事务 / domain 纯规则 / lib 设施——分层是为了测试速度与变更隔离
- 「条件更新 + 0 行回查」一条模式同时吃下并发安全、幂等重放、非法流转三种语义
- 元数据表驱动状态机：加状态改一行，权限矩阵不可被参数绕过
