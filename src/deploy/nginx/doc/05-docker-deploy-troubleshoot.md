# 05 - Docker 部署与问题排查

> 容器化部署 Nginx + 常见错误排查 —— 实战能力证明。

---

## 🎯 学习目标

- 掌握 Docker 部署 Nginx 的完整流程
- 学会使用 docker-compose 编排 Nginx + 应用
- 掌握常见错误排查方法
- 能独立完成生产环境的容器化部署

---

## 1. Docker 基础部署

### 快速启动

```bash
# 拉取镜像
docker pull nginx:alpine

# 运行容器
docker run -d \
  --name nginx \
  -p 80:80 \
  -p 443:443 \
  nginx:alpine

# 查看运行状态
docker ps

# 查看日志
docker logs nginx
```

### 挂载配置文件

```bash
# 挂载配置文件和静态资源
docker run -d \
  --name nginx \
  -p 80:80 \
  -v /path/to/nginx.conf:/etc/nginx/nginx.conf \
  -v /path/to/conf.d:/etc/nginx/conf.d \
  -v /path/to/html:/usr/share/nginx/html \
  -v /path/to/logs:/var/log/nginx \
  nginx:alpine
```

### Dockerfile 模板

```dockerfile
# Dockerfile
FROM nginx:alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# 复制静态资源
COPY static/ /usr/share/nginx/html/

# 复制 SSL 证书（可选）
COPY certs/ /etc/nginx/certs/

# 暴露端口
EXPOSE 80 443

# 启动 Nginx（前台运行）
CMD ["nginx", "-g", "daemon off;"]
```

### 构建镜像

```bash
# 构建镜像
docker build -t my-nginx:latest .

# 运行自定义镜像
docker run -d \
  --name my-nginx \
  -p 80:80 \
  -p 443:443 \
  my-nginx:latest
```

---

## 2. Docker Compose 配置

### 基础配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./conf.d:/etc/nginx/conf.d
      - ./html:/usr/share/nginx/html
      - ./logs:/var/log/nginx
      - ./certs:/etc/nginx/certs
    restart: always
    networks:
      - web-network

networks:
  web-network:
    driver: bridge
```

### Nginx + Node.js 应用

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Node.js 应用
  app:
    build: ./app
    container_name: node-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
    networks:
      - web-network

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/html:/usr/share/nginx/html
      - ./nginx/certs:/etc/nginx/certs
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    restart: always
    networks:
      - web-network

networks:
  web-network:
    driver: bridge
```

### Nginx 配置（Docker 环境）

```nginx
# nginx/conf.d/app.conf
server {
    listen 80;
    server_name example.com;

    # 静态资源
    location /static/ {
        alias /usr/share/nginx/html/static/;
        expires 30d;
    }

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://app:3000;  # 使用 Docker 服务名
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HTTPS 配置（Docker 环境）

```yaml
# docker-compose.yml（带 HTTPS）
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/certs:/etc/nginx/certs
      - ./nginx/logs:/var/log/nginx
    restart: always
```

```nginx
# nginx/conf.d/app.conf（HTTPS 版本）
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. 常见错误排查

### 502 Bad Gateway

**原因**：后端服务不可用

```bash
# 1. 检查后端容器是否运行
docker ps | grep app

# 2. 检查后端日志
docker logs app

# 3. 检查网络连接
docker exec nginx ping app

# 4. 检查端口
docker exec nginx netstat -tlnp | grep 3000

# 5. 检查 Nginx 错误日志
docker exec nginx cat /var/log/nginx/error.log
```

**常见原因**：
- 后端容器未启动
- 后端服务崩溃
- 网络配置错误（容器不在同一网络）
- proxy_pass 地址错误

### 504 Gateway Timeout

**原因**：后端响应超时

```nginx
# 增大超时时间
location / {
    proxy_pass http://app:3000;
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

**排查步骤**：
```bash
# 1. 检查后端响应时间
docker exec nginx curl -w "@curl-format.txt" -o /dev/null -s http://app:3000

# 2. 检查后端日志
docker logs app --tail 100

# 3. 检查资源使用
docker stats app
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
# 1. 检查文件权限
docker exec nginx ls -la /usr/share/nginx/html

# 2. 检查 Nginx 用户
docker exec nginx cat /etc/nginx/nginx.conf | grep user

# 3. 修复权限
docker exec nginx chown -R nginx:nginx /usr/share/nginx/html
docker exec nginx chmod -R 755 /usr/share/nginx/html
```

### 配置不生效

```bash
# 1. 检查配置语法
docker exec nginx nginx -t

# 2. 重载配置
docker exec nginx nginx -s reload

# 3. 重启容器
docker restart nginx

# 4. 检查配置文件挂载
docker inspect nginx | grep -A 10 "Mounts"
```

### 端口冲突

```bash
# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# 停止占用端口的进程
sudo systemctl stop apache2  # 如果是 Apache
sudo lsof -ti:80 | xargs sudo kill -9
```

---

## 4. 排查命令速查

### Docker 相关

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止）
docker ps -a

# 查看容器日志
docker logs nginx
docker logs nginx --tail 100  # 最后 100 行
docker logs nginx -f          # 实时查看

# 进入容器
docker exec -it nginx /bin/sh

# 查看容器资源使用
docker stats nginx

# 查看容器详细信息
docker inspect nginx

# 重启容器
docker restart nginx

# 停止容器
docker stop nginx

# 启动容器
docker start nginx
```

### Nginx 相关（容器内）

```bash
# 检查配置语法
docker exec nginx nginx -t

# 重载配置
docker exec nginx nginx -s reload

# 查看错误日志
docker exec nginx cat /var/log/nginx/error.log
docker exec nginx tail -f /var/log/nginx/error.log

# 查看访问日志
docker exec nginx cat /var/log/nginx/access.log
docker exec nginx tail -f /var/log/nginx/access.log

# 检查端口
docker exec nginx netstat -tlnp
docker exec nginx ss -tlnp

# 检查进程
docker exec nginx ps aux | grep nginx
```

### 网络相关

```bash
# 查看 Docker 网络
docker network ls

# 查看网络详情
docker network inspect web-network

# 测试容器间连接
docker exec nginx ping app
docker exec nginx curl http://app:3000

# 查看容器 IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nginx
```

---

## 5. 生产环境部署清单

### 部署前检查

- [ ] 配置文件语法检查通过（`nginx -t`）
- [ ] SSL 证书已准备好
- [ ] 日志目录已创建并有写入权限
- [ ] 静态资源已准备好
- [ ] 后端服务已启动并可访问

### 安全检查

- [ ] 隐藏 Nginx 版本号（`server_tokens off`）
- [ ] 配置安全头（X-Frame-Options、X-Content-Type-Options 等）
- [ ] 启用 HTTPS 并强制跳转
- [ ] 配置限流（`limit_req_zone`）
- [ ] 限制请求方法
- [ ] 配置 IP 白名单/黑名单（如需要）

### 性能检查

- [ ] 启用 gzip 压缩
- [ ] 配置静态资源缓存（`expires`）
- [ ] 配置代理缓存（`proxy_cache`）
- [ ] 优化 worker 进程数（`worker_processes auto`）
- [ ] 优化连接数（`worker_connections 10240`）

### 监控检查

- [ ] 访问日志已开启
- [ ] 错误日志已开启
- [ ] 日志切割已配置
- [ ] 健康检查接口已配置

---

## 6. 实战：完整部署流程

### 场景

部署一个 Node.js 应用，使用 Nginx 反向代理，配置 HTTPS。

### 步骤

#### 1. 创建项目结构

```
project/
├── app/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── nginx/
│   ├── conf.d/
│   │   └── app.conf
│   ├── certs/
│   │   ├── fullchain.pem
│   │   └── privkey.pem
│   └── logs/
├── docker-compose.yml
└── README.md
```

#### 2. 编写 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: ./app
    container_name: node-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
    networks:
      - web-network

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/certs:/etc/nginx/certs
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    restart: always
    networks:
      - web-network

networks:
  web-network:
    driver: bridge
```

#### 3. 编写 Nginx 配置

```nginx
# nginx/conf.d/app.conf
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 10m;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

#### 4. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试访问
curl -I https://example.com
```

#### 5. 常用维护命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新并重启
docker-compose up -d --build

# 查看资源使用
docker-compose top
```

---

## ✅ 自检清单

- [ ] 能使用 Docker 部署 Nginx
- [ ] 能编写 Dockerfile 和 docker-compose.yml
- [ ] 能配置 Nginx 反向代理到其他容器
- [ ] 能排查 502/504/413 等常见错误
- [ ] 能使用排查命令快速定位问题
- [ ] 能完成生产环境的容器化部署

---

## 🎓 Nginx 学习完成

恭喜！你已经完成了 Nginx 的全部学习内容。

### 学习成果总结

| 编号 | 内容 | 能力 |
|------|------|------|
| 01 | 架构 + 配置结构 + 静态资源 | 能搭建基础服务器 |
| 02 | Location + 反向代理 + 负载均衡 | 能配置生产环境代理 |
| 03 | HTTPS + URL 重写 + 实战 | 能完成安全加固 |
| 04 | 缓存、日志、性能调优 | 能优化服务性能 |
| 05 | Docker 部署 + 问题排查 | 能容器化部署 |

### 面试准备清单

- [ ] 能解释 Nginx 的 Master-Worker 进程模型
- [ ] 能说出 Location 匹配的 4 级优先级
- [ ] 能解释正向代理与反向代理的区别
- [ ] 能配置 4 种负载均衡策略
- [ ] 能配置 HTTPS 和 URL 重写
- [ ] 能排查常见错误（502/504/413）

---

## 🔗 相关文档

- 上一篇：[04 - 高级优化](./04-advanced-optimization.md)
- 大纲：[Nginx 学习大纲](../nginx-learning-outline.md)

---

*最后更新：2026年6月*