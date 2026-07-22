# 05 — Shell 脚本入门

> 对应 Day 5 学习内容。目标：能为部署 / 监控 / 备份写一个实用脚本。

---

## 📌 前置知识

| 项目 | 说明 |
|------|------|
| **目标读者** | 已掌握 Day 1-4 命令的开发者 |
| **需要掌握** | 文件操作、管道、重定向、`grep`/`awk`/`sed` 基础 |
| **学习产出** | 一个可用于生产环境的应用部署脚本 |

---

## 1. Shell 脚本基础

### 1.1 Shebang

Shell 脚本的第一行通常是 shebang，告诉系统用哪个解释器来执行：

```bash
#!/bin/bash
```

常见的 shebang 还有：

```bash
#!/bin/sh      # Bourne Shell（兼容最广，但功能较少）
#!/bin/bash    # Bash（功能最丰富，推荐）
#!/usr/bin/env bash  # 通过 env 查找 bash 位置（更灵活）
```

### 1.2 执行方式

有两种方式运行脚本：

```bash
# 方式一：作为 bash 参数执行（不需要可执行权限）
bash script.sh

# 方式二：直接执行（需要可执行权限）
chmod +x script.sh
./script.sh
```

两种方式的区别：

| 方式 | 需要 `chmod +x` | 依赖 shebang | 适用场景 |
|------|:---:|:---:|---------|
| `bash script.sh` | 否 | 否 | 调试、单次运行 |
| `./script.sh` | 是 | 是 | 正式脚本、部署使用 |

> **建议**：开发调试时用 `bash script.sh`，正式部署时用 `chmod +x && ./script.sh`。

### 1.3 注释

```bash
# 这是单行注释（Shell 没有多行注释语法）
echo "Hello"  # 行尾注释
```

### 1.4 基本调试

```bash
# 调试模式：逐行打印执行的命令
bash -x script.sh

# 在脚本内开启调试
set -x   # 开始调试
# ... 需要调试的代码 ...
set +x   # 关闭调试
```

`bash -x` 是排查脚本错误最常用的手段——它会显示每条命令执行前的实际内容，帮助定位变量未展开、条件判断错误等问题。

---

## 2. 变量与参数

### 2.1 变量定义与引用

```bash
# 定义变量（等号两侧不能有空格）
name="hello"

# 引用变量
echo $name
echo ${name}     # 花括号推荐写法，明确变量边界

# 字符串拼接
echo "${name} world"   # → hello world
echo "${name}_suffix"  # → hello_suffix（花括号防止歧义）
```

### 2.2 环境变量与本地变量

```bash
# 本地变量（仅当前 shell 可见）
local_var="I am local"

# 环境变量（子进程可见）
export ENV_VAR="I am env"

# 常见环境变量
echo $HOME        # /home/deploy
echo $PATH        # 可执行文件搜索路径
echo $USER        # 当前用户名

# 查看所有环境变量
env
```

### 2.3 特殊变量

```bash
#!/bin/bash

echo "脚本名: $0"
echo "第一个参数: $1"
echo "第二个参数: $2"
echo "参数个数: $#"
echo "所有参数: $@"
echo "上一条命令退出码: $?"
```

特殊变量速查表：

| 变量 | 含义 |
|------|------|
| `$0` | 脚本文件名 |
| `$1`-`$9` | 第 1-9 个位置参数 |
| `$#` | 参数个数 |
| `$@` | 所有参数（每个参数独立引用） |
| `$*` | 所有参数（当作一个字符串） |
| `$?` | 上一条命令的退出码（0 成功，非 0 失败） |
| `$$` | 当前 Shell 的 PID |

### 2.4 只读变量

```bash
readonly API_URL="https://api.example.com"
API_URL="xxx"  # 报错：readonly variable
```

### 2.5 数组

```bash
# 定义数组
arr=("a" "b" "c")

# 访问单个元素
echo "${arr[0]}"  # a

# 访问所有元素
echo "${arr[@]}"  # a b c

# 数组长度
echo "${#arr[@]}"  # 3

# 遍历数组
for item in "${arr[@]}"; do
  echo "$item"
done
```

---

## 3. 条件判断

### 3.1 if-then-else 语法

```bash
if [ 条件 ]; then
  # 条件为真时执行
elif [ 另一个条件 ]; then
  # 另一个条件为真时执行
else
  # 所有条件都不满足时执行
fi
```

> **注意**：`[` 两侧必须有空格，`]` 前也必须有空格。这是新手最容易犯的错误。

### 3.2 文件测试

```bash
file="/etc/passwd"

if [ -f "$file" ]; then      # 是否是普通文件
  echo "是普通文件"
fi

if [ -d "/tmp" ]; then       # 是否是目录
  echo "是目录"
fi

if [ -e "$file" ]; then      # 是否存在
  echo "文件存在"
fi

if [ -s "$file" ]; then      # 文件是否存在且非空
  echo "文件非空"
fi

if [ -x "/usr/bin/curl" ]; then  # 是否可执行
  echo "curl 可执行"
fi

if [ -w "/tmp" ]; then       # 是否可写
  echo "可写入"
fi
```

### 3.3 字符串比较

```bash
str1="hello"
str2="world"

if [ "$str1" = "$str2" ]; then   # 相等（注意：一个 = 号，不是 ==）
  echo "相等"
fi

if [ "$str1" != "$str2" ]; then  # 不等
  echo "不相等"
fi

if [ -z "$str1" ]; then    # 字符串为空（长度为零）
  echo "空字符串"
fi

if [ -n "$str1" ]; then    # 字符串非空
  echo "非空字符串"
fi
```

> **警示**：字符串比较时**务必把变量用双引号包裹**，否则变量为空时会报错或产生意外结果。

### 3.4 数值比较

Shell 使用专门的运算符进行数值比较（不能用 `>` `<` `=`，这些是重定向和赋值）：

```bash
a=10
b=20

if [ "$a" -eq "$b" ]; then   # 等于（equal）
  echo "相等"
fi

if [ "$a" -ne "$b" ]; then   # 不等于
  echo "不相等"
fi

if [ "$a" -lt "$b" ]; then   # 小于（less than）
  echo "$a < $b"
fi

if [ "$a" -gt "$b" ]; then   # 大于（greater than）
  echo "$a > $b"
fi

if [ "$a" -le "$b" ]; then   # 小于等于
  echo "$a <= $b"
fi

if [ "$a" -ge "$b" ]; then   # 大于等于
  echo "$a >= $b"
fi
```

数值运算符速查表：

| 运算符 | 含义 |
|--------|------|
| `-eq` | 等于 |
| `-ne` | 不等于 |
| `-lt` | 小于 |
| `-gt` | 大于 |
| `-le` | 小于等于 |
| `-ge` | 大于等于 |

### 3.5 短路运算

```bash
# &&：前一条命令成功（退出码 0）才执行后一条
mkdir -p /tmp/test && echo "目录创建成功"

# ||：前一条命令失败才执行后一条
cd /some/dir || exit 1  # 目录不存在则退出

# 组合使用
[ -f "config.json" ] && echo "配置存在" || echo "配置缺失"
```

---

## 4. 循环

### 4.1 for 循环

```bash
# 遍历列表
for fruit in apple banana orange; do
  echo "Fruit: $fruit"
done

# 遍历数字范围
for i in {1..5}; do
  echo "Number: $i"
done

# 遍历文件
for file in /var/log/*.log; do
  echo "日志文件: $file"
done

# 遍历命令输出
for user in $(cat /etc/passwd | cut -d: -f1); do
  echo "用户: $user"
done
```

### 4.2 while 循环

```bash
# 行读取（最常用）
while IFS= read -r line; do
  echo "行: $line"
done < "/path/to/file"

# 计数器
count=1
while [ "$count" -le 5 ]; do
  echo "计数: $count"
  count=$((count + 1))
done
```

> 读取文件时，`IFS=` 防止行首尾空格被截断，`-r` 防止反斜杠被转义。这是"安全读取"的标准写法。

### 4.3 break / continue

```bash
for i in {1..10}; do
  if [ "$i" -eq 5 ]; then
    break      # 跳出整个循环
  fi
  echo "$i"
done

for i in {1..5}; do
  if [ "$i" -eq 3 ]; then
    continue   # 跳过本次循环
  fi
  echo "$i"
done
```

### 4.4 实战：批量重命名文件

```bash
#!/bin/bash
# 将当前目录下所有 .txt 文件改为 .bak

for file in *.txt; do
  # 检查文件是否存在（防止没有 .txt 文件时循环一次）
  [ -f "$file" ] || continue

  mv "$file" "${file%.txt}.bak"
  echo "已重命名: $file → ${file%.txt}.bak"
done
```

`${file%.txt}` 是 Shell 的**参数扩展**——从末尾删除匹配 `.txt` 的部分，得到文件名前缀。

---

## 5. 函数

### 5.1 定义与调用

```bash
# 定义函数（两种写法等价）
say_hello() {
  echo "Hello, $1!"
}

function say_hello {
  echo "Hello, $1!"
}

# 调用函数
say_hello "World"
```

### 5.2 local 变量

```bash
my_func() {
  local local_var="只在函数内可见"
  global_var="全局可见"
  echo "$local_var"
}

my_func
echo "$global_var"    # 正常输出
echo "$local_var"     # 空（变量已销毁）
```

> **最佳实践**：函数内部变量尽量用 `local` 声明，避免污染全局作用域。

### 5.3 返回值与输出

```bash
# return：返回退出码（0-255），通过 $? 获取
is_even() {
  local num=$1
  return $((num % 2))
}

is_even 4
echo "退出码: $?"  # 0（偶数）

# echo：返回输出，通过命令替换获取
get_date() {
  echo "$(date +%Y-%m-%d)"
}

today=$(get_date)
echo "今天: $today"
```

> **关键区别**：`return` 返回数值退出码（0-255），`echo` 返回字符串输出。函数输出尽量用 `echo` + 命令替换的方式。

### 5.4 实战：日志函数封装

```bash
#!/bin/bash

LOG_FILE="/var/log/deploy.log"

log_info() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $*" | tee -a "$LOG_FILE"
}

log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" | tee -a "$LOG_FILE" >&2
}

# 使用
log_info "开始部署..."
log_error "部署失败：端口 3000 已被占用"
```

这个日志函数封装了三个关键点：
- 自动添加时间戳
- `tee -a` 同时在终端输出和写入文件
- `>&2` 将错误信息重定向到 stderr

---

## 6. 实战脚本：应用部署脚本

下面是一个完整的部署脚本，涵盖了 Shell 脚本的大部分核心知识：

```bash
#!/bin/bash
#
# deploy.sh - 应用部署脚本
# 用法: ./deploy.sh [dev|staging|prod]
# 示例: ./deploy.sh prod
#

set -e  # 任何命令失败立即退出脚本（避免"继续执行"导致更严重的后果）

# ===== 配置 =====
APP_DIR="/home/deploy/myapp"
REPO_URL="git@github.com:myorg/myapp.git"
BRANCH="main"

# ===== 日志函数 =====
log_info() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $*"
}

log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2
}

# ===== 环境检查 =====
if [ "$#" -ne 1 ]; then
  log_error "用法: $0 [dev|staging|prod]"
  exit 1
fi

ENV="$1"

if [ "$ENV" != "dev" ] && [ "$ENV" != "staging" ] && [ "$ENV" != "prod" ]; then
  log_error "无效环境: $ENV（可选: dev, staging, prod）"
  exit 1
fi

log_info "开始部署到 $ENV 环境"

# ===== 拉取代码 =====
if [ ! -d "$APP_DIR" ]; then
  log_info "应用目录不存在，执行初始克隆"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

log_info "切换到 $BRANCH 分支并拉取最新代码"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ===== 环境配置 =====
log_info "复制环境配置文件"
if [ -f ".env.$ENV" ]; then
  cp ".env.$ENV" ".env"
else
  log_error "环境配置文件 .env.$ENV 不存在"
  exit 1
fi

# ===== 安装依赖与构建 =====
log_info "安装依赖"
npm install --production

log_info "构建应用"
npm run build

# ===== 重启服务 =====
log_info "重启应用服务"
if command -v systemctl &> /dev/null; then
  sudo systemctl restart myapp
else
  # 没有 systemd 时使用 pm2
  pm2 restart myapp
fi

log_info "部署到 $ENV 环境完成"
```

### 脚本关键设计

| 设计 | 说明 |
|------|------|
| `set -e` | 任何命令失败直接退出，防止"带伤运行"导致更严重的问题 |
| 参数校验 | 检查参数个数和有效性，给出明确报错信息 |
| 日志函数 | 统一输出格式，带时间戳，便于排查 |
| 幂等性 | `git clone` 前检查目录是否存在，可重复执行 |
| 环境感知 | 根据 `$ENV` 加载对应的 `.env` 配置 |
| 降级处理 | 检测 `systemctl` 是否可用，不支持时改用 `pm2` |

---

## 7. 面试回答模板

> **问：** Shell 脚本中 `$?`、`$@`、`$#` 各代表什么？写脚本时如何做错误处理？

`$?` 是上一条命令的退出码——0 表示成功，非 0 表示失败。`$@` 是所有参数列表（每个参数独立引用，推荐使用），`$#` 是参数的个数。

错误处理我通常会做三件事：第一，在脚本开头加 `set -e`，让任何命令失败时脚本立即退出，避免"带伤运行"；第二，每条关键命令（如 `git pull`、`npm install`）后检查 `$?`，不成功时打印明确错误信息并 `exit 1`；第三，封装带时间戳的 `log_info`/`log_error` 函数，把关键步骤和错误都输出到日志文件，方便事后排查。如果脚本需要处理临时文件，还会加上 `trap` 清理，确保脚本异常退出时不会留下垃圾文件。

---

## 📝 小结

| 知识点 | 核心要点 |
|--------|---------|
| **Shebang** | `#!/bin/bash` 指定解释器 |
| **执行方式** | `bash script.sh` 调试；`./script.sh` 正式使用 |
| **变量** | `${var}` 推荐写法，`export` 导出环境变量 |
| **特殊变量** | `$0`、`$1`-`$9`、`$#`、`$@`、`$?` |
| **条件** | `[ -f file ]` 文件测试、`[ "$a" = "$b" ]` 字符串、`[ "$a" -eq "$b" ]` 数值 |
| **循环** | `for` 遍历列表/文件、`while` 读取文件 |
| **函数** | `local` 变量隔离、`echo` 输出返回值 |
| **错误处理** | `set -e`、`$?` 检查、`trap` 清理 |

Shell 脚本是**部署自动化的基石**——掌握了变量、条件、循环、函数这四个核心概念，再加上 `set -e` 做错误保护，就能写出生产可用的部署、备份、监控脚本。
