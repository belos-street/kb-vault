# 04 — BrowserWindow 与页面生命周期

> 对应大纲：核心层 | 预计时间：1 天
> 面试可答：`BrowserWindow` 是 Electron 中创建和管理窗口的核心类。每个窗口对应一个渲染进程，通过 `webPreferences` 配置安全策略。窗口有完整的生命周期事件——`ready-to-show` 表示页面首次渲染完成，`close` 可以拦截关闭操作，`closed` 用于清理资源。页面可以加载本地 HTML、远程 URL 或开发服务器地址。

---

## 1. BrowserWindow 核心配置

### 1.1 创建一个基本窗口

```typescript
import { BrowserWindow } from 'electron';
import path from 'node:path';

const win = new BrowserWindow({
  width: 1024,
  height: 768,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    sandbox: true,
  },
});

win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
```

### 1.2 窗口外观配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `width` | number | 800 | 窗口宽度（像素） |
| `height` | number | 600 | 窗口高度（像素） |
| `minWidth` / `minHeight` | number | 无 | 窗口最小尺寸 |
| `maxWidth` / `maxHeight` | number | 无 | 窗口最大尺寸 |
| `x` / `y` | number | 居中 | 窗口初始位置 |
| `title` | string | 文件名 | 窗口标题 |
| `icon` | NativeImage / string | Electron 图标 | 应用图标 |
| `show` | boolean | `true` | 是否在创建时立即显示 |
| `frame` | boolean | `true` | 是否显示原生窗口边框 |
| `transparent` | boolean | `false` | 窗口背景是否透明 |
| `resizable` | boolean | `true` | 是否可调整大小 |
| `fullscreenable` | boolean | `true` | 是否可进入全屏 |
| `alwaysOnTop` | boolean | `false` | 是否置顶 |
| `skipTaskbar` | boolean | `false` | 是否在任务栏中隐藏 |
| `titleBarStyle` | string | `'default'` | 标题栏样式（macOS） |

### 1.3 常见窗口样式

**无边框透明窗口**（适合自定义标题栏、Splash Screen）：

```typescript
const framelessWin = new BrowserWindow({
  width: 400,
  height: 300,
  frame: false,
  transparent: true,
  webPreferences: {
    contextIsolation: true,
  },
});
```

**macOS 隐藏标题栏 + 内容延伸到标题栏区域**：

```typescript
const macStyleWin = new BrowserWindow({
  width: 1024,
  height: 768,
  titleBarStyle: 'hiddenInset', // macOS: 隐藏标题栏但保留红绿灯按钮
  trafficLightPosition: { x: 12, y: 12 }, // 红绿灯按钮位置
  webPreferences: {
    contextIsolation: true,
  },
});
```

在 CSS 中处理标题栏区域：

```css
body {
  padding-top: 28px; /* 给红绿灯按钮留出空间 */
  -webkit-app-region: drag; /* 整个区域可拖动窗口 */
}

button {
  -webkit-app-region: no-drag; /* 按钮不可拖动（否则点不了） */
}
```

**置顶窗口**（适合悬浮工具、画中画）：

```typescript
const alwaysOnTopWin = new BrowserWindow({
  width: 300,
  height: 200,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  webPreferences: {
    contextIsolation: true,
  },
});
```

---

## 2. webPreferences 配置

`webPreferences` 是 BrowserWindow 中最重要的配置项，它决定了渲染进程的安全边界和能力边界。

### 2.1 完整配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `contextIsolation` | boolean | `true` | 是否隔离 preload 和渲染进程的 JS 上下文 |
| `sandbox` | boolean | `true` | 是否启用 Chromium 沙箱 |
| `nodeIntegration` | boolean | `false` | 渲染进程是否可访问 Node.js |
| `preload` | string | 无 | preload 脚本路径 |
| `webSecurity` | boolean | `true` | 是否启用同源策略（禁用 = 允许跨域） |
| `allowRunningInsecureContent` | boolean | `false` | 是否允许 HTTPS 页面加载 HTTP 资源 |
| `images` | boolean | `true` | 是否允许加载图片 |
| `javascript` | boolean | `true` | 是否允许执行 JavaScript |
| `webgl` | boolean | `true` | 是否允许 WebGL |
| `plugins` | boolean | `false` | 历史遗留选项：NPAPI 插件已从 Chromium 移除，此配置无实际效果，无需设置 |
| `devTools` | boolean | `true` | 是否允许打开 DevTools |

### 2.2 安全配置速查

**生产环境推荐配置**（第 05 篇会详细讲安全原理）：

```typescript
const secureWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // ✅ 必须开启
    sandbox: true,            // ✅ 必须开启
    nodeIntegration: false,   // ✅ 必须保持 false
    webSecurity: true,        // ✅ 必须保持 true
    devTools: false,          // 生产环境可关闭 DevTools
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

**开发环境配置**（可以适当放宽）：

```typescript
const devWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // ✅ 开发环境也要保持
    sandbox: true,            // ✅ 开发环境也要保持
    nodeIntegration: false,   // ✅ 始终 false
    webSecurity: true,        // 开发环境也建议保持
    devTools: true,           // 开发环境开启 DevTools
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

> ⚠️ `contextIsolation` 和 `sandbox` 在开发和生产环境都应该是 `true`。第 05 篇（安全基础）会详细解释为什么。

---

## 3. 窗口生命周期事件

### 3.1 事件时间线

```
new BrowserWindow()
      │
      ▼
  ┌──────────────┐
  │  创建窗口对象  │
  └──────┬───────┘
         │
         ▼
  loadFile() / loadURL()
         │
         ▼
  ┌──────────────┐
  │ did-start-    │  ← 开始加载页面
  │ navigation    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ dom-ready     │  ← 顶层 frame 文档加载完成（≈DOMContentLoaded），可以操作 DOM
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ did-finish-   │  ← 导航完成且 onload 已触发（≈window.onload）
  │ load          │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ ready-to-show│  ← 页面首次渲染完成，适合显示窗口
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  窗口可见     │  ← 用户可以看到内容了
  └──────┬───────┘
         │
    用户点击关闭
         │
         ▼
  ┌──────────────┐
  │ close         │  ← 可以拦截关闭（e.preventDefault()）
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ closed        │  ← 窗口已销毁，清理资源
  └──────────────┘
```

### 3.2 重点事件详解

**`ready-to-show`**：页面首次渲染完成

```typescript
const win = new BrowserWindow({
  show: false, // 先隐藏
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
  },
});

win.loadFile('index.html');

win.once('ready-to-show', () => {
  win.show(); // 渲染完成后才显示，避免白屏闪烁
});
```

这是最常用的模式——先隐藏窗口，等页面渲染完成后再显示。避免用户看到窗口加载过程中的白屏。

**`close`**：拦截窗口关闭

```typescript
let isDirty = false; // 标记是否有未保存的修改

win.on('close', (e) => {
  if (isDirty) {
    e.preventDefault(); // 阻止关闭

    const choice = dialog.showMessageBoxSync(win, {
      type: 'warning',
      buttons: ['保存', '不保存', '取消'],
      defaultId: 0,
      title: '未保存的更改',
      message: '当前文件有未保存的修改，是否保存？',
    });

    if (choice === 0) {
      // 保存后关闭
      saveFile().then(() => {
        isDirty = false;
        win.close(); // 这次 close 不会被拦截（因为 isDirty 已经是 false）
      });
    } else if (choice === 1) {
      // 不保存，直接关闭
      isDirty = false;
      win.close();
    }
    // choice === 2：取消，什么都不做
  }
});
```

**`closed`**：窗口已销毁

```typescript
win.on('closed', () => {
  // 窗口已经销毁，清理引用
  // 如果是单窗口应用，这里可以设置 mainWindow = null
  mainWindow = null;
});
```

**`focus` / `blur`**：窗口获得/失去焦点

```typescript
win.on('focus', () => {
  console.log('窗口获得焦点');
  // 可以在这里恢复定时器、刷新数据
});

win.on('blur', () => {
  console.log('窗口失去焦点');
  // 可以在这里暂停动画、保存状态
});
```

### 3.3 常用窗口方法

```typescript
// 显示 / 隐藏
win.show();
win.hide();
win.isVisible();

// 最小化 / 最大化 / 全屏
win.minimize();
win.maximize();
win.isMaximized();
win.setFullScreen(true);
win.isFullScreen();

// 聚焦
win.focus();
win.isFocused();

// 位置和大小
win.setBounds({ x: 100, y: 100, width: 800, height: 600 });
win.getBounds();
win.setSize(1024, 768);
win.getSize();
win.setPosition(200, 200);
win.getPosition();

// 标题
win.setTitle('My App');
win.getTitle();

// DevTools
win.webContents.openDevTools({ mode: 'detach' });
win.webContents.closeDevTools();

// 刷新
win.reload();
win.webContents.reloadIgnoringCache();
```

---

## 4. 加载页面的三种方式

### 4.1 加载本地 HTML 文件

```typescript
// 加载项目中的 HTML 文件
win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

// 带查询参数
win.loadFile(path.join(__dirname, 'renderer', 'index.html'), {
  query: { page: 'home' },
});
```

适合：生产环境，HTML 文件打包在应用中。

### 4.2 加载远程 URL

```typescript
// 加载远程网页
win.loadURL('https://example.com');

// 加载带认证的 URL
win.loadURL('https://app.example.com', {
  httpReferrer: 'https://example.com',
  userAgent: 'MyApp/1.0',
});
```

适合：将 Electron 作为已有网站的桌面壳。

### 4.3 加载 Vite/Webpack 开发服务器

开发时，渲染进程通常由 Vite 或 Webpack 的 dev server 提供服务：

```typescript
// 开发环境：加载 Vite dev server
if (process.env.NODE_ENV === 'development') {
  win.loadURL('http://localhost:5173');
  win.webContents.openDevTools();
} else {
  // 生产环境：加载打包后的 HTML
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}
```

### 4.4 三种方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| `loadFile` | 生产环境 | 离线可用、加载快、无网络依赖 | 需要打包 HTML/CSS/JS |
| `loadURL` | 包装远程网站 | 无需打包前端代码 | 依赖网络、无法离线 |
| `loadURL`（dev server） | 开发环境 | 支持 HMR、开发体验好 | 仅开发用、需要启动 dev server |

---

## 5. preload 脚本注入时机与执行上下文

### 5.1 注入时机

preload 脚本在渲染进程的页面脚本**之前**执行：

```
时间线 →

渲染进程创建
      │
      ▼
 preload 脚本执行     ← 先执行 preload
      │                  （可以访问 Node.js API + DOM）
      ▼
 页面 HTML 加载
      │
      ▼
 页面 <script> 执行   ← 后执行页面脚本
      │                  （可以访问 window.electronAPI）
      ▼
 DOMContentLoaded
      │
      ▼
 页面完全加载
```

这意味着：
- preload 中设置的 `window.electronAPI`，页面脚本中**一定可以访问到**
- preload 中可以监听页面的 DOM 事件（但不建议这样做，职责分离）

### 5.2 preload 的执行上下文

preload 脚本运行在一个特殊的上下文中：

```typescript
// src/preload.ts

// ✅ 可以访问 Node.js 模块
import { ipcRenderer } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// ✅ 可以访问 DOM（但不应该这样做）
document.querySelector('body'); // 能工作，但不推荐

// ✅ 可以访问 window 对象
window.myCustomVar = 'hello';

// ✅ 通过 contextBridge 安全暴露 API
import { contextBridge } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => process.platform,
  getPath: () => __dirname,
});
```

### 5.3 contextIsolation 的作用

当 `contextIsolation: true`（默认）时，preload 和页面脚本的 JavaScript 上下文是**隔离**的：

```
┌─────────────────────────────────────┐
│  preload 上下文                      │
│  → 可以访问 require / process / __dirname │
│  → 设置的 window.xxx 对页面不可见     │
│                                     │
│  通过 contextBridge.exposeInMainWorld │
│  将 API 注入到 ↓                    │
├─────────────────────────────────────┤
│  页面上下文（隔离的）                 │
│  → 不能访问 require / process        │
│  → 只能访问 contextBridge 暴露的 API │
│  → 也就是 window.electronAPI        │
└─────────────────────────────────────┘
```

```typescript
// ❌ 当 contextIsolation: true 时，这样不行：
// preload 中
window.myAPI = { readFile: () => { ... } };

// 页面脚本中
window.myAPI.readFile(); // ❌ undefined！上下文隔离了

// ✅ 必须通过 contextBridge
// preload 中
contextBridge.exposeInMainWorld('myAPI', {
  readFile: () => { ... },
});

// 页面脚本中
window.myAPI.readFile(); // ✅ 可以访问
```

### 5.4 __dirname 在 preload 中的行为

preload 脚本中的 `__dirname` 指向 preload 脚本文件所在的目录，而不是应用根目录：

```
打包前：
  src/main.ts       → __dirname = /project/src/
  src/preload.ts    → __dirname = /project/src/

打包后（asar 压缩包内）：
  app.asar/main.js  → __dirname = /path/to/app.asar/
  app.asar/preload.js → __dirname = /path/to/app.asar/
```

如果需要在 preload 中加载资源文件，注意路径的变化。第 13 篇（高频坑点）会详细讲打包后的路径问题。

---

## 6. 窗口管理常用模式

### 6.1 单例窗口

防止重复创建同一个窗口：

```typescript
let mainWindow: BrowserWindow | null = null;

function getOrCreateMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}
```

### 6.2 macOS 单实例行为

macOS 的惯例是：关闭所有窗口后，应用不退出，点击 Dock 图标重新创建窗口：

```typescript
app.whenReady().then(() => {
  getOrCreateMainWindow();
});

// macOS：所有窗口关闭后不退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS：点击 Dock 图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    getOrCreateMainWindow();
  }
});
```

### 6.3 拦截窗口关闭 + 自动保存

这是桌面应用最常见的模式——关闭窗口时自动保存用户数据：

```typescript
// 注意：removeListener 必须传入同一个函数引用，
// 传入新的匿名函数（() => {}）不会移除任何监听器
const handleClose = async (e: Electron.Event) => {
  e.preventDefault(); // 先阻止关闭

  // 通知渲染进程保存数据
  mainWindow.webContents.send('app:before-close');

  // 等渲染进程确认保存完成（通过 IPC）
  // 这里简化为直接保存
  try {
    await saveAppState();
  } catch (err) {
    console.error('保存失败:', err);
  }

  // 移除本监听器后再关闭，避免再次进入拦截逻辑
  mainWindow.removeListener('close', handleClose);
  mainWindow.close();
};

mainWindow.on('close', handleClose);
```

---

## 7. BrowserWindow 常用 webContents 方法

`webContents` 是 BrowserWindow 内部的渲染引擎实例，提供了大量控制渲染进程的方法：

```typescript
const wc = win.webContents;

// 页面导航
wc.loadURL('https://example.com');
wc.loadFile('index.html');
wc.goBack();
wc.goForward();
wc.reload();

// DevTools
wc.openDevTools({ mode: 'right' });
wc.closeDevTools();
wc.isDevToolsOpened();

// 执行 JavaScript（在渲染进程中执行）
wc.executeJavaScript('document.title').then((title) => {
  console.log('页面标题:', title);
});

// 发送 IPC 消息给渲染进程
wc.send('channel-name', data);

// 获取页面信息
console.log(wc.getTitle());     // 页面标题
console.log(wc.getURL());       // 当前 URL
console.log(wc.isLoading());    // 是否正在加载
console.log(wc.isCrashed());    // 是否崩溃

// 打印
wc.print();
wc.printToPDF({}).then((data) => {
  fs.writeFileSync('output.pdf', data);
});

// 截图
wc.capturePage().then((image) => {
  fs.writeFileSync('screenshot.png', image.toPNG());
});
```

---

## ✏️ 练习

### 练习 1：配置不同风格的窗口

**要求**：
1. 创建一个无边框透明窗口（frameless），显示一个带自定义关闭按钮的 UI
2. 创建一个带隐藏标题栏的窗口（macOS hiddenInset），内容延伸到标题栏区域
3. 创建一个置顶的迷你窗口（300×200），类似悬浮工具

**验收标准**：三种窗口都能正常显示，自定义关闭按钮可以关闭窗口。

### 练习 2：实现 ready-to-show 模式

**要求**：
1. 创建窗口时设置 `show: false`
2. 在 `ready-to-show` 事件中调用 `win.show()`
3. 观察应用启动时是否还有白屏闪烁

**验收标准**：应用启动时直接看到渲染好的页面，没有白屏过渡。

### 练习 3：实现"未保存提醒"

**要求**：
1. 在渲染进程中设置一个 `isDirty` 标记（输入框内容变化时设为 `true`）
2. 用户关闭窗口时，如果 `isDirty` 为 `true`，弹出确认对话框
3. 对话框提供三个选项：保存并关闭、不保存直接关闭、取消

**验收标准**：修改内容后点关闭会弹提醒，不修改直接关闭不会弹。

### 练习 4：webContents 实用方法

**要求**：
1. 在主进程中使用 `webContents.executeJavaScript()` 获取渲染进程中的 `document.title`
2. 使用 `webContents.capturePage()` 截取窗口截图并保存为 PNG
3. 使用 `webContents.printToPDF()` 导出页面为 PDF

**验收标准**：成功截取窗口截图并保存到 `app.getPath('desktop')` 目录。

---

## 📝 面试回答模板

> **问：BrowserWindow 的 webPreferences 中有哪些重要的安全配置？**
>
> 最关键的三个配置是 `contextIsolation`、`sandbox` 和 `nodeIntegration`。`contextIsolation`（默认 true）确保 preload 脚本和页面脚本的 JS 上下文隔离，页面无法直接访问 preload 的变量和函数，只能通过 `contextBridge` 暴露的 API。`sandbox`（默认 true）启用 Chromium 沙箱，限制渲染进程的系统调用能力。`nodeIntegration`（默认 false）控制渲染进程是否可以直接访问 Node.js API。生产环境中这三个配置都不应该修改默认值。

> **问：BrowserWindow 的生命周期事件有哪些？**
>
> 主要的生命周期事件按时间顺序是：`did-start-navigation`（开始导航）→ `dom-ready`（顶层 frame 文档加载完成，≈DOMContentLoaded）→ `did-finish-load`（导航完成且 onload 已触发）→ `ready-to-show`（首次渲染完成，适合显示窗口）→ 关闭阶段：`close`（可拦截，通过 `preventDefault()` 阻止关闭）→ `closed`（窗口已销毁，清理引用）。注意 `dom-ready` 先于 `did-finish-load`。最常用的是 `ready-to-show`——配合 `show: false` 实现无白屏启动，以及 `close`——实现"未保存提醒"功能。

> **问：contextIsolation 是做什么的？不开有什么风险？**
>
> `contextIsolation` 确保 preload 脚本和页面脚本运行在隔离的 JavaScript 上下文中。开启后，preload 中直接设置的 `window.xxx` 对页面不可见，必须通过 `contextBridge.exposeInMainWorld` 显式暴露。如果不开启（`contextIsolation: false`），preload 和页面共享同一个全局上下文——这意味着页面中的任何脚本（包括被 XSS 注入的恶意脚本）都可以访问 preload 中定义的所有变量和函数，大幅增加了攻击面。
