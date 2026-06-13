# 01 - Nginx 概述 + 配置结构 + 静态资源

> 理解 Nginx 架构，掌握配置文件结构，能独立配置静态资源服务。

---

## 🎯 学习目标

- 理解 Nginx 是什么、为什么快（事件驱动、Master-Worker 模型）
- 掌握 nginx.conf 的五层配置结构
- 学会配置静态资源服务、gzip 压缩、浏览器缓存
- 能独立搭建一个可用的静态文件服务器

---

## 1. Nginx 是什么

Nginx（engine x）是一个高性能的 HTTP/反向代理/邮件代理服务器。

**核心特性**：
| 特性 | 说明 |
|------|------|
| 事件驱动 | 异步非阻塞，单线程处理数千连接 |
| 高并发 | 解决 C10K 问题（单机 1 万并发连接） |
| 低内存 | 2.5 万并发连接仅消耗约 2.5MB 内存 |
| 模块化 | 编译时选择需要的模块 |
| 热部署 | 平滑重载配置，不停服 |

**与 Apache 对比**（面试常问）：
| 维度 | Nginx | Apache |
|------|-------|--------|
| 并发模型 | 事件驱动（异步非阻塞） | 进程/线程模型（同步阻塞） |
| 配置方式 | 集中式配置文件 | 支持 `.htaccess` 分布式配置 |
| 静态资源 | 性能优秀 | 一般 |
| 反向代理 | 原生支持 | 需要 mod_proxy |
| 适用场景 | 高并发、反向代理 | 共享主机、`.htaccess` 需求 |

---

## 2. Master-Worker 进程模型（面试必问）

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
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Master 进程**：
- 读取并验证配置文件
- 管理 Worker 进程（创建、销毁、信号处理）
- 接收外部信号（reload、stop）
- 不处理具体请求

**Worker 进程**：
- 处理实际请求（每个 Worker 是一个独立进程）
- 使用 epoll/kqueue 事件驱动模型
- 单线程处理多个连接（非阻塞 I/O）
- 数量建议：`worker_processes auto`（自动匹配 CPU 核心数）

**为什么快**：
- 传统模型：一个连接 = 一个线程（线程切换开销大）
- Nginx：一个线程处理数千连接（事件驱动，无切换开销）

---

## 3. 安装与目录结构

### 安装方式

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install nginx

# Docker
docker pull nginx:alpine
```

### 目录结构

```
/etc/nginx/
├── nginx.conf              # 主配置文件
├── conf.d/                 # 站点配置目录（推荐）
│   └── default.conf
├── mime.types              # MIME 类型映射
└── modules-enabled/        # 动态模块

/var/log/nginx/
├── access.log              # 访问日志
└── error.log               # 错误日志

/usr/share/nginx/html/      # 默认站点目录
└── index.html
```

### 常用命令

```bash
# 检查配置语法
nginx -t

# 平滑重载配置（不停服）
nginx -s reload

# 停止 Nginx
nginx -s stop

# 查看版本
nginx -v

# 使用 systemctl
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## 4. 配置文件结构（五层）

nginx.conf 采用**块嵌套**结构，共五层：

```
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
│             root /var/www/html;                             │
│         }                                                   │
│     }                                                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

| 层级 | 作用 | 常用指令 |
|------|------|----------|
| **全局块** | 进程级配置 | `worker_processes`、`error_log`、`pid` |
| **events 块** | 连接处理配置 | `worker_connections`、`use epoll` |
| **http 块** | HTTP 全局配置 | `include`、`log_format`、`gzip` |
| **server 块** | 虚拟主机配置 | `listen`、`server_name` |
| **location 块** | URL 匹配配置 | `root`、`proxy_pass`、`try_files` |

**继承规则**：子块会继承父块的配置，子块可覆盖父块。

---

## 5. 核心指令速查

| 指令 | 作用 | 建议值 | 位置 |
|------|------|--------|------|
| `worker_processes` | 工作进程数 | `auto` | 全局块 |
| `worker_connections` | 单进程最大连接数 | `10240` | events 块 |
| `keepalive_timeout` | 长连接超时（秒） | `65` | http/server |
| `client_max_body_size` | 请求体大小限制 | `10m` | http/server/location |
| `sendfile` | 零拷贝传输 | `on` | http/server/location |
| `tcp_nopush` | 合并小包发送 | `on` | http/server |
| `tcp_nodelay` | 禁用 Nagle 算法 | `on` | http/server |

**传输优化三件套**：
```nginx
sendfile on;      # 零拷贝：内核直接传输文件，不经过用户空间
tcp_nopush on;    # 合并：数据包满时再发送，减少网络开销
tcp_nodelay on;   # 低延迟：小数据包立即发送（与 tcp_nopush 配合使用）
```

---

## 6. 完整配置模板

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;  # 自动匹配 CPU 核心数
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 10240;  # 单进程最大连接数
    use epoll;  # Linux 下使用 epoll（高性能事件模型）
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

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
}
```

---

## 7. 静态资源服务

### root vs alias（面试常问）

```nginx
# root：拼接完整路径 = root + location
# 请求 /images/logo.png → 文件 /var/www/static/images/logo.png
location /images/ {
    root /var/www/static;
}

# alias：直接使用 alias 路径
# 请求 /images/logo.png → 文件 /var/www/images/logo.png
location /images/ {
    alias /var/www/images/;
}
```

| 指令 | 路径拼接 | 尾部 `/` |
|------|----------|----------|
| `root` | root + location | 可选 |
| `alias` | 直接使用 alias | **必须加** |

### 目录列表

```nginx
location /files/ {
    alias /var/www/files/;
    autoindex on;           # 开启目录列表
    autoindex_exact_size off;  # 显示文件大小（而非精确字节）
    autoindex_localtime on;    # 使用本地时间
}
```

### try_files

```nginx
# 依次尝试：$uri → $uri/ → /index.html
location / {
    root /var/www/html;
    try_files $uri $uri/ /index.html;
}

# SPA 应用常用配置
location / {
    root /var/www/dist;
    try_files $uri $uri/ /index.html;
}
```

---

## 8. 静态资源优化

### gzip 压缩

```nginx
http {
    gzip on;                          # 开启 gzip
    gzip_min_length 1024;             # 小于 1KB 不压缩
    gzip_comp_level 6;                # 压缩级别 1-9（6 为平衡点）
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_vary on;                     # 添加 Vary: Accept-Encoding 头
    gzip_proxied any;                 # 代理请求也压缩
    gzip_disable "msie6";             # 禁用 IE6 压缩
}
```

### 浏览器缓存

```nginx
# 静态资源缓存 30 天
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
    root /var/www/static;
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;  # 静态资源不记录日志
}

# HTML 不缓存（保证最新）
location ~* \.html$ {
    root /var/www/html;
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### ETag 与 Last-Modified

```nginx
# Nginx 默认开启，无需额外配置
# ETag：基于文件内容生成哈希值
# Last-Modified：基于文件修改时间

# 如需关闭（CDN 场景）
etag off;
```

---

## 9. 实战：搭建静态文件服务器

### 需求

搭建一个静态文件服务器，支持：
- 访问 `/` 返回 `index.html`
- 访问 `/static/` 返回静态资源
- 开启 gzip 压缩
- 静态资源缓存 30 天

### 配置

```nginx
# /etc/nginx/conf.d/static-server.conf
server {
    listen 80;
    server_name localhost;

    # 根目录
    root /var/www/html;
    index index.html;

    # 主页面
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 图片资源
    location ~* \.(jpg|jpeg|png|gif|ico)$ {
        root /var/www/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

### 测试

```bash
# 检查配置语法
sudo nginx -t

# 重载配置
sudo nginx -s reload

# 测试访问
curl http://localhost/
curl http://localhost/static/style.css
```

---

## ✅ 自检清单

- [ ] 能解释 Nginx 的 Master-Worker 进程模型
- [ ] 理解事件驱动为什么比线程模型快
- [ ] 掌握 nginx.conf 的五层配置结构
- [ ] 能区分 `root` 和 `alias` 的用法
- [ ] 能配置 gzip 压缩和浏览器缓存
- [ ] 能独立搭建一个静态文件服务器

---

## 🔗 相关文档

- 下一篇：[02 - Location 匹配 + 反向代理 + 负载均衡](./02-location-reverse-proxy-lb.md)
- 大纲：[Nginx 学习大纲](../nginx-learning-outline.md)

---

*最后更新：2026年6月*