# Electron 桌面应用开发教程

> 面向有 Web 前端经验的工程师，系统掌握 Electron 桌面应用开发 —— 从架构认知到独立交付跨平台桌面应用。

---

## 🎯 学习目标

- 理解桌面端技术的四大流派及 Electron 的定位
- 掌握 Electron 的双进程架构（Main Process / Renderer Process）与 IPC 通信机制
- **先建立安全意识**，再动手写功能代码，避免 XSS → RCE 攻击链
- 熟练使用菜单、对话框、托盘、文件系统等系统级能力
- 独立完成一个完整桌面应用的开发、打包、签名与自动更新
- 面试时能清晰对比 Electron / Tauri / Flutter Desktop / NW.js 的选型取舍

---

## 📋 前置要求

| 领域 | 要求 |
|------|------|
| HTML/CSS/JS | 熟悉 DOM 操作、CSS 布局、ES6+ 语法 |
| Node.js | 了解 fs / path / child_process 等核心模块 |
| TypeScript | 基础类型定义（可选但推荐） |
| 框架经验 | React / Vue / 任意前端框架（渲染进程中使用） |

---

## 🗺️ 学习路径（六层递进）

整个教程按 **认知 → 核心 → 安全 → 应用 → 工程 → 生态速查** 六层递进：

```mermaid
graph LR
    A["认知层<br/>「桌面技术<br/>有哪些？」"] --> B["核心层<br/>双进程 / IPC /<br/>窗口架构"]
    B --> C["安全基础<br/>webPreferences /<br/>CSP / 最小暴露原则"]
    C --> D["应用层<br/>菜单 / 文件 /<br/>托盘 / 多窗口"]
    D --> E["工程层<br/>安全进阶 / 打包 /<br/>性能 / 坑点"]
    E --> F["生态速查<br/>「选库<br/>决策树」"]
    F --> G["API 速查<br/>18个模块 / 进程归属 /<br/>随用随查"]
```

| 阶段 | 文档 | 定位 |
|------|------|------|
| **认知层** | `00-桌面技术概览与Electron定位.md` | 先看清全局，再决定学什么 |
| | `01-环境搭建与项目初始化.md` | 搭好环境，跑起第一个桌面窗口 |
| **核心层** | `02-主进程与渲染进程——双进程架构全景.md` | 理解 Electron 最核心的心智模型 |
| | `03-进程间通信IPC机制深度解析.md` | 掌握主进程 ↔ 渲染进程的通信链路 |
| | `04-BrowserWindow与页面生命周期.md` | 窗口创建、配置与生命周期管理 |
| **安全基础** | `05-安全基础与webPreferences配置.md` | **在写功能代码前先建立安全意识** |
| **应用层** | `06-菜单、对话框与系统交互.md` | 应用菜单、右键菜单、系统对话框 |
| | `07-文件系统操作与数据持久化.md` | 安全地读写文件、本地数据存储 |
| | `08-托盘、Dock与系统级能力.md` | 系统托盘、全局快捷键、剪贴板 |
| | `09-多窗口管理与窗口间通信.md` | 多窗口架构与窗口间数据传递 |
| **工程层** | `10-安全进阶与反模式排查.md` | CSP 深度、XSS→RCE 攻击链、安全审计 |
| | `11-调试、构建与打包分发.md` | 从 Debug 到签名、打包、自动更新全流程 |
| | `12-性能优化与内存管理.md` | 启动速度、内存占用、渲染性能调优 |
| | `13-新手高频坑点与解决方案.md` | 路径问题、Native 模块、跨平台差异速查 |
| **生态速查** | `14-常用第三方库与生态精选.md` | UI/数据库/打包/更新等主流方案速查 |
| **速查参考** | `15-Electron常用API速查.md` | 18 个内置模块速查，含进程归属与代码示例 |

---

## 📚 各篇核心知识点

### 00 — 桌面技术概览与 Electron 定位（认知层）

- 桌面开发四大流派：原生 GUI（WinForms/Cocoa）、Qt/GTK 跨平台、WebView 壳方案、Electron/Tauri
- Electron 核心架构：Chromium + Node.js，为什么是这个组合
- 与 Tauri（Rust + WebView）、Flutter Desktop、NW.js 的深度对比
- Electron 的优势（生态、开发效率）与代价（包体积、内存占用）
- 典型案例：VS Code / Slack / Discord / Notion / Figma（桌面版）

### 01 — 环境搭建与项目初始化（认知层）

- Node.js + Electron 安装与版本管理
- 项目脚手架对比：Electron Forge vs Electron Builder vs 手动搭建
- 标准项目目录结构（main / renderer / preload）
- 第一个 Hello World 桌面窗口
- 开发环境热重载配置（electron-reload / Vite + electron）
- **Splash Screen / 启动屏实现**：窗口加载中的过渡体验

### 02 — 主进程与渲染进程：双进程架构全景（核心层 · 核心篇）

- 主进程（Main Process）：唯一、Node.js 环境、系统 API 入口
- 渲染进程（Renderer Process）：每个窗口一个、Chromium 环境、Web 技术栈
- 为什么需要双进程：安全隔离 + 系统能力访问
- preload 脚本的桥梁作用：安全地暴露 API 给渲染进程
- 与浏览器多进程架构的类比

### 03 — 进程间通信 IPC 机制深度解析（核心层 · 核心篇）

- ipcMain / ipcRenderer / contextBridge 三件套
- 两种通信模式：`invoke/handle`（请求-响应）vs `send/on`（单向推送）
- 渲染进程 → 主进程 → 渲染进程的完整通信链路
- Channel 命名规范与 TypeScript 类型安全封装
- 常见通信模式：文件读取、系统信息获取、原生模块调用

### 04 — BrowserWindow 与页面生命周期（核心层）

- BrowserWindow 核心配置项详解（frame、transparent、webPreferences）
- 窗口生命周期事件：ready-to-show、closed、focus / blur、close（拦截关闭）
- 加载本地 HTML vs 加载远程 URL vs 加载 Vite/Webpack dev server
- preload 脚本注入时机与执行上下文

### 05 — 安全基础与 webPreferences 配置（安全基础 · 重要）

> **为什么安全篇要放在功能篇之前？**
> 在 Electron 中，XSS 不只是弹窗广告 —— 它可以直接执行系统命令（RCE）。先学安全，再写功能，才能从第一行代码开始就避免埋坑。

- `nodeIntegration` / `contextIsolation` / `sandbox` 三者的关系与最佳配置
- 为什么**永远不能**在渲染进程开启 `nodeIntegration`（XSS → RCE 攻击链演示）
- preload 脚本的安全编写规范：最小暴露原则
- Content Security Policy（CSP）基础配置
- webPreferences 安全配置速查表（生产环境 vs 开发环境）

### 06 — 菜单、对话框与系统交互（应用层）

- 应用菜单（Menu.buildFromTemplate）：macOS 菜单栏 vs Windows 菜单栏差异
- 上下文菜单（右键菜单）
- 系统对话框：showOpenDialog / showSaveDialog / showMessageBox
- 通知系统（Notification）
- 快捷键注册（accelerator）：菜单项内嵌快捷键

### 07 — 文件系统操作与数据持久化（应用层）

- Node.js fs 模块在主进程中的使用
- 通过 IPC 安全地从渲染进程读写文件
- app.getPath 获取系统标准路径（userData、desktop、documents）
- electron-store / better-sqlite3 做本地数据持久化
- 拖放文件到窗口（drag & drop）
- **日志系统**：electron-log 记录运行日志与错误追踪

### 08 — 托盘、Dock 与系统级能力（应用层）

- 系统托盘（Tray）：图标、菜单、气泡通知
- macOS Dock 菜单定制与角标
- 开机自启动（auto-launch / app.setLoginItemSettings）
- **全局快捷键（globalShortcut）**：应用失焦时仍可响应（统一归入本篇）
- 剪贴板操作（clipboard）：读写文本、图片
- 电源监控（powerMonitor）

### 09 — 多窗口管理与窗口间通信（应用层）

- 创建多窗口架构：主窗口 + 设置窗口 + 关于窗口
- 窗口间通信方案：主进程中转 vs BroadcastChannel vs SharedWorker
- 模态窗口（modal）与父子窗口
- 窗口状态持久化：electron-window-state 保存位置和大小
- BrowserView vs WebContentsView 的区别与演进

### 10 — 安全进阶与反模式排查（工程层）

> 本篇是 05 安全基础的进阶，适合在写完应用层功能后回来深入学习。

- Electron 官方安全清单（Security Checklist，现行 20 条）重点解读
- CSP 高级配置：严格模式、nonce、hash、report-uri
- 常见安全反模式排查清单（checklist）
- 第三方依赖的安全审计：npm audit、依赖链分析
- 崩溃报告与错误上报：crashReporter / Sentry 集成
- 安全编码 Code Review 检查点

### 11 — 调试、构建与打包分发（工程层）

- 主进程调试：VS Code attach / `--inspect` 参数
- 渲染进程调试：Chrome DevTools（Ctrl+Shift+I）
- 打包方案对比：Electron Forge vs Electron Builder
- 代码签名：macOS 公证（notarize）、Windows EV 证书
- 自动更新机制：electron-updater + GitHub Releases / 自建服务器
- 各平台安装包格式：dmg（macOS）、nsis/exe（Windows）、AppImage / snap / deb（Linux）

### 12 — 性能优化与内存管理（工程层）

- 常见性能瓶颈：启动慢、内存高、渲染卡顿
- V8 内存限制与调优（--max-old-space-size）
- Chromium 渲染优化：禁用不必要功能、GPU 加速、硬件加速开关
- 按需加载窗口、延迟初始化
- 主进程 / 渲染进程的职责划分对性能的影响
- 实用性能监控手段：taskManager、process.memoryUsage、Chrome DevTools Performance

### 13 — 新手高频坑点与解决方案（工程层 · 速查）

- 路径问题：开发时 `__dirname` vs 打包后路径变化
- CORS 跨域问题：本地 file:// 协议的限制
- preload 路径打包后失效（asar 压缩包路径问题）
- **Native Node.js 模块编译专题**：
  - node-gyp 常见编译失败场景与解决方案
  - prebuild / prebuildify 的使用
  - N-API / node-addon-api 的迁移路径
  - Electron 版本与 Node ABI 的对应关系
  - 常用原生模块速查：node-pty / sharp / ffi-napi / better-sqlite3
- macOS 签名与公证流程
- Windows 杀毒软件误报处理
- 跨平台差异：菜单栏位置、文件路径分隔符、系统字体

### 14 — 常用第三方库与生态精选（生态速查）

- 状态管理：Zustand / Redux Toolkit / Jotai
- UI 框架：Ant Design / Arco Design / Radix UI / Shadcn/ui
- 数据库：better-sqlite3 / lowdb / Dexie / electron-store
- 打包工具：Electron Forge / Electron Builder
- 自动更新：electron-updater / update-electron-app
- 原生模块：node-pty / sharp / ffi-napi
- 国际化：i18next / react-intl
- 选库决策树

### 15 — Electron 常用 API 速查（速查参考）

- **app**：生命周期事件、getPath 路径表、单实例锁、常用方法
- **BrowserWindow**：创建配置、窗口事件、常用方法
- **webContents**：页面操作、DevTools、权限安全
- **ipcMain / ipcRenderer**：四种通信方式对比表
- **dialog**：三种对话框 + properties 速查表
- **Menu**：应用菜单模板、上下文菜单、role 速查表
- **Tray**：创建、模板图像、点击事件
- **shell**：openExternal、showItemInFolder、trashItem
- **clipboard**：文本/HTML/图片读写
- **globalShortcut**：注册/注销、Accelerator 格式速查表
- **nativeImage**：创建、resize、模板图像
- **screen**：显示器信息、光标位置
- **Notification**：通知创建、快速回复（macOS）
- **systemPreferences**：深色模式、强调色
- **protocol**：自定义协议注册、privileges 配置
- **session**：Cookie 操作、存储清理、网络拦截
- **powerMonitor**：休眠/唤醒、锁屏、空闲时间
- **net**：网络请求（推荐用原生 fetch 替代）
- **模块可用进程速查表**：18 个模块的主进程/preload/渲染进程归属

---

## 🕹️ 实践项目：Markdown 笔记编辑器

### 基础功能（覆盖核心知识点）

- 多窗口：主编辑窗口 + 设置窗口 + 关于窗口
- IPC 通信：渲染进程请求主进程读写文件
- 菜单系统：文件菜单（新建/打开/保存/导出）、编辑菜单（撤销/重做）、窗口菜单
- 文件系统：打开本地 .md 文件、保存、拖放导入
- 数据持久化：electron-store 保存用户偏好（主题、窗口位置、最近打开文件）
- 系统托盘：最小化到托盘、托盘快捷菜单
- 自动更新：electron-updater 检查新版本并提示更新
- 安全：contextIsolation + preload 脚本安全暴露 API

### 进阶挑战（拉开深度）

| 挑战 | 涉及知识点 |
|------|-----------|
| **插件系统** | 动态加载第三方插件、安全沙箱、插件 API 设计 |
| **主题/暗色模式** | nativeTheme API、系统级主题跟随、CSS 变量动态切换 |
| **国际化 i18n** | i18next 集成、多语言切换、语言包动态加载 |
| **崩溃上报** | crashReporter + Sentry 集成、错误日志收集 |
| **协作文档**（可选） | WebSocket 实时同步、冲突解决、CRDT/OT 算法 |

### 项目结构建议

```
markdown-editor/
├── src/
│   ├── main/                    # 主进程
│   │   ├── index.ts             # 入口、窗口创建、菜单
│   │   ├── ipc-handlers.ts      # IPC 处理器
│   │   ├── tray.ts              # 系统托盘
│   │   ├── updater.ts           # 自动更新
│   │   └── logger.ts            # 日志系统
│   ├── renderer/                # 渲染进程
│   │   ├── App.tsx              # React/Vue 应用入口
│   │   ├── components/          # 编辑器组件
│   │   ├── stores/              # 状态管理
│   │   └── i18n/                # 国际化资源
│   └── preload/
│       └── index.ts             # contextBridge 暴露安全 API
├── plugins/                     # 插件目录（进阶挑战）
├── electron-builder.yml         # 打包配置
└── package.json
```

---

## 🗓️ 建议时间线（每天 1-2 小时）

| 时间段 | 内容 | 积累成果 |
|--------|------|----------|
| 第 1 天 | `00` 桌面技术概览 | 理解四大流派，能画选型决策树 |
| 第 2 天 | `01` 环境搭建 | 跑起第一个 Electron 窗口 |
| 第 3-4 天 | `02` 双进程架构 | 理解主进程/渲染进程/preload 三角关系 |
| 第 5 天 | `03` IPC 通信 | 掌握 invoke/handle + send/on |
| 第 6 天 | `04` BrowserWindow | 窗口配置与生命周期 |
| **第 7 天** | **`05` 安全基础** | **从第一行代码就安全** |
| 第 8-9 天 | `06` 菜单与对话框 | 应用菜单 + 系统对话框 |
| 第 10-11 天 | `07` 文件系统与持久化 | 安全读写文件 + electron-store + 日志 |
| 第 12 天 | `08` 托盘与系统能力 | 系统托盘 + 全局快捷键 |
| 第 13 天 | `09` 多窗口管理 | 多窗口架构与窗口间通信 |
| 第 14 天 | `10` 安全进阶 | CSP 深度、反模式排查、崩溃上报 |
| 第 15-16 天 | `11` 调试与打包 | 打出各平台安装包 |
| 第 17 天 | `12` 性能优化 | 掌握启动/内存/渲染调优手段 |
| 第 18 天 | `13` 高频坑点 | Native 模块编译、跨平台差异速查 |
| 第 19 天 | `14` 生态速查 | 选型决策树，按需查阅各库 |
| 第 20 天 | `15` API 速查 | 随用随查，掌握 18 个内置模块 |
| 第 21-24 天 | 实践项目 | 完成 Markdown 编辑器（含进阶挑战） |
| **合计** | **~24 天** | **独立开发 + 打包 + 分发能力** |

---

## ✅ 完成标准

- 能独立用 Electron 开发一个完整的桌面应用（含菜单、文件操作、托盘、多窗口）
- 能清晰解释主进程、渲染进程、preload 脚本的职责边界与通信链路
- **能按 Electron 官方安全准则配置 webPreferences 和 CSP，能排查常见安全反模式**
- 能完成 macOS / Windows / Linux 三平台的打包、签名与自动更新
- 能排查 Native 模块编译失败、路径失效等高频坑点
- 面试时能画出 Electron 的双进程架构图，并对比 Tauri / Flutter Desktop 的取舍

---

## 🆚 桌面端技术面试对比总表

| 维度 | Electron | Tauri | Flutter Desktop | NW.js |
|------|----------|-------|-----------------|-------|
| **底层引擎** | Chromium + Node.js | 系统 WebView + Rust | Skia 自绘引擎 | Chromium + Node.js |
| **渲染方式** | Chromium 全量渲染 | 系统原生 WebView | 自绘（非 WebView） | Chromium 全量渲染 |
| **包体积** | 大（~150MB+） | 小（~3-10MB） | 中（~20-30MB） | 大（~150MB+） |
| **内存占用** | 高 | 低 | 中 | 高 |
| **性能** | 中等 | 高（Rust 后端） | 高（自绘引擎） | 中等 |
| **开发语言** | JS / TS + Web 技术 | JS / TS + Rust（后端） | Dart | JS / TS + Web 技术 |
| **前端框架** | 任意（React/Vue/Svelte） | 任意（React/Vue/Svelte） | Flutter Widget | 任意（React/Vue/Svelte） |
| **系统 API** | Node.js + Electron API | Rust 插件系统 | Flutter Platform Channel | Node.js + NW.js API |
| **安全模型** | contextIsolation + sandbox | Rust 沙箱，默认隔离 | 原生沙箱 | 弱，默认开放 |
| **热重载** | ✅ HMR | ✅ Vite HMR | ✅ Hot Reload | ✅ HMR |
| **跨端范围** | Mac / Win / Linux | Mac / Win / Linux + 移动端 | Mac / Win / Linux / iOS / Android | Mac / Win / Linux |
| **生态成熟度** | 最成熟（npm 全量） | 快速成长中 | 成熟（Flutter 生态） | 衰退中 |
| **代表应用** | VS Code, Slack, Discord | Cody (Sourcegraph)、Lapce | Ubuntu Installer | 早期微信开发者工具 |
| **适用场景** | 复杂桌面工具、IDE 类应用 | 轻量桌面工具、对包体积敏感 | 已有 Flutter 移动端需要桌面扩展 | 历史项目维护 |

---

## 📝 学习建议

- 按 **认知 → 核心 → 安全 → 应用 → 工程** 的顺序不可跳，前两层（尤其是 02/03 双进程架构和 IPC）是 Electron 的核心心智模型，地基打牢了后面才不慌
- **安全篇（05）务必先学**：Electron 的安全问题比 Web 严重得多 —— XSS 在 Electron 中可以直接执行系统命令（RCE），这是普通 Web 开发不存在的攻击面。05 帮你从第一行代码就建立安全意识，10 再深入攻防细节
- 各篇文档内嵌了大量可运行的代码示例，建议动手敲而不是只看文档
- 遇到打包后路径失效、preload 加载失败等问题不要慌 —— `13-新手高频坑点与解决方案.md` 里收录了最常见的问题
- 如果你已经熟悉 Node.js 和 Web 开发，可以直接从 `02` 开始，但建议快速扫一遍 `00` 的面试对比表和 `05` 的安全速查表