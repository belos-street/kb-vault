# 04 - 高级优化

> 缓存、日志、性能调优 —— 进阶加分项，让你的 Nginx 配置更专业。

---

## 🎯 学习目标

- 掌握代理缓存配置，提升响应速度
- 学会日志配置与分析，便于问题排查
- 理解性能优化清单，最大化 Nginx 性能
- 了解安全加固配置，提升服务安全性

---

## 1. 代理缓存配置

### 为什么需要缓存

| 场景 | 无缓存 | 有缓存 |
|------|--------|--------|
| 响应速度 | 每次请求都到后端 | 直接返回缓存内容 |
| 后端压力 | 高 | 低 |
| 用户体验 | 慢 | 快 |

### proxy_cache 配置

```nginx
http {
    # 定义缓存路径和参数
    proxy_cache_path /var/cache/nginx 
        levels=1:2                    # 缓存目录层级
        keys_zone=my_cache:10m        # 缓存区名称和大小（10MB 共享内存）
        max_size=1g                   # 缓存最大磁盘空间
        inactive=60m                  # 60 分钟未访问则删除
        use_temp_path=off;            # 直接写入缓存目录，不使用临时目录

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_cache my_cache;
            proxy_cache_valid 200 302 10m;  # 200/302 状态码缓存 10 分钟
            proxy_cache_valid 404 1m;       # 404 缓存 1 分钟
            proxy_cache_use_stale error timeout updating;  # 错误时使用过期缓存
            
            # 添加缓存状态头（用于调试）
            add_header X-Cache-Status $upstream_cache_status;
            
            proxy_pass http://backend;
        }
    }
}
```

### 缓存状态说明

| 状态 | 含义 |
|------|------|
| `HIT` | 缓存命中 |
| `MISS` | 缓存未命中 |
| `EXPIRED` | 缓存已过期 |
| `STALE` | 使用过期缓存 |
| `UPDATING` | 正在更新缓存 |
| `BYPASS` | 绕过缓存 |

### 缓存排除规则

```nginx
# 不缓存特定请求
location /api/ {
    proxy_cache off;  # API 请求不缓存
    proxy_pass http://backend;
}

# 不缓存特定用户（如登录用户）
location / {
    proxy_cache_bypass $cookie_session;  # 有 session cookie 时不使用缓存
    proxy_no_cache $cookie_session;
    proxy_cache my_cache;
    proxy_pass http://backend;
}
```

---

## 2. 日志配置与分析

### 访问日志配置

```nginx
http {
    # 自定义日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # 带缓存状态的日志格式
    log_format cache '$remote_addr [$time_local] "$request" '
                     '$status $body_bytes_sent '
                     'Cache: $upstream_cache_status';
    
    access_log /var/log/nginx/access.log main;
    
    # 按虚拟主机分开日志
    server {
        server_name example.com;
        access_log /var/log/nginx/example.com.log main;
    }
}
```

### 错误日志配置

```nginx
# 全局错误日志
error_log /var/log/nginx/error.log warn;

# 按级别记录
error_log /var/log/nginx/error.log info;    # info, notice, warn, error, crit, alert, emerg
```

### 静态资源不记录日志

```nginx
# 静态资源不记录访问日志（减少磁盘 IO）
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
    access_log off;
    expires 30d;
}
```

### 日志切割（logrotate）

```bash
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 实时日志分析

```bash
# 实时查看访问日志
tail -f /var/log/nginx/access.log

# 统计状态码分布
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 统计访问最多的 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 统计访问最多的 URL
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 统计每小时访问量
awk '{print $4}' /var/log/nginx/access.log | cut -d: -f2 | sort | uniq -c
```

---

## 3. 性能优化清单

### 进程优化

```nginx
# 自动匹配 CPU 核心数
worker_processes auto;

# 绑定 CPU 核心（减少上下文切换）
worker_cpu_affinity auto;

# 单进程最大连接数
worker_rlimit_nofile 65535;

events {
    worker_connections 10240;
    use epoll;                    # Linux 下使用 epoll
    multi_accept on;              # 一次接受多个连接
}
```

### 网络优化

```nginx
http {
    # 长连接
    keepalive_timeout 65;
    keepalive_requests 100;       # 单个连接最大请求数
    
    # TCP 优化
    sendfile on;                  # 零拷贝
    tcp_nopush on;                # 合并小包
    tcp_nodelay on;               # 禁用 Nagle 算法
    
    # 缓冲区
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;
    client_max_body_size 10m;
}
```

### 文件缓存

```nginx
http {
    # 文件描述符缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

### gzip 压缩优化

```nginx
http {
    gzip on;
    gzip_min_length 1024;         # 小于 1KB 不压缩
    gzip_comp_level 6;            # 压缩级别 1-9
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application.xml+rss text/javascript;
    gzip_vary on;                 # 添加 Vary: Accept-Encoding
    gzip_proxied any;             # 代理请求也压缩
    gzip_buffers 16 8k;           # 压缩缓冲区
    gzip_http_version 1.1;
}
```

---

## 4. 安全加固配置

### 安全头配置

```nginx
server {
    # 防止点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # 防止 MIME 类型嗅探
    add_header X-Content-Type-Options "nosniff" always;
    
    # XSS 防护
    add_header X-XSS-Protection "1; mode=block" always;
    
    # HSTS（强制 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 引用策略
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 限制请求方法

```nginx
# 只允许 GET 和 POST
if ($request_method !~ ^(GET|POST)$) {
    return 405;
}
```

### 限制请求频率（限流）

```nginx
http {
    # 定义限流区域
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    server {
        location /api/ {
            # 限流：每秒 10 个请求，突发 20 个
            limit_req zone=api_limit burst=20 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
        }
    }
}
```

### IP 白名单/黑名单

```nginx
# 只允许特定 IP 访问
location /admin/ {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    
    proxy_pass http://backend;
}

# 拒绝特定 IP
location / {
    deny 192.168.1.100;
    allow all;
    
    proxy_pass http://backend;
}
```

### 隐藏版本号

```nginx
http {
    server_tokens off;  # 隐藏 Nginx 版本号
}
```

---

## 5. 完整优化配置模板

```nginx
# /etc/nginx/nginx.conf - 优化版

user nginx;
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 10240;
    use epoll;
    multi_accept on;
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
    keepalive_requests 100;
    client_max_body_size 10m;
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;

    # 文件缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # gzip 压缩
    gzip on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_vary on;
    gzip_proxied any;

    # 安全配置
    server_tokens off;
    
    # 代理缓存
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

    include /etc/nginx/conf.d/*.conf;
}
```

---

## ✅ 自检清单

- [ ] 能配置代理缓存（proxy_cache）
- [ ] 能自定义日志格式和日志切割
- [ ] 理解性能优化清单中的各项配置
- [ ] 能配置安全头和限流
- [ ] 能使用日志分析命令排查问题

---

## 🔗 相关文档

- 上一篇：[03 - HTTPS + URL 重写 + 实践项目](./03-https-url-rewrite-practice.md)
- 下一篇：[05 - Docker 部署与问题排查](./05-docker-deploy-troubleshoot.md)
- 大纲：[Nginx 学习大纲](../nginx-learning-outline.md)

---

*最后更新：2026年6月*