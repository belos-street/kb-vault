# 安卓 Obsidian 单向拉取 GitHub 知识库

> 电脑端负责 push 上传 GitHub，手机只做**单向 pull**，只同步云端更新，不往 GitHub 写任何内容。

两套方案，优先推荐方案 1（原生 Git 稳定、大库不卡），方案 2 纯插件不用装 Termux。

## 方案一：Termux + Git（最稳，推荐，适合大量笔记/大图库）

优势：原生 git、支持 ghproxy 加速、可一键桌面小组件拉取、完全只拉不推送，Obsidian 直接读取手机本地文件夹。

### 1. 准备工作

1. F-Droid 下载安装 **Termux**（应用商店阉割版不能装 git）
2. GitHub 生成**个人访问令牌 PAT**（设置 → Developer settings → Personal access tokens，勾选 `repo` 全部权限，复制保存）
3. 电脑端仓库地址格式：`https://github.com/用户名/库名.git`

### 2. 基础环境安装（Termux 内逐条执行）

```bash
# 更新源
pkg update && pkg upgrade -y
# 安装 git
pkg install git -y
# 授予 Termux 访问手机真实存储（必须）
termux-setup-storage
```

弹出文件权限，点**允许**。

### 3. 克隆仓库到 Obsidian 可读目录（Documents 最佳）

```bash
# 进入手机 Documents 文件夹
cd ~/storage/shared/Documents
# ghproxy 加速克隆，替换信息：用户名、PAT、仓库名
git clone https://github.com/belos-street/kb-vault.git
```

克隆完成后，路径：`内部存储/Documents/仓库名`，Obsidian 直接打开这个文件夹作为库。

### 4. 单向拉取脚本（只 pull，完全禁止 push）

新建一键拉取脚本，**只下载云端更新，不会上传手机任何修改**：

```bash
# 创建脚本
nano pull_only.sh
```

粘贴下面代码（修改 `VAULT_PATH` 为你的仓库文件夹名）

```bash
#!/data/data/com.termux/files/usr/bin/bash
# ========== 修改这里 ==========
VAULT_PATH="/storage/emulated/0/Documents/你的仓库名"
# ==============================

# 解决安卓 git 安全目录报错
git config --global --add safe.directory "$VAULT_PATH"
cd "$VAULT_PATH" || exit 1

# 仅拉取云端，放弃本地改动，云端版本强制覆盖本地（单向同步核心）
git fetch origin
git reset --hard origin/main
echo "✅ 拉取完成，已同步 GitHub 最新文件"
```

- `git reset --hard origin/main`：**强制用 GitHub 覆盖手机本地**，完美实现单向同步，手机改了也不会上传，下次拉取直接恢复云端版本。
- 把 `main` 换成你的分支（很多旧库是 master）

保存退出：`Ctrl+O` 回车，`Ctrl+X`

赋予执行权限：

```bash
chmod +x pull_only.sh
```

### 5. 使用方法

1. 手动拉取：打开 Termux 执行

```bash
cd ~/storage/shared/Documents
./pull_only.sh
```

2. 桌面一键小组件（懒人必备）

安装 Termux Widget，把脚本添加到桌面，点一下自动拉取，不用进终端。
