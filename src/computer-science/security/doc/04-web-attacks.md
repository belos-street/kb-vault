# 04 — Web 攻击面与防御（OWASP Top 10:2025）

> 本系列的重心篇：全栈面试 80% 的安全题落在这里。读法统一为 **发生 → 危害 → 防御**，且至少一半篇幅是 `vulnerable → fixed` 成对代码（Bun + TS 伪代码级示意，核心依赖用注释标出），白话只做铺垫。

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 攻击面层 · 第 4 篇（前置：01 术语、03 密码学） |
| **预计时间** | 90 分钟（建议分两次读） |
| **面试可答** | XSS/CSRF 区别与防御、CORS 定位、SSRF 与越权、ORM 为什么不等于免注入、原型污染 |

---

## 1. 先立一个心智：攻击不是魔法，而是"信任被滥用"

所有 Web 漏洞都可以压缩成一个句式：**某个本该被校验/隔离的东西，被当成了可信输入**。读下面的词条时，每个都请你套这个句式——"谁被误信了？"。

OWASP Top 10:2025 全貌表见 [01 篇 §5](01-security-terms.md)，本章逐类展开。

---

## 2. A01 访问控制失效（含 SSRF、越权）— 连续榜首

**发生**：接口只校验"你登录了没"，没校验"你**有权限访问这个资源**吗"。
**危害**：用户 A 看用户 B 的资料、普通账号点管理接口——数据泄露的第一大来源。
**防御**：服务端**每个资源访问都做授权检查**，默认拒绝；不用前端隐藏当作防线。

**代表性子类（记这三个缩写，面试高频）**：

| 缩写 | 全称 | 一句话人话 |
|------|------|-----------|
| **IDOR** | Insecure Direct Object Reference | 改 URL 里的 id 就能访问别人的资源 |
| **BOLA** | Broken Object Level Authorization | API 场景的 IDOR：对象级越权（id 换掉就串号） |
| **BFLA** | Broken Function Level Authorization | 功能级越权：普通用户直接调管理员接口 |

### 💻 成对代码：越权检查

```typescript
// vulnerable.ts — 危险：没检查"这份订单是不是你的"
import { Database } from 'bun:sqlite'

Bun.serve({
  routes: {
    'GET /api/order/:id': (req) => {
      // ⚠️ 假设已经校验过登录（拿到了 userId）
      const userId = getUserId(req)
      const order = db
        .query('SELECT * FROM orders WHERE id = ?')
        .get(req.params.id)
      return Response.json(order) // ❌ 别人的单子也能读
    }
  }
})
```

```typescript
// fixed.ts — 修复：查询条件带上所有者，越权自然查不到
Bun.serve({
  routes: {
    'GET /api/order/:id': (req) => {
      const userId = getUserId(req) // 来自可信会话，不是前端传的
      const order = db
        .query('SELECT * FROM orders WHERE id = ? AND owner_id = ?')
        .get(req.params.id, userId)
      if (!order) return new Response('Not Found', { status: 404 }) // 404 而非 403，避免探测
      return Response.json(order)
    }
  }
})
```

> 💡 测试思路（自己验自己）：注册两个账号 A/B，用 A 的 token 请求 B 的资源 id，能读到就是越权。**这是你 review 自己接口最快的一招**。

**SSRF（Server-Side Request Forgery，服务器端请求伪造）**也已并入 A01：让**服务器**去请求攻击者指定的地址（图片代理、URL 预览、webhook 这类"帮你拉取外部 URL"的功能是重灾区）。防御 = 只允许 http/https 且**校验 URL 解析后的 host**（防 `127.0.0.1`、内网网段、DNS 重绑定），必要时走白名单域、阻断到内网/元数据地址（如云厂商的 `169.254.169.254`）。

---

## 3. A02 安全配置错误 — 从第 5 名升到第 2 名

**发生**：默认口令没改、云存储桶公开、多余端口开放、报错信息太详细、debug 模式留到生产。
**危害**：不需要任何"高深攻击"，扫一遍配置就有肉吃。
**防御**：
- 默认口令**强制首次修改**，弱口令直接不允许；
- 云桶/对象存储权限默认私有，按最小授权开放；
- 生产关闭 stack trace，统一错误页；
- 基础设施即代码（IaC）里跑**配置扫描**（见 07 篇）。

---

## 4. A03 供应链失效 + A08 完整性失效 — 详述在 07 篇

A03 已从 2021 的"使用有漏洞组件"扩成整条"依赖 → 构建 → 分发"链路（投毒的包、被黑的 CI）。A08 关心"软件和数据完整性"：反序列化、签名缺失。两者在 [07-engineering-cheatsheet.md](07-engineering-cheatsheet.md) 展开，这里先记一句话：**别信任来自链条下游的东西，能验签就验签。**

---

## 5. A04 加密失效 — 承接 03 篇

**发生**：明文传密码、用 MD5 存密码、自己造加密算法、TLS 配旧版本。
**防御**：传输用 TLS 1.2+（见 06 篇）；存储密码用 bcrypt/argon2（见 [03 篇 §2](03-cryptography-primer.md)）；**永远不要自己发明加密**——用标准库与成熟算法。

---

## 6. A05 注入 — 本类给三个 JS/全栈特写

**发生**：用户输入被拼进 SQL/命令/模板，被当成**代码**执行。
**危害**：拖库、删库、命令执行、权限提升。
**基础版防御**：参数化查询 + 输入白名单。

### 💻 成对代码 ①：SQL 注入（字符串拼接 vs 参数化）

```typescript
// vulnerable.ts — 危险：字符串拼接
// ⚠️ Bun 路由没有 req.query，用 URL API 取参（下面 fixed 侧同理）
const id = new URL(req.url).searchParams.get('id') ?? ''
const row = db
  .query(`SELECT * FROM users WHERE id = ${id}`) // ❌ 传入 `1 OR 1=1` 全表带出
  .get()
```

```typescript
// fixed.ts — 修复：参数化，值永远作为数据
const id = new URL(req.url).searchParams.get('id') ?? ''
const row = db
  .query('SELECT * FROM users WHERE id = ?') // ✅ 库自己处理转义
  .get(id)
```

### 💻 成对代码 ②：ORM 不等于免注入！

**发生**：项目用了 Prisma/TypeORM 就以为安全了，却在 **raw query 或排序字段**上把用户输入拼了进去。

```typescript
// vulnerable.ts — ❌ raw 查询照样踩坑：排序字段被拼成 SQL 文本
// 注解：`prisma.$queryRaw` 的模板字符串是参数化的（安全）；`$queryRawUnsafe` + 拼串才是翻车点
const orderBy = new URL(req.url).searchParams.get('orderBy') ?? '' // "name; DROP TABLE users;--"
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users ORDER BY ${orderBy}` // ❌ SQL 文本拼接，列名注入成功
)
```

```typescript
// fixed.ts — 修复：白名单映射后走 ORM 引擎（值永远不拼进 SQL 文本）
const ORDER_COLUMNS = ['createdAt', 'name', 'email'] as const
const key = new URL(req.url).searchParams.get('orderBy') ?? 'createdAt'
const orderBy = ORDER_COLUMNS.includes(key as never) ? key : 'createdAt' // ✅ 只有白名单值能进
const users = await prisma.user.findMany({ orderBy: { [orderBy]: 'asc' } }) // ✅ 拼对象字段，不拼 SQL
```

### 💻 成对代码 ③：原型污染（JS 深度 merge 的坑）

**发生**：`_.merge` 这类**深度合并**被拿来合并用户提交的 JSON（配置、请求体、表单数据），攻击者用 `{"__proto__": {"isAdmin": true}}` 污染对象原型，进而影响全应用对象。

```typescript
// vulnerable.ts — 危险：无脑深度合并用户输入
import { merge } from 'lodash'
const config = { theme: 'dark', features: { export: false } }
//           用户请求体 JSON 里塞 __proto__ / constructor.prototype
const applied = merge(config, JSON.parse(body)) // ❌ 原型链被污染
```

```typescript
// fixed.ts — 修复：拒绝危险键 + 只合并白名单键；值永不进原型链
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype'])

function safeMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (FORBIDDEN.has(k)) continue // ✅ 危险键直接丢弃
    result[k] =
      v && typeof v === 'object' && !Array.isArray(v)
        ? safeMerge((result[k] as Record<string, unknown> | undefined) ?? {}, v as Record<string, unknown>)
        : v
  }
  return result
}
```

> 💡 一句话记：**深度 merge = 危险函数**，默认用白名单/浅合并或 `structuredClone`。

### 💻 一句话特写：NoSQLi 与命令注入

- **NoSQLi**：没有 SQL 就没有注入？错——MongoDB 的运算符照样能当"代码"用。登录接口直接拼查询对象时，`{"username": "admin", "password": {"$ne": ""}}` 即可绕过密码校验。防御：请求体**白名单字段 + 类型校验**，查询走 ORM 结构，运算符由代码写死而非用户传。
- **命令注入**：`exec('ping ' + host)` 把输入拼进 shell，`host = 1.1.1.1; rm -rf /` 就炸了。防御：**永远用参数数组调用**（Node 的 `spawn` / `execFile` 不经 shell 执行），输入只当"数据"不当"命令"。

---

## 7. A06 不安全设计 + A07 认证失效 + A09/A10

| 类别 | 一句话人话 | 防御 |
|------|-----------|------|
| **A06 不安全设计** | 信任边界画错（把前端校验当安全边界） | 服务端为唯一信任边界，威胁建模前置（见 01 篇 STRIDE） |
| **A07 认证失效** | 撞库、暴力破解、会话被偷 | 速率限制 + MFA + 防枚举（登录失败随机返回同质文案） |
| **A09 日志与告警缺失** | 出事没有痕迹，无法溯源 | 结构化日志 + 关键事件告警（见 07 篇） |
| **A10 异常处理不当** | 500 页泄露堆栈、异常不兜底导致崩溃 | 统一兜底中间件，对外只回"服务器错误"，内部记日志 |

**文件上传**（另一个高频位点，面试爱考）：只允许白名单扩展名 + 校验文件内容（魔术字节）而不是只看后缀；**文件名重命名后再存**，且文件名永不拼进路径（防路径穿越）；可执行性内容先过沙箱/扫描（02 篇的沙箱）。

---

## 8. 浏览器侧防线：CSP / CORS / SameSite / HttpOnly

这四件事绕不开，也是面试组合拳，单独成节。

### 8.1 CSP 与 HttpOnly：XSS 的后手

- **CSP（Content-Security-Policy）**：告诉浏览器"这个页面只允许加载来自哪里 的资源/脚本"。即使 XSS 打进去，`script-src 'self'` 也直接拦掉外部脚本。
- **HttpOnly**：Cookie 加 `HttpOnly` 后，`document.cookie` 读不到它——XSS 偷不了会话。这是"藏钥匙"，CSP 是"锁门"。

### 8.2 XSS（跨站脚本）的本质与防御

**发生**：用户输入被当成 HTML/JS **渲染执行**。
**三种**：存储型（存进服务器每次读到都执行）、反射型（URL 参数回显执行）、DOM 型（纯前端 `innerHTML`）。

```typescript
// vulnerable.tsx — 危险：把评论直接 innerHTML 进去
// HTML: <div id="comments"></div>
const comment = await getComment(id) // 用户提交的: <img src=x onerror=alert(1)>
document.getElementById('comments')!.innerHTML = comment.text // ❌ 执行！
```

```typescript
// fixed.ts — 修复：用 textContent 只当文本，永远不要 innerHTML 渲染用户内容
const el = document.createElement('div')
el.textContent = comment.text // ✅ 变成纯文本，脚本永不执行
document.getElementById('comments')!.appendChild(el)
// 兜底：再加 CSP: default-src 'self'，双保险
```

### 8.3 CSRF 与 CORS：最容易混淆的一对

**CSRF（跨站请求伪造）**：用户在 A 站登录着，去 B 站点了恶意链接，B 站的请求"借"了 A 站的 Cookie 发出（因为浏览器会自动带 Cookie）。
**防御**：`SameSite=Lax/Strict`（默认就是 Lax）+ 敏感操作校验自定义 Header 或 CSRF Token。

**CORS（跨域资源共享）**：浏览器**同源策略**的"放宽开关"——默认浏览器禁止跨站读响应，CORS 头是服务器**显式允许**某来源读取。**它不是安全防线，反而是"你在放宽"**。

```typescript
// vulnerable.ts — 危险：CORS 开成 * 还带 credentials
Bun.serve({
  routes: {
    '/api/user': () => {
      const headers = new Headers()
      headers.set('Access-Control-Allow-Origin', '*') // ❌ 配 * 又带 Cookie = 全站裸奔
      headers.set('Access-Control-Allow-Credentials', 'true')
      return Response.json(getUser(), { headers })
    }
  }
})
```

```typescript
// fixed.ts — 修复：精确白名单来源，明确安全域，不带凭据的请求不给
const ALLOWED_ORIGINS = new Set(['https://admin.example.com'])
const origin = req.headers.get('origin')
const originOK = origin && ALLOWED_ORIGINS.has(origin)

const headers = new Headers()
if (originOK) {
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Credentials', 'true')
}
return Response.json(originOK ? getUser() : { error: 'denied' }, { headers })
```

> 💡 面试秒答口径：**CORS 是"放开读"，CSRF 是"借力发请求"**；CORS 拒绝的是读取，CSRF 靠同源策略之外的请求伪造——防 CSRF 用 SameSite + Token，防 XSS 用编码 + CSP + HttpOnly。

---

## 🆚 对比板块：四类"浏览器侧"失效对照

| 维度 | XSS | CSRF | CORS 误配 | Cookie 乱发 |
|------|-----|------|-----------|------------|
| 攻击方 | 注入脚本进页面 | 借受害者的凭证发请求 | 恶意站点读到你的响应 | 凭证被非目标页带上 |
| 载体 | 用户输入/内容 | 第三方站点发起的请求 | 服务器响应头 | Cookie 本身 |
| 主防御 | 编码 + CSP + HttpOnly | SameSite + Token | 精确白名单 Origin | 限定 Domain/Path + Secure |

---

## ❓ 面试问答

> **问：XSS 和 CSRF 的区别？**
> **答：** XSS 是"坏代码进了我的页面"（注入执行），危害是偷 Cookie、操控页面；CSRF 是"我的请求被第三方冒发"（借用凭证），危害是替用户执行操作。防御方向不同：XSS 防"执行"（编码/CSP/HttpOnly），CSRF 防"冒发"（SameSite/Token）。

> **问：CORS 是安全机制吗？**
> **答：** 不是。它是同源策略的**放宽**。默认浏览器不让跨站读响应，配 CORS 是你主动允许某个来源读取。所以 CORS 配错是"把门开大了"，配 `*` + `credentials` 是灾难级别。

> **问：什么是 SSRF？开发里怎么遇到、怎么防？**
> **答：** 让服务端去请求攻击者指定的 URL。图片代理、网页预览、webhook 这类功能都有份。防：协议白名单（仅 http/https）+ 解析后校验 host 不在内网/元数据网段 + 必要时限制响应或走专用代理。

> **问：用了 ORM 就不会有 SQL 注入吗？**
> **答：** 不是。参数化 API 安全，但 raw query、排序/表名字段、动态拼接仍然可以踩坑（见 §6 成对代码②）。原则是**用户可控的标识符（列名/表名）永不进 SQL 文本**。

---

## 🎮 练习

**要求**：本地起一个靶场（DVWA，或自己写两个接口），亲手触发一次 SQL 注入与一次反射型 XSS。
**提示**：只在自己机器上玩，遵守边界——**绝不拿这套手法打任何真实站点**。
**预期效果**：把"概念"变"亲历"，再回头看成对代码的 fixed 侧，防护才有体感。

---

## 🔗 继续阅读

- 上一篇：[03-cryptography-primer.md](03-cryptography-primer.md) 密码学基础
- 认证失效的防御 —— 下一篇 [05-auth-authz.md](05-auth-authz.md) 认证与授权
- 供应链/配置扫描等工程化防御：[07-engineering-cheatsheet.md](07-engineering-cheatsheet.md)
- 术语对照：[01-security-terms.md](01-security-terms.md)