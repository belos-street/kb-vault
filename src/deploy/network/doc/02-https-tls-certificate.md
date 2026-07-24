# 02 — HTTPS/TLS 与证书管理

> 对应 Day 2 学习内容 · 目标产出：理解 TLS 握手过程，能为站点配置 Let's Encrypt 证书

---

## 1. 为什么需要 HTTPS

### 1.1 明文 HTTP 的三大风险

HTTP 协议以明文传输数据，这在早期互联网尚可接受，但今天已完全不能满足安全需求。明文 HTTP 面临三个核心风险：

| 风险 | 说明 | 现实场景 |
|------|------|----------|
| **窃听（Eavesdropping）** | 攻击者可以截获网络包，直接读取传输内容 | 在公共 Wi-Fi 上抓包获取密码、信用卡号 |
| **篡改（Tampering）** | 攻击者可以修改传输中的数据，植入恶意内容 | ISP 注入广告、运营商劫持页面 |
| **冒充（Impersonation）** | 攻击者可以伪装成目标服务器，用户无法辨别真假 | DNS 劫持指向钓鱼网站 |

HTTPS = HTTP + TLS（Transport Layer Security），通过加密、完整性校验和身份认证，一次性解决上述三个问题。

### 1.2 对称加密 vs 非对称加密

TLS 同时使用了对称加密和非对称加密，理解它们的区别是掌握 TLS 的基础。

| 特性 | 对称加密 | 非对称加密 |
|------|----------|------------|
| **密钥** | 双方使用同一个密钥 | 公钥加密、私钥解密（或相反） |
| **速度** | 极快（硬件加速可达 Gbps 级别） | 慢（比对称加密慢 1000 倍以上） |
| **安全性** | 密钥分发困难，一旦泄露全部失效 | 私钥不外传，安全性更高 |
| **密钥分发** | 需要安全的带外信道分发密钥 | 公钥可公开分发，无需安全信道 |
| **典型算法** | AES, ChaCha20, 3DES | RSA, ECDSA, Ed25519 |
| **使用场景** | 加密实际传输数据 | 密钥交换、数字签名 |

**TLS 中的分工：** 非对称加密用于握手阶段的身份认证和密钥交换，协商出一个临时的对称密钥（Session Key）；对称加密用于握手完成后实际数据的批量加密传输。这种组合兼具安全性和性能。

### 1.3 数字签名与 CA 的作用

非对称加密解决了密钥分发问题，但引入了一个新问题：**你拿到的公钥真的是服务器的公钥吗？**

这就是**中间人攻击（MITM）** 的场景——攻击者在客户端和服务器之间拦截连接，客户端拿到的是攻击者的公钥而非服务器的公钥。

**CA（Certificate Authority，证书颁发机构）** 是解决这个信任问题的核心：

1. 服务器向 CA 证明自己拥有域名（如通过 DNS 验证或 HTTP 挑战）
2. CA 签发数字证书，将自己的信任传递给服务器
3. 数字证书包含：服务器公钥、域名、CA 签名等信息
4. 浏览器/操作系统内置了受信任的 CA 根证书列表
5. 客户端通过 CA 的数字签名验证证书的真实性，链条追溯到根证书

> 一句话总结：**CA 是互联网信任链的"身份证颁发机构"，数字签名是防伪标记。**

---

## 2. TLS 1.3 握手流程

### 2.1 完整 1-RTT 握手（Mermaid 时序图）

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: ClientHello (TLS 版本、支持的密码套件、Key Share 公钥、随机数)
    Note over Client,Server: ← 1-RTT →
    Server-->>Client: ServerHello (选定密码套件、服务器 Key Share 公钥、随机数)
    Server-->>Client: EncryptedExtensions
    Server-->>Client: Certificate (证书链)
    Server-->>Client: CertificateVerify (对握手消息的数字签名)
    Server-->>Client: Finished (握手消息 MAC)
    Note over Client,Server: 客户端验证证书链和签名
    Client->>Server: Finished (握手消息 MAC)
    Note over Client,Server: ← 至此握手完成，开始加密通信 →
    Client->>Server: GET / HTTP/1.1 (Application Data)
    Server-->>Client: HTTP 200 OK (Application Data)
```

### 2.2 握手步骤详解

| 步骤 | 方向 | 内容 | 作用 |
|------|------|------|------|
| **ClientHello** | C → S | TLS 版本、密码套件列表、Client Random、Key Share（公钥） | 告知服务器支持的参数，提前发送密钥材料 |
| **ServerHello** | S → C | 选定的密码套件、Server Random、Key Share（公钥） | 确定密码参数，完成密钥交换 |
| **EncryptedExtensions** | S → C | 非关键扩展信息（如 ALPN） | 协商应用层协议 |
| **Certificate** | S → C | 服务器证书链（含叶子证书和中间证书） | 提供身份凭证 |
| **CertificateVerify** | S → C | 对之前所有握手消息的数字签名 | 证明服务器持有证书私钥 |
| **Finished** | S → C / C → S | 握手消息的 MAC 校验值 | 确认握手未被篡改 |

握手完成后，客户端和服务器已计算出相同的对称密钥（通过 ECDHE 密钥交换），开始加密数据传输。

### 2.3 TLS 1.2 vs TLS 1.3 对比

| 对比维度 | TLS 1.2 | TLS 1.3 |
|----------|---------|---------|
| **握手 RTT 次数** | 2-RTT（完整握手） | 1-RTT（完整握手） |
| **0-RTT 模式** | 不支持 | 支持（需权衡重放攻击风险） |
| **移除的算法** | — | 移除 RSA 密钥交换、RC4、3DES、CBC 模式等不安全算法 |
| **支持的密码套件** | 数十种组合 | 仅 5 种 AEAD 套件，强制 PFS（完美前向保密） |
| **握手消息加密** | 部分消息明文传输 | Certificate/CertificateVerify 等消息加密传输 |
| **性能** | 慢，协商复杂 | 快，简化握手，减少延迟 |

> **面试追问：为什么 TLS 1.3 移除了 RSA 密钥交换？**
> 因为 RSA 密钥交换不支持**完美前向保密（PFS）**。如果攻击者记录了所有加密流量，日后获取了服务器私钥，就能解密所有历史会话。而 TLS 1.3 强制使用 ECDHE，每次会话的临时密钥不依赖私钥，私钥泄露不影响历史会话安全。

### 2.4 面试常追问：为什么需要证书链而不是单个证书？

单个证书存在两个问题：

1. **根证书私钥风险极高**：如果 CA 的根证书私钥泄露，整个信任体系崩塌。CA 通常将根证书私钥保存在离线 HSM（硬件安全模块）中，用根证书签发**中间 CA 证书**用于日常签发。
2. **浏览器的信任灵活性**：浏览器信任根证书，但可以单独撤销某个中间 CA 的信任，而不影响整个根 CA 的信任链。

```
Root CA（自签名，离线保存）
  └── Intermediate CA（由根 CA 签发，用于实际签发）
       └── Server Certificate（由中间 CA 签发）
```

服务器在握手中发送完整的证书链（Server Certificate + 中间证书），浏览器验证链条直到本地信任的根证书。如果缺少中间证书，部分浏览器（如 Android）可能不信任该站点。

---

## 3. 证书管理实战

### 3.1 证书文件格式

实际运维中会遇到多种证书文件格式，区别如下：

| 格式 | 扩展名 | 内容 | 特点 |
|------|--------|------|------|
| PEM | `.crt` / `.pem` / `.key` | Base64 编码，`-----BEGIN CERTIFICATE-----` 包裹 | 最常用，纯文本，可包含证书链 |
| DER | `.cer` / `.der` | 二进制编码 | Windows 常用，不可直接查看 |
| PKCS#12 | `.p12` / `.pfx` | 二进制容器，同时包含证书和私钥 | 导入导出方便，常用于 IIS / 反向代理设备 |
| PEM 私钥 | `.key` | `-----BEGIN PRIVATE KEY-----` | 独立的私钥文件，需严格保护（权限 600） |

**日常建议：** 使用 PEM 格式（`.pem`），私钥单独存放为 `.key`，权限设为 600 或 400。

### 3.2 OpenSSL 常用命令

```bash
# 查看证书内容
openssl x509 -in example.com.crt -text -noout

# 查看证书链（验证中间证书是否完整）
openssl crl2pkcs7 -nocrl -certfile example.com.crt | openssl pkcs7 -print_certs -text -noout

# 生成自签名证书（用于测试环境）
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout self-signed.key \
  -out self-signed.crt \
  -days 365 \
  -subj "/CN=localhost"

# 验证证书链是否完整
openssl verify -CAfile ca.crt -untrusted intermediate.crt server.crt

# 检查证书过期时间
openssl x509 -in example.com.crt -noout -dates

# 检测远程服务器证书链
openssl s_client -connect example.com:443 -showcerts
```

### 3.3 Let's Encrypt + Certbot

Let's Encrypt 是一个免费的、自动化的 CA，通过 ACME 协议自动签发证书。Certbot 是最流行的 ACME 客户端。

```bash
# 安装 Certbot（Ubuntu/Debian）
sudo apt install certbot python3-certbot-nginx

# 安装 Certbot（CentOS/RHEL）
sudo yum install certbot python3-certbot-nginx

# 自动申请并配置 Nginx
sudo certbot --nginx -d example.com -d www.example.com

# 仅申请证书，不自动配置 Nginx
sudo certbot certonly --nginx -d example.com

# 手动模式（需自己配置 Web 服务器验证）
sudo certbot certonly --manual -d example.com --preferred-challenges dns
```

申请成功后的证书文件位置：

```
/etc/letsencrypt/live/example.com/
├── cert.pem      # 服务器证书（叶子证书）
├── chain.pem     # 中间证书链
├── fullchain.pem # cert.pem + chain.pem（Nginx 使用此文件）
├── privkey.pem   # 服务器私钥（严格保护）
```

### 3.4 证书续期

Let's Encrypt 的证书有效期为 90 天，必须自动续期。

```bash
# 手动测试续期
sudo certbot renew --dry-run

# 实际执行续期（会检查所有即将过期的证书）
sudo certbot renew
```

**自动续期配置：**

**方式一：crontab（传统方式）**
```bash
# 每天检查两次（Let's Encrypt 建议），自动续期后重载 Nginx
0 0,12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

**方式二：systemd timer（推荐）**

创建服务文件 `/etc/systemd/system/certbot-renew.service`：

```ini
[Unit]
Description=Certbot Renew

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
ExecStartPost=/bin/systemctl reload nginx
```

创建定时器文件 `/etc/systemd/system/certbot-renew.timer`：

```ini
[Unit]
Description=Run certbot renew twice daily

[Timer]
OnCalendar=0/12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
```

---

## 4. Nginx HTTPS 配置

### 4.1 完整 Server Block

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    # 证书路径
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 协议版本（只开启安全的 TLS 版本）
    ssl_protocols TLSv1.2 TLSv1.3;

    # 密码套件（移除不安全的套件）
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;

    # 会话缓存（提高性能）
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP Stapling（提高证书状态查询性能）
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # HSTS（强制浏览器使用 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 其他安全头（always 确保 4xx/5xx 响应也带上）
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    root /var/www/html;
    index index.html;
}
```

### 4.2 HSTS 说明

`Strict-Transport-Security`（HSTS）的作用：

- 告诉浏览器**此域名只能通过 HTTPS 访问**，禁止回退到 HTTP
- 浏览器一旦收到 HSTS 头，在 `max-age` 指定的时间内，自动将 HTTP 请求转换为 HTTPS
- `includeSubDomains`：规则适用于所有子域名
- `preload`：申请加入浏览器内置的 HSTS Preload List，实现首次访问也强制 HTTPS

> **⚠️ 注意事项：** 开启 HSTS 前，必须确保所有子域名都已支持 HTTPS，否则子域名将无法访问。

### 4.3 HTTP → HTTPS 自动跳转

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # 优先使用 $host 而非 $server_name，避免多个域名时丢失子域名
    return 301 https://$host$request_uri;
}
```

> 注意：`$server_name` 始终取 server_name 指令中的第一个值，如果有多个域名（如 `example.com www.example.com`），访问 `www.example.com` 会被重定向到 `https://example.com/`，丢失子域名。建议使用 `$host` 保留原始 Host 头。

---

## 5. 面试回答模板

> **问：对称加密和非对称加密在 TLS 中各用于什么阶段？**

对称加密和非对称加密在 TLS 中分工明确。非对称加密（RSA / ECDSA）用于**握手阶段**的两个核心任务：一是服务器身份认证（通过 CertificateVerify 消息中的数字签名），二是密钥交换（通过 ECDHE 协商出共享密钥）。对称加密（AES / ChaCha20）用于握手完成后**数据传输阶段**，对应用层数据进行批量加密。这种组合的合理性在于：非对称加密虽然慢但安全性高，适合低频次的密钥协商；对称加密速度快，适合大量数据的加密传输。

> **问：TLS 1.2 和 TLS 1.3 有什么区别？**

主要区别有四点。第一，**握手延迟**：TLS 1.2 完整握手需要 2-RTT，TLS 1.3 优化为 1-RTT，并且支持 0-RTT 模式（允许客户端在第一次消息中就发送数据，适用于会话恢复场景）。第二，**安全性**：TLS 1.3 移除了所有不安全的算法，包括 RSA 密钥交换、RC4、3DES 和 CBC 模式加密，强制使用提供完美前向保密（PFS）的 ECDHE 密钥交换。第三，**密码套件**：TLS 1.2 有数十种密码套件组合，配置复杂且容易出错；TLS 1.3 精简到仅 5 种 AEAD 密码套件，所有套件都加密握手消息。第四，**性能**：TLS 1.3 简化了握手流程，减少了消息往返和协商步骤，连接建立速度明显更快。

> **问：浏览器如何验证服务器证书是可信的？**

浏览器验证服务器证书分为三个步骤。第一步，**证书链验证**：浏览器从服务器获取证书链（叶子证书 + 中间证书），逐级向上验证，直到本地操作系统中内置的受信任根证书。每一级证书都由上一级 CA 的私钥签名，浏览器用对应的公钥验证签名的有效性。第二步，**域名匹配**：浏览器检查证书的 Subject Alternative Name（SAN）字段是否包含当前访问的域名。如果没有 SAN 字段则检查 Common Name（CN），但现代浏览器已不推荐此做法。第三步，**有效性检查**：浏览器验证证书是否在有效期内（notBefore / notAfter），是否被吊销（通过 CRL 或 OCSP），以及 key usage 等扩展字段是否符合用途。以上三步全部通过，浏览器才在地址栏显示绿色安全锁图标；任何一步失败都会显示安全警告。

---

## 总结

- HTTPS = HTTP + TLS，解决窃听、篡改、冒充三大风险
- TLS 使用非对称加密做身份认证和密钥交换，对称加密做数据传输
- CA 是互联网信任体系的基石，通过证书链传递信任
- TLS 1.3 比 TLS 1.2 更快、更安全、更简单，已逐步成为主流
- Let's Encrypt + Certbot 实现了免费证书的自动化申请和续期
- Nginx HTTPS 配置需要关注协议版本、加密套件、HSTS 等安全细节

---

## 🔗 下一章

[03-network-troubleshooting.md](03-network-troubleshooting.md) — 分层排障法，用 `curl -v` / `dig` / `ss` / `tcpdump` 解决 80% 的"连不上"问题。
