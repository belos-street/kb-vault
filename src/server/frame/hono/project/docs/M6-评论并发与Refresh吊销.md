# M6 评论、并发与 Refresh 吊销

> 所属：[project](../) 实现教学 ｜ 前置：[M5](./M5-文章CRUD与状态机.md) ｜ 对应代码：`prisma/schema.prisma`（RefreshToken）、`src/schemas/comments.ts`、`src/services/comments.ts`、`src/routes/comments.ts`、`src/routes/auth.ts`

**一句话定位**：两个「企业级补丁」——评论计数与增删同事务维护（读性能换一致性），RefreshToken 表补上 JWT 的服务端吊销能力（FR-18 提级 P1）。

**面试可答**：纯 JWT 的 refresh 是无状态的，登出后旧 refresh 依然有效到自然过期——服务端吊销表让「删行即失效」成为可能，轮换从「替换」升级为「可撤销的替换」。

---

## 1. 评论：计数与写入同一事务

```ts
const comment = await prisma.$transaction(async (tx) => {
  const created = await tx.comment.create({ data: { postId, authorId: user.id, content } })
  await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } })
  return created
})
```

三个要点：

- **数据库原子递增**而非应用层读改写——`increment` 编译成 `SET commentCount = commentCount + 1`，并发下不丢更新（M8 用 5 并发评论对账 count=5 锁定）
- **事务绑定**：评论写入与计数要么都发生要么都不发生，删评论对称 `decrement`
- 可见性规则：仅 `PUBLISHED` 可评；对不可见文章评论 → 404（不泄露存在性）；可见但非 PUBLISHED（作者评自己的 DRAFT）→ 422

## 2. RefreshToken 表：服务端吊销（FR-18）

```prisma
model RefreshToken {
  tokenHash String   @unique   // 只存 JWT 的 SHA-256 哈希——库泄露拿不到可用 token
  userId    String
  expiresAt DateTime
  @@index([userId])
}
```

纯 JWT refresh 的被动安全缺口：**登出后旧 refresh 依然有效 7 天**，服务端没有状态可撤销。三个动作闭环：

| 动作 | 行为 |
|------|------|
| 登录 | 写入新 token 的哈希行 |
| 刷新 | 同事务删旧行 + 写新行（轮换） |
| 登出/被盗 | 删行——旧 refresh 即使未过期也无法再换新 |

刷新侧变成**双重校验**：JWT 签名合法 **且** 服务端行存在。hash 而非原文入库，是「数据库泄露≠token 泄露」的纵深防御。

### ⭐ 踩坑实录：jti 必须加

refresh payload 若只有 `sub/typ/exp`，同一秒内两次登录生成**字节级相同**的 JWT → SHA-256 相同 → 撞 `tokenHash @unique` 约束 500。加 `jti: randomUUID()` 一劳永逸——「同秒碰撞」是时间粒度设计的经典暗坑。

### ⭐ 踩坑实录：迁移后 client 没刷新

`migrate dev` 后 `prisma.refreshToken` 是 undefined，所有登录 500——生成物没跟上 schema。显式 `bunx prisma generate` 解决；CI 里把 generate 放在 build 前也是同一原因。

## 3. 测试锁定（tests/comments.test.ts、tests/concurrency.test.ts）

- 轮换后旧 refresh → 401；登出后旧 refresh → 401（吊销语义）
- 评论增删后详情 `commentCount` 对账；重复删除 → 404
- 并发：同 version 双写一 200 一 409（乐观锁，M5 的模式在评论场景回归）
- 删文章级联软删评论（M5 逻辑的回归覆盖）

## 4. 对比板块：refresh token 三种管理方式

| 方式 | 撤销 | 服务端状态 | 适用 |
|------|------|-----------|------|
| 无状态 JWT（M4 初版） | ❌ 等自然过期 | 无 | 内部工具、超短有效期 |
| **吊销表（本项目）** | ✅ 删行即失效 | 一行/token | 有登出语义的 Web 应用 |
| Redis 会话黑名单 | ✅ TTL 自清理 | 键值 | 高频刷新、多端会话管理 |

## 5. 自测

- [ ] 刷新接口的双重校验，缺了「行存在」检查会退回到什么状态？
- [ ] 为什么存 `tokenHash` 而不是 token 原文？存原文的攻击链是什么？
- [ ] `commentCount` 的 decrement 为什么也放事务里？不放会出什么账？

### 自测参考

- 退回无状态 JWT：登出/被盗后旧 refresh 7 天内有效，轮换也只是「替换」而非「撤销」
- 存原文 = 库泄露等于拿到全部可用 refresh，可直接登录任意账户；hash 后还需攻破哈希
- 删了评论计数没减（或反之）——账目漂移且并发下可能漂出负数，之后每次读都是错的

---

## 🔗 参考资料

- OWASP Session Management：https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_CheatSheet.html
- 教程对应节：[10-实战B §3](../../doc/10-实战B-企业级REST-API.md)

## 📌 小结

- 吊销表把 JWT 从「签发即失控」变成「可撤销会话」，轮换 = 删旧写新同事务
- jti 防同秒碰撞；hash 入库防库泄露升级为 token 泄露
- 计数一致性 = 原子递增 + 事务绑定 + 并发测试对账，三件缺一不可
