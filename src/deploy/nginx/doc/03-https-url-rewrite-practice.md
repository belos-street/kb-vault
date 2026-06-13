# 03 - HTTPS + URL 重写 + 实践项目

> 完成生产级配置：HTTPS 安全加固、URL 重写规则、综合实战项目。

---

## 🎯 学习目标

- 掌握 HTTPS 配置与 SSL 证书申请
- 理解 HTTP → HTTPS 强制跳转
- 掌握 URL 重写（rewrite）与重定向（return）
- 能独立完成生产环境的完整 Nginx 配置

---

## 1. HTTPS 基础

### 为什么需要 HTTPS

| 问题 | HTTP | HTTPS |
|------|------|-------|
| 窃听 | 明文传输，可被截获 | 加密传输，无法窃听 |
| 篡改 | 可被中间人篡改 | 数据完整性校验 |
| 伪装 | 无法验证服务器身份 | 证书验证服务器身份 |

### SSL/TLS 握手流程

```
客户端                              服务器
  │                                   │
  │──── ClientHello ─────────────────→│
  │     （支持的加密套件）              │
  │                                   │
  │←─── ServerHello ─────────────────│
  │     （选定的加密套件 + 证书）       │
  │                                   │
  │     验证证书                       │
  │     生成随机数                     │
  │     计算会话密钥                   │
  │                                   │
  │←───────────── 加密通信 ──────────→│
```

---

## 2. HTTPS 配置

### 基本配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    # SSL 协议版本
    ssl_protocols TLSv1.2 TLSv1.3;

    # 加密套件
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # SSL 会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### Let's Encrypt 免费证书

#### 安装 certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 申请证书

```bash
# 自动申请并配置 Nginx
sudo certbot --nginx -d example.com -d www.example.com

# 仅申请证书（不自动配置）
sudo certbot certonly --webroot -w /var/www/html -d example.com
```

#### 证书续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 自动续期（添加到 crontab）
0 0 1 * * certbot renew --quiet && nginx -s reload
```

#### 证书文件位置

```
/etc/letsencrypt/live/example.com/
├── fullchain.pem    # 完整证书链（用于 ssl_certificate）
├── privkey.pem      # 私钥（用于 ssl_certificate_key）
├── cert.pem         # 服务器证书
└── chain.pem        # 中间证书
```

---

## 3. HTTP → HTTPS 强制跳转

### 方式一：return 301（推荐）

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    # ... SSL 配置
}
```

### 方式二：rewrite

```nginx
server {
    listen 80;
    server_name example.com;
    rewrite ^(.*)$ https://$host$1 permanent;
}
```

### 区别

| 方式 | 状态码 | 性能 | 推荐 |
|------|--------|------|------|
| `return 301` | 301 Moved Permanently | 更高（不解析 URI） | ✅ 推荐 |
| `rewrite` | 301 | 稍低（正则解析） | 特殊场景 |

---

## 4. HSTS 安全加固

### 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # HSTS：强制浏览器使用 HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `max-age` | 有效期（秒），31536000 = 1 年 |
| `includeSubDomains` | 包含子域名 |
| `preload` | 加入浏览器预加载列表（可选） |

### 注意事项

- HSTS 开启后，浏览器会强制使用 HTTPS
- 测试阶段不要设置太长的 `max-age`
- 一旦开启 HSTS，无法通过 HTTP 访问

---

## 5. URL 重写与重定向

### rewrite 指令

```nginx
# 语法：rewrite 正则 替换 [flag];
# flag: last | break | redirect | permanent

# 301 永久重定向
rewrite ^/old-page$ /new-page permanent;

# 302 临时重定向
rewrite ^/temp-page$ /other-page redirect;

# 内部重写（不改变 URL）
rewrite ^/api/v1/(.*)$ /api/v2/$1 last;
```

### return 指令

```nginx
# 301 永久重定向
location /old {
    return 301 /new;
}

# 302 临时重定向
location /temp {
    return 302 /other;
}

# 返回固定内容
location /health {
    return 200 "OK";
    add_header Content-Type text/plain;
}
```

### rewrite vs return

| 指令 | 特点 | 适用场景 |
|------|------|----------|
| `return` | 简单高效，不解析 URI | 简单重定向 |
| `rewrite` | 正则匹配，灵活 | 复杂 URL 转换 |

---

## 6. 常见重写场景

### 场景一：www ↔ 非 www

```nginx
# www → 非 www
server {
    listen 80;
    server_name www.example.com;
    return 301 $scheme://example.com$request_uri;
}

# 非 www → www
server {
    listen 80;
    server_name example.com;
    return 301 $scheme://www.example.com$request_uri;
}
```

### 场景二：隐藏 .html 后缀

```nginx
# 访问 /about → /about.html
location / {
    try_files $uri $uri.html $uri/ =404;
}

# 或者使用 rewrite
if (!-e $request_filename) {
    rewrite ^(.*)$ $1.html last;
}
```

### 场景三：URL 美化

```nginx
# /article/123 → /article.php?id=123
location /article/ {
    rewrite ^/article/(\d+)$ /article.php?id=$1 last;
}
```

### 场景四：域名跳转

```nginx
# 旧域名 → 新域名
server {
    listen 80;
    server_name old.example.com;
    return 301 $scheme://new.example.com$request_uri;
}
```

---

## 7. 实战项目：Node.js 应用完整配置

### 需求

- Node.js 应用运行在 `localhost:3000`
- 配置 HTTPS，使用 Let's Encrypt 证书
- HTTP 强制跳转 HTTPS
- 静态资源独立配置
- API 请求代理到后端

### 基础配置（快速上手）

```nginx
# /etc/nginx/conf.d/app.conf

# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 反向代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 完整配置（生产环境）

```nginx
# /etc/nginx/conf.d/app.conf

# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # SSL 证书（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS 安全加固
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 根目录
    root /var/www/app;
    index index.html;

    # 静态资源
    location /static/ {
        alias /var/www/app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 图片资源
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        root /var/www/app/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # CSS/JS 资源
    location ~* \.(css|js)$ {
        root /var/www/app/static;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 主应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

## 8. 常见问题排查

### 502 Bad Gateway

**原因**：后端服务不可用

```bash
# 检查后端是否启动
curl http://127.0.0.1:3000

# 检查端口是否正确
netstat -tlnp | grep 3000

# 检查错误日志
tail -f /var/log/nginx/error.log
```

### 504 Gateway Timeout

**原因**：后端响应超时

```nginx
# 增大超时时间
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

### 413 Request Entity Too Large

**原因**：请求体超过 `client_max_body_size`

```nginx
# 增大请求体限制
server {
    client_max_body_size 50m;  # 允许 50MB
}
```

### 403 Forbidden

**原因**：权限不足

```bash
# 检查文件权限
ls -la /var/www/html

# 检查 Nginx 用户
cat /etc/nginx/nginx.conf | grep user

# 修复权限
chown -R nginx:nginx /var/www/html
chmod -R 755 /var/www/html
```

### HTTPS 证书错误

```bash
# 检查证书是否过期
openssl x509 -in /etc/nginx/ssl/example.com.crt -noout -dates

# 检查证书与私钥是否匹配
openssl x509 -noout -modulus -in example.com.crt | openssl md5
openssl rsa -noout -modulus -in example.com.key | openssl md5

# 测试 SSL 配置
openssl s_client -connect example.com:443
```

---

## 9. 排查命令速查

```bash
# 检查配置语法
nginx -t

# 平滑重载配置
nginx -s reload

# 查看错误日志（实时）
tail -f /var/log/nginx/error.log

# 查看访问日志（实时）
tail -f /var/log/nginx/access.log

# 检查端口占用
netstat -tlnp | grep nginx
ss -tlnp | grep nginx

# 检查 Nginx 进程
ps aux | grep nginx

# 测试域名解析
nslookup example.com
dig example.com

# 测试端口连通性
telnet example.com 80
curl -I http://example.com
```

---

## 10. 进阶速查：缓存与日志（选学）

### 代理缓存

```nginx
http {
    # 定义缓存路径
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;

    server {
        location / {
            proxy_cache my_cache;
            proxy_cache_valid 200 302 10m;  # 200/302 缓存 10 分钟
            proxy_cache_valid 404 1m;       # 404 缓存 1 分钟
            proxy_cache_use_stale error timeout updating;
            proxy_pass http://backend;
        }
    }
}
```

| 参数 | 说明 |
|------|------|
| `keys_zone` | 缓存区名称和大小（元数据） |
| `max_size` | 缓存最大容量 |
| `proxy_cache_valid` | 不同状态码的缓存时间 |

### 日志配置

```nginx
http {
    # 自定义日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    # 访问日志
    access_log /var/log/nginx/access.log main;

    # 错误日志（warn 级别以上）
    error_log /var/log/nginx/error.log warn;

    # 静态资源不记录日志（减少 I/O）
    location ~* \.(jpg|css|js)$ {
        access_log off;
    }
}
```

**日志级别**（从高到低）：`emerg` > `alert` > `crit` > `error` > `warn` > `notice` > `info` > `debug`

---

## ✅ 自检清单

- [ ] 能配置 HTTPS，使用 Let's Encrypt 证书
- [ ] 能配置 HTTP → HTTPS 强制跳转
- [ ] 理解 HSTS 的作用与注意事项
- [ ] 掌握 rewrite 和 return 的区别
- [ ] 能配置常见的 URL 重写场景
- [ ] 能排查 502/504/413 等常见错误
- [ ] 能独立完成生产环境的完整 Nginx 配置

---

## 🎓 学习完成

恭喜！你已经掌握了 Nginx 的核心配置能力。

### 你学到了什么

| 编号 | 内容 | 能力 |
|------|------|------|
| 01 | 架构 + 配置结构 + 静态资源 | 能搭建基础服务器 |
| 02 | Location + 反向代理 + 负载均衡 | 能配置生产环境代理 |
| 03 | HTTPS + URL 重写 + 实战 | 能完成安全加固 |

### 下一步（选学）

- 高级优化：缓存、日志、性能调优
- Docker 部署：容器化 Nginx
- 监控告警：Prometheus + Grafana

---

## 🔗 相关文档

- 上一篇：[02 - Location 匹配 + 反向代理 + 负载均衡](./02-location-reverse-proxy-lb.md)
- 大纲：[Nginx 学习大纲](../nginx-learning-outline.md)

---

*最后更新：2026年6月*