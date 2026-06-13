# Nginx 入门教程

> 面向后端/全栈工程师的 Nginx 快速入门 —— 掌握核心配置、反向代理、负载均衡，从容应对面试与日常开发。

---

## 🎯 学习目标

- 理解 Nginx 的架构模型与核心特性（高并发、事件驱动、Master-Worker 进程模型）
- 掌握 Nginx 配置文件结构与常用指令
- 熟练配置静态资源服务、虚拟主机、反向代理与负载均衡
- 能独立完成 HTTPS 配置、URL 重写、缓存优化等常见场景
- 面试时能清晰解释 Nginx 的工作原理、性能优势及典型应用场景

---

## 📋 前置要求

| 领域 | 要求 |
|------|------|
| Linux 基础 | 了解基本命令、文件权限、服务管理 |
| HTTP 协议 | 理解请求/响应模型、状态码、Header |
| 网络基础 | 了解 IP、端口、DNS、TCP 连接 |

---

## 🏗️ Nginx 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx 架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                          │
│   │   Master    │  • 读取配置文件                           │
│   │   进程      │  • 管理 Worker 进程                       │
│   │             │  • 平滑重启/重载                          │
│   └──────┬──────┘                                          │
│          │                                                  │
│   ┌──────┴──────┬──────────────┬──────────────┐            │
│   │             │              │              │            │
│   ▼             ▼              ▼              ▼            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │ Worker  │ │ Worker  │ │ Worker  │ │ Worker  │          │
│ │ 进程 1  │ │ 进程 2  │ │ 进程 3  │ │ 进程 N  │          │
│ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│      │           │           │           │                │
│      └───────────┴───────────┴───────────┘                │
│                      │                                     │
│                      ▼                                     │
│              ┌──────────────┐                              │
│              │  事件驱动    │  epoll/kqueue                 │
│              │  异步非阻塞  │  单线程处理多连接              │
│              └──────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

配置文件结构：
┌─────────────────────────────────────────────────────────────┐
│ nginx.conf                                                  │
├─────────────────────────────────────────────────────────────┤
│ # 全局块                                                     │
│ worker_processes auto;                                      │
│                                                             │
│ # events 块                                                  │
│ events {                                                    │
│     worker_connections 10240;                               │
│ }                                                           │
│                                                             │
│ # http 块                                                    │
│ http {                                                      │
│     # server 块                                              │
│     server {                                                │
│         listen 80;                                          │
│         server_name example.com;                            │
│                                                             │
│         # location 块                                        │
│         location / {                                        │
│             proxy_pass http://backend;                      │
│         }                                                   │
│     }                                                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ 学习路径（三天速成 + 两天进阶）

| 天数 | 内容 | 面试价值 |
|------|------|----------|
| **Day 1** | Nginx 概述 + 配置结构 + 静态资源 | 理解架构，能配置基础服务 |
| **Day 2** | Location 匹配 + 反向代理 + 负载均衡 | **面试核心**，必须掌握 |
| **Day 3** | HTTPS + URL 重写 + 实践项目 | 完成生产级配置 |
| **Day 4**（选学） | 高级优化：缓存、日志、性能调优 | 加分项 |
| **Day 5**（选学） | Docker 部署 + 常见问题排查 | 实战能力 |

**核心文档**（Day 1-3 必学）：
- `01-配置结构与核心指令.md` — 配置文件层次、核心指令
- `02-静态资源服务.md` — root vs alias、gzip、缓存
- `03-Location匹配规则.md` — **面试高频**：匹配优先级
- `04-反向代理与负载均衡.md` — **面试核心**：proxy_pass、负载策略
- `05-HTTPS与URL重写.md` — SSL 配置、rewrite 规则

**进阶文档**（Day 4-5 选学）：
- `06-高级优化.md` — 缓存、日志、性能调优
- `07-Docker部署与问题排查.md` — 容器化部署、常见错误排查

---

## 📚 核心知识点

### 01 — 配置结构与核心指令（Day 1）

**配置文件层次**：全局块 → events 块 → http 块 → server 块 → location 块

**核心指令速查**：
| 指令 | 作用 | 建议值 |
|------|------|--------|
| `worker_processes` | 工作进程数 | `auto`（匹配 CPU 核心数） |
| `worker_connections` | 单进程最大连接数 | `10240` |
| `keepalive_timeout` | 长连接超时 | `65` |
| `client_max_body_size` | 请求体大小限制 | `10m`（按需调整） |
| `sendfile` | 零拷贝传输 | `on` |
| `tcp_nopush` | 合并小包 | `on` |
| `tcp_nodelay` | 禁用 Nagle 算法 | `on` |

**配置模板**（可直接使用）：
```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;  # 自动匹配 CPU 核心数
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 10240;  # 单进程最大连接数
    use epoll;  # Linux 下使用 epoll
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    include /etc/nginx/conf.d/*.conf;
}
```

---

### 02 — 静态资源服务（Day 1）

**root vs alias**（面试常问）：
```nginx
# root：拼接完整路径 /var/www/static + /images/
location /images/ {
    root /var/www/static;
}

# alias：直接使用 /var/www/images/
location /images/ {
    alias /var/www/images/;
}
```

**静态资源优化配置**：
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    root /var/www/static;
    expires 30d;  # 浏览器缓存 30 天
    add_header Cache-Control "public, immutable";
    access_log off;  # 静态资源不记录日志
}
```

---

### 03 — Location 匹配规则（Day 2 · 面试高频）

**匹配优先级**（必须记住）：
1. `=` 精确匹配（找到即停止）
2. `^~` 前缀匹配（找到即停止）
3. `~` / `~*` 正则匹配（区分/不区分大小写）
4. 普通前缀匹配

**示例**：
```nginx
# 1. 精确匹配 /api
location = /api {
    return 200 "API Root";
}

# 2. 前缀匹配 /static/（优先级高于正则）
location ^~ /static/ {
    root /var/www;
}

# 3. 正则匹配（区分大小写）
location ~ \.php$ {
    fastcgi_pass 127.0.0.1:9000;
}

# 4. 正则匹配（不区分大小写）
location ~* \.(jpg|css|js)$ {
    expires 30d;
}

# 5. 默认匹配
location / {
    proxy_pass http://backend;
}
```

---

### 04 — 反向代理与负载均衡（Day 2 · 面试核心）

**正向代理 vs 反向代理**（面试必问）：
| 类型 | 代理对象 | 典型场景 |
|------|----------|----------|
| 正向代理 | 客户端 | VPN、科学上网 |
| 反向代理 | 服务器 | Nginx 代理后端应用 |

**proxy_pass 配置详解**（高频坑点）：
```nginx
# 带 /：绝对路径，替换匹配部分
location /api/ {
    proxy_pass http://127.0.0.1:3000/;  # /api/users → /users
}

# 不带 /：相对路径，保留原始 URI
location /api/ {
    proxy_pass http://127.0.0.1:3000;  # /api/users → /api/users
}
```

**代理头信息配置**：
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**负载均衡策略**（面试常问）：
```nginx
# 轮询（默认）
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 加权轮询
upstream backend {
    server 192.168.1.101:8080 weight=3;  # 3/4 请求
    server 192.168.1.102:8080 weight=1;  # 1/4 请求
}

# IP 哈希（解决 Session 问题）
upstream backend {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 最少连接
upstream backend {
    least_conn;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}
```

---

### 05 — HTTPS 与 URL 重写（Day 3）

**HTTPS 配置模板**：
```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;  # HTTP 强制跳转 HTTPS
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # HSTS 安全加固
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

**URL 重写常见场景**：
```nginx
# HTTP → HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# www ↔ 非 www
server {
    listen 80;
    server_name www.example.com;
    return 301 $scheme://example.com$request_uri;
}

# 隐藏 .html 后缀
location / {
    try_files $uri $uri.html $uri/ =404;
}
```

---

### 06 — 高级优化（Day 4 · 选学）

**代理缓存配置**：
```nginx
http {
    # 缓存路径
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

**性能优化清单**：
```nginx
worker_processes auto;
worker_connections 10240;
keepalive_timeout 65;
sendfile on;
tcp_nopush on;
tcp_nodelay on;
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
```

---

### 07 — Docker 部署（Day 5 · 选学）

**Dockerfile 模板**：
```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY static /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml 模板**：
```yaml
version: '3'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./static:/usr/share/nginx/html
      - ./certs:/etc/nginx/certs
    restart: always
```

---

### 🚨 常见错误排查清单

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| **502 Bad Gateway** | 后端服务不可用 | 检查后端是否启动、端口是否正确 |
| **504 Gateway Timeout** | 后端响应超时 | 增大 `proxy_read_timeout` |
| **413 Request Entity Too Large** | 请求体过大 | 增大 `client_max_body_size` |
| **403 Forbidden** | 权限不足 | 检查文件权限、`user` 配置 |
| **配置不生效** | 配置错误或未重载 | `nginx -t` 检查语法、`nginx -s reload` 重载 |

**排查命令**：
```bash
# 检查配置语法
nginx -t

# 平滑重载配置
nginx -s reload

# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log

# 检查端口占用
netstat -tlnp | grep nginx
```

---

## 🕹️ 实践项目：反向代理 Node.js 应用（Day 3）

### 场景描述

将一个运行在 `localhost:3000` 的 Node.js 应用通过 Nginx 对外提供服务，配置反向代理、静态资源、HTTPS。

### 完整配置示例

```nginx
# /etc/nginx/conf.d/example.conf

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS + 反向代理
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # HSTS 安全加固
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 静态资源
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

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

### 覆盖知识点

- HTTP → HTTPS 重定向
- SSL 证书配置
- 静态资源缓存优化
- 反向代理头信息设置

---

## 🗓️ 建议时间线（每天 1-2 小时）

| 天数 | 内容 | 面试价值 |
|------|------|----------|
| **Day 1** | 配置结构 + 静态资源 + 核心指令 | 理解架构，能配置基础服务 |
| **Day 2** | Location 匹配 + 反向代理 + 负载均衡 | **面试核心**，必须掌握 |
| **Day 3** | HTTPS + URL 重写 + 实践项目 | 完成生产级配置 |
| **Day 4**（选学） | 高级优化：缓存、日志、性能调优 | 加分项 |
| **Day 5**（选学） | Docker 部署 + 常见问题排查 | 实战能力 |
| **合计** | **3-5 天** | **独立配置 Nginx 的能力** |

---

## ✅ 完成标准

### Day 1-3 必须掌握
- [ ] 理解 Nginx 的 Master-Worker 进程模型与事件驱动机制
- [ ] 能独立配置静态资源服务、反向代理、负载均衡
- [ ] 能正确配置 Location 匹配规则，理解匹配优先级
- [ ] 能完成 HTTPS 配置，包括证书申请与安全加固
- [ ] 能排查 502/504/413 等常见错误

### Day 4-5 选学加分
- [ ] 能配置代理缓存和日志优化
- [ ] 能使用 Docker 部署 Nginx

### 面试能力
- [ ] 能画出 Nginx 的架构图，解释反向代理与负载均衡的原理
- [ ] 能解释 proxy_pass 带 `/` 与不带 `/` 的区别
- [ ] 能说出 4 种负载均衡策略及其适用场景

---

## 🆚 面试高频对比表

| 维度 | Nginx | Apache | Caddy |
|------|-------|--------|-------|
| **并发模型** | 事件驱动（异步非阻塞） | 进程/线程模型（同步阻塞） | 事件驱动 |
| **性能** | 高（C10K 问题解决者） | 中（高并发下性能下降） | 高 |
| **配置方式** | 集中式配置文件 | 分布式 `.htaccess` | 自动 HTTPS、简洁配置 |
| **反向代理** | 原生支持，性能优秀 | 需要 mod_proxy | 原生支持 |
| **负载均衡** | 原生支持多种策略 | 需要 mod_proxy_balancer | 原生支持 |
| **HTTPS** | 手动配置 | 手动配置 | **自动申请证书** |
| **模块化** | 编译时选择模块 | 动态加载模块 | 插件系统 |
| **适用场景** | 反向代理、负载均衡、静态资源 | 共享主机、`.htaccess` 需求 | 快速部署、自动 HTTPS |
| **代表应用** | 75%+ 的高流量网站 | 传统 LAMP 架构 | 个人项目、小型服务 |

---

## 📝 面试常见问题速查

### 基础概念
1. **Nginx 是什么？有什么优势？**
   - 高性能 HTTP/反向代理服务器，事件驱动模型，高并发低内存

2. **Nginx 的 Master-Worker 进程模型？**
   - Master 进程：管理 Worker、读取配置、平滑重启
   - Worker 进程：处理请求，多个 Worker 并发处理

3. **正向代理与反向代理的区别？**
   - 正向代理：代理客户端（VPN）
   - 反向代理：代理服务器（Nginx 代理后端应用）

### 配置实战
4. **Location 匹配优先级？**
   - `=` 精确 > `^~` 前缀 > `~`/`~*` 正则 > 普通前缀

5. **proxy_pass 带 `/` 与不带 `/` 的区别？**
   - 带 `/`：绝对路径，替换匹配部分
   - 不带 `/`：相对路径，保留原始 URI

6. **负载均衡有哪些策略？**
   - 轮询、加权轮询、IP 哈希、最少连接

### 性能优化
7. **如何优化 Nginx 性能？**
   - `worker_processes auto`、增大 `worker_connections`、开启 `sendfile`、gzip 压缩、缓存

8. **502 和 504 错误的原因？**
   - 502：后端服务不可用
   - 504：后端响应超时

---

## 🔗 延伸阅读

- [Nginx 官方文档](http://nginx.org/en/docs/)
- [Nginx 中文文档](https://www.nginx.cn/doc/)
- [Nginx 配置生成器](https://www.digitalocean.com/community/tools/nginx)

---

*最后更新：2026年6月*