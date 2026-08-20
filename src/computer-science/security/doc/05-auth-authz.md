# 05 — 认证与授权

> 一句话定位：把 Cookie / Session / JWT / OAuth / OIDC 的关系理清，能回答"该用哪个、为什么"，并识别常见实现里的算法攻击与越权坑。与 04 篇一样，**一半篇幅是 `vulnerable → fixed` 成对代码**（Bun + TS）。

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 应用层 · 第 5 篇（前置：01、03、04） |
| **预计时间** | 75 分钟 |
| **面试可答** | Session vs JWT 选型、JWT 算法攻击（`alg:none`/密钥混淆）、OAuth 授权码流程、RBAC/ABAC |

---

## 1. 先分清两个词

- **认证（Authentication）**：证明"你是谁"——登录。
- **授权（Authorization）**：证明"你能干什么"——权限。

先认证、后授权，越权漏洞（04 篇 A01）本质是"授权没做好"。

---

## 2. Cookie 属性全家桶（高频面试地板题）

| 属性 | 作用 | 必须设的理由 |
|------|------|-------------|
| `HttpOnly` | JS 读不到该 Cookie | XSS 偷不走会话（见 04 篇） |
| `Secure` | 只在 HTTPS 下发送 | 防明文链路泄露 |
| `SameSite=Lax/Strict` | 跨站请求不带/少带 Cookie | 防 CSRF（见 04 篇）最省事的防线 |
| `Domain/Path` | 缩小 Cookie 生效范围 | 最小暴露面 |

```typescript
// 会话写 Cookie 的标准姿势
new Response('ok', {
  headers: {
    'Set-Cookie':
      'session_id=abc; HttpOnly; Secure; SameSite=Lax; Path=/; ' +
      `Max-Age=${7 * 24 * 3600}`
  }
})
```

> ⚠️ `SameSite=Lax` 现在浏览器默认就是，但显式写出来更符合"安全配置明确化"。

---

## 3. Session：服务端状态，客户端只拿"凭据"

**一句话人话**：登录后服务器在**服务端存一份会话数据**（内存/Redis），只给客户端发一个随机且不可猜的 `session_id`。

- 优点：**可随时吊销**（登出 = 删服务端记录），数据在己方。
- 缺点：有状态，多实例要共享存储（Redis），每次请求都要查一次。

### 💻 成对代码：Session 安全落地

```typescript
// vulnerable.ts — 危险①：session_id 用自增 ID / 时间戳，可枚举可猜
const sessionId = String(userId) // ❌ 攻击者改 id 串号
```

```typescript
// fixed.ts — 修复①：不可猜的随机数 + 服务端映射 + 过期
import { randomBytes } from 'node:crypto'

const sessions = new Map<string, number>() // 生产用 Redis，加过期时间
const createSession = (userId: number) => {
  const sessionId = randomBytes(32).toString('hex') // ✅ 128 位熵，猜不了
  sessions.set(sessionId, userId)
  return sessionId
}
```

---

## 4. JWT：无状态的令牌（含算法攻击）

**结构**：`Header.Payload.Signature` 三段，Base64URL 编码，用 `.` 连接。

```text
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.t81P5JmgEX6bCsmA4q...
 └── Header(算法)──┘ └──── Payload(载荷)────┘ └──── Signature(签名)────┘
```

**一句话人话**：令牌内容**明文可读**（Payload 只是 Base64，不是加密！），靠**签名**保证没人能篡改。

### 💻 成对代码：手写验签（危险）→ 标准库 jose（安全）

```typescript
// vulnerable.ts — 危险①：手写"验签"，完全不校验 header 里的 alg
import { createHmac } from 'node:crypto'

const [h, p, s] = token.split('.')
const header = JSON.parse(Buffer.from(h, 'base64url').toString())

if (header.alg === 'none') {
  // ❌ 攻击者把 alg 改成 none、伪造任意 payload，这里直接放行 —— 等于没验签
  return JSON.parse(Buffer.from(p, 'base64url').toString())
}
```

```typescript
// fixed.ts — 修复①：用 jose，显式白名单算法，禁止 none
import { jwtVerify, SignJWT } from 'jose'

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!) // ✅ 密钥绝不出现在代码里

const { payload } = await jwtVerify(token, secretKey, {
  algorithms: ['HS256'] // ✅ 白名单算法：谁也别想用 none 或别的算法偷换
})
// payload.userId 来自服务端签名，可信
```

### 💻 成对代码：RS256 → HS256 密钥混淆攻击

**发生**：服务端用 **RS256**（非对称：公钥验签），但验签代码允许算法来自 Header。攻击者 `alg: HS256`（对称），并**用公开的公钥当 HMAC 密钥**签名——服务端只要没白名单算法，就真拿公钥去 HMAC 验，攻击成立。

```typescript
// vulnerable.ts — ❌ 算法没锁：把「RSA 公钥的内容」当 HS256 的对称密钥
const secret = new TextEncoder().encode(publicKeyPem) // 公钥是公开给人看的！
const { payload } = await jwtVerify(token, secret, {
  algorithms: ['HS256'] // ❌ 攻击者拿公开公钥当 HMAC 密钥签一个 admin token，这里验得过去
})
```

```typescript
// fixed.ts — ✅ 修复：算法白名单锁死 RS256，且用真正的 RSA 公钥对象验签
const { payload } = await jwtVerify(token, publicKey, {
  algorithms: ['RS256'] // 只认非对称 RS256，HS256 直接拒 —— 密钥混淆攻击失效
})
```

> ⚠️ 最小化口诀：**JWT 三件套缺一不可**——① HTTP-Only Cookie 或安全渠道传递（防 XSS 偷）；② 标准库 + 算法白名单（防伪造）；③ 短 `exp` + 重要状态留服务端（防无法吊销）。

### JWT 的"已知缺点"（面试必问）

| 缺点 | 说明 | 应对 |
|------|------|------|
| **注销难** | 无状态 = 服务端不知道你"签过几个 token" | 短过期 + 黑名单（或干脆 Session） |
| **泄露即失效难收回** | Token 被偷无法作废，有效期就是裸奔期 | 短 exp + refresh token 机制 |
| **体积** | 每请求都带、Header 里塞 PID/角色会更大 | 只放必要 claim，别塞大对象 |
| **密钥是单点** | 一个密钥泄露 = 全部令牌可伪造 | 密钥管理（Vault/环境变量）+ 轮换 |

### Session vs JWT：选型表

| 维度 | Session | JWT |
|------|---------|-----|
| 状态 | 服务端有状态 | 无状态 |
| 吊销/登出 | 删记录即可 | 麻烦（等过期/黑名单） |
| 跨域/多端共享 | 要共享存储 | 天然可携带 |
| 适用 | 单体、强会话控制（管理后台、金融） | 无状态 API、SSO、微服务网关透传 |

> 💡 面试速答：**不是 JWT 更好，是两个"状态管理方式"**。要控制力选中方，要轻盈跨域选 JWT；很多系统实际是"登录态 Session + 授权令牌 JWT"混用。

---

## 5. OAuth 2.0 与 OIDC：把登录外包给第三方

**OAuth 2.0**（授权框架，不是身份认证）：让第三方 App 在你同意下，代表你访问你的资源。四个角色：

| 角色 | 是谁 | 例子 |
|------|------|------|
| **Resource Owner** | 资源所有者（用户本人） | 你 |
| **Client** | 要访问资源的第三方应用 | 小红书要读你的微信头像 |
| **Authorization Server** | 发令牌的服务器 | 微信开放平台 |
| **Resource Server** | 持有资源的服务器 | 微信用户信息接口 |

**授权码流程（最安全、最常用）**：

```mermaid
sequenceDiagram
    participant U as 用户
    participant C as 第三方 Client
    participant A as 授权服务器
    participant R as 资源服务器

    U->>C: 点击"微信登录"
    C->>A: 跳转授权页(带 client_id, redirect_uri)
    U->>A: 登录并同意授权
    A-->>C: 302 回 redirect_uri?code=授权码（一次性）
    C->>A: 用 code + client_secret 换 access_token
    A-->>C: access_token + refresh_token + 过期时间
    C->>R: 带 access_token 请求用户信息
    R-->>C: 返回用户资料
```

要点：
- **code 一次性、必须服务端换**（不能在前端换 → secret 会暴露）；
- **redirect_uri 必须校验**（防开放重定向漏洞）;
- **refresh_token 长寿命、只能服务端持有**，用于 access_token 过期后续期；
- **OAuth 2.1**：比 2.0 更严的收敛（默认 PKCE、隐式模式取消等），了解"2.1 更安全收敛"即可。

**OIDC（OpenID Connect）**：在 OAuth 之上加了**身份层**——返回 `ID Token`（JWT），里面是"你是谁"（sub、email…）。企业 SSO、`登录 SDK` 大多是"OAuth 授权 + OIDC 身份"的组合。

> 💡 面试一句话：**OAuth 管"授权访问资源"，OIDC 管"告诉你是谁"**；OIDC = OAuth 2.0 + 标准化的 ID Token。

---

## 6. 授权模型：RBAC / ABAC

| 模型 | 一句话人话 | 例子 |
|------|-----------|------|
| **RBAC**（基于角色） | 把权限打包成"角色"，用户挂角色 | 员工 → `admin` / `editor` / `viewer` |
| **ABAC**（基于属性） | 用"属性规则"动态判断 | `owner_id == userId && status == 'active'` 才放行 |

- 全栈落地：**API 层的授权检查 = 04 篇越权防御的正式实现**；RBAC 管"能不能进这个功能"，ABAC 管"这笔数据属不属于你"。
- 常见翻车：只做了"有没有登录/角色"，漏了"对象所有权"——IDOR。

---

## 7. MFA / 2FA 与登录工程陷阱

- **MFA（多因素认证）**：密码（你知道的）+ 验证码/App（你拥有的）+ 生物（你是的）中取两类。**对付撞库和凭证泄露的最终防线**，能开就开。
- **WebAuthn / Passkey（FIDO2）**：用设备内置硬件密钥（Touch ID / Windows Hello）做**无密码认证**——"天生的 MFA"，正成为企业登录标配，面试聊 MFA 时带出是加分项。
- 登录工程陷阱速查：
  - 别把"用户名不存在/密码错误"分开提示（防枚举）；
  - 登录失败限速（防爆破）；
  - 密码复杂度校验在**服务端**做；
  - 会话过期要有（不无限登录）。

---

## 🆚 对比板块：Session vs JWT vs OAuth（一次性看清三层）

| 技术 | 解决什么 | 状态 | 典型身份 |
|------|---------|------|---------|
| **Session** | 登录后维持会话 | 服务端有状态 | 自家站点登录 |
| **JWT** | 无状态令牌 | 无状态 | 自家 API / 微服务 |
| **OAuth 2.0** | 授权第三方访问 | 授权码/令牌 | "用微信登录某 App" |
| **OIDC** | 标准化的第三方身份 | ID Token (JWT) | 企业 SSO |

**不是替换关系**：OAuth/OIDC 签出来的 access_token / ID Token 常就是 JWT 格式；你自己的登录态又常是 Session。四者叠加不冲突。

---

## ❓ 面试问答

> **问：Session 和 JWT 怎么选？**
> **答：** 看你要不要"控制力"。要随时吊销登录、状态在服务端（后台/金融），用 Session + Redis；要无状态、跨域透传（网关/微服务/移动端），用 JWT，但接受"注销难、泄露难收回"，用短 exp 缓解。

> **问：JWT 的算法攻击有哪些？怎么防？**
> **答：** 两种经典：`alg:none`（不签名就通过）和 `RS256→HS256` 密钥混淆（用公开公钥当 HMAC 密钥造假）。防法统一：**用标准库（如 jose）+ `algorithms` 白名单**，绝不信任 Header 里声明的 alg。

> **问：OAuth 2.0 授权码流程为什么用 code 而不是直接发 token？**
> **答：** token 拿取需要 `client_secret`，只有**后端服务**能安全持有。流程里授权服务器先发一次性 code，客户端后端再用 code + secret 换 token——前端全程碰不到 token 和 secret，降低泄露面。

> **问：RBAC 和 ABAC 什么区别？**
> **答：** RBAC 按角色批量授权（简单、够用），ABAC 按属性规则动态判断（灵活、细粒度）。全栈场景通常 RBAC 管功能权限 + ABAC 补对象所有权（防 IDOR）。

---

## 🎮 练习

**要求**：用 Express（技术栈按 `agents.md` §5.6）分别实现 Session 认证与 JWT 认证，并列出各自的"登出 / 续期"写法。
**提示**：Session 登出 = 删服务端记录；JWT 登出 = 短 exp + 黑名单（或前端删 token 仅为"假登出"）——把差异落成代码清单。
**预期效果**：能讲清"该用哪个、为什么"，面试被追问算法攻击时直接甩 jose 白名单代码。

---

## 🔗 继续阅读

- 上一篇：[04-web-attacks.md](04-web-attacks.md) Web 攻击面（这里讲的算法攻击/越权都在那边打了底）
- 密码哈希怎么存：见 [03-cryptography-primer.md](03-cryptography-primer.md) §2
- 令牌传输安全与密钥管理：下一篇 [06-transport-data-security.md](06-transport-data-security.md)