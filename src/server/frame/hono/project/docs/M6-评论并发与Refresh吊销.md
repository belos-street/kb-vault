# M6 评论、并发与 Refresh 吊销

> 对应 [TODO M6](../TODO.md) ｜ FR-14/15/16/18 ｜ 预计 60 分钟

## 这一步做什么

评论模块（计数同事务维护）、RefreshToken 服务端吊销、并发正确性的测试锁定。

## 评论：计数与写入同一事务（services/comments.ts）

```ts
const comment = await prisma.$transaction(async (tx) => {
  const created = await tx.comment.create({ data: { postId, authorId: user.id, content } })
  await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } })
  return created
})
```

计数不在应用层读改写（会有丢更新），而是数据库原子递增 + 事务绑定——删评论对称 `decrement`。并发 5 评论后 `commentCount === 5` 由测试锁定（tests/concurrency.test.ts）。

可见性规则：仅 `PUBLISHED` 可评；对不可见文章评论 → 404（不泄露存在性）；可见但非 PUBLISHED（如作者评自己的 DRAFT）→ 422。

## RefreshToken 服务端吊销（FR-18，review 提级 P1）

纯 JWT 的 refresh 有个被动安全缺口：**登出后旧 refresh 依然有效 7 天**——服务端没有状态可撤销。方案：

```prisma
model RefreshToken {
  tokenHash String   @unique   // 只存 JWT 的 SHA-256 哈希——库泄露拿不到可用 token
  userId    String
  expiresAt DateTime
  @@index([userId])
}
```

三个动作：**登录写行 → 刷新时同事务删旧行+写新行（轮换）→ 登出删行（即吊销）**。刷新侧变成双重校验：JWT 签名合法 **且** 服务端行存在，任一不满足 → 401。

**踩坑：jti 必须加。** refresh payload 若只有 `sub/typ/exp`，同一秒内两次登录生成字节级相同的 JWT → hash 相同 → 撞 `@unique` 约束 500。加 `jti: randomUUID()` 一劳永逸。

**踩坑：`migrate dev` 后 client 可能没重新生成**——`prisma.refreshToken` 是 undefined，全部登录 500。显式 `bunx prisma generate` 解决。

## 验证

- 轮换后旧 refresh → 401；登出后旧 refresh → 401（auth.test 锁定）
- 评论增删后详情 `commentCount` 对账；删文章级联后评论列表 404
- 并发：同 version 双写一 200 一 409；5 并发评论计数对账为 5

## 面试可答

> **问：评论计数为什么不用 `SELECT COUNT(*)` 实时算？**
> 计数列是「空间换读性能」的标准取舍：列表页每篇文章都要展示计数，实时 COUNT 意味着 N+1 聚合。代价是要维护一致性——所以增删必须与计数同事务，且并发下靠数据库原子递增而不是应用层读改写。
