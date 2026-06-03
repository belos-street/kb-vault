# 03 — 进程间通信 IPC 机制深度解析

> 对应大纲：核心层 | 预计时间：1 天
> 面试可答：Electron 的 IPC 通信有两种模式——`invoke/handle` 用于请求-响应场景（渲染进程调用主进程并等待返回结果），`send/on` 用于单向推送场景（渲染进程发消息给主进程但不等返回）。所有通信都通过 preload 脚本中的 `contextBridge` 做安全封装，渲染进程不直接接触 `ipcRenderer`。

---

## 1. IPC 通信全景

在第 02 篇中我们已经知道：主进程和渲染进程是隔离的，不能直接互相调用方法或访问变量。IPC（Inter-Process Communication）是它们之间唯一的通信方式。

### 1.1 三个核心模块

| 模块 | 所在进程 | 作用 |
|------|---------|------|
| `ipcMain` | 主进程 | 监听和处理来自渲染进程的消息 |
| `ipcRenderer` | preload 脚本 | 发送消息给主进程，接收主进程的回复 |
| `contextBridge` | preload 脚本 | 将 `ipcRenderer` 的能力安全地暴露给渲染进程 |

```
渲染进程                 preload 脚本                主进程
  │                        │                          │
  │  window.electronAPI    │  ipcRenderer             │  ipcMain
  │  .doSomething()        │  .invoke('channel', arg) │  .handle('channel', handler)
  │ ─────────────────────→ │ ───────────────────────→ │
  │                        │                          │
  │  Promise<result>       │  Promise<result>         │  return result
  │ ←───────────────────── │ ←─────────────────────── │
```

### 1.2 两种通信模式

| 模式 | API | 方向 | 特点 | 适用场景 |
|------|-----|------|------|---------|
| **请求-响应** | `invoke` / `handle` | 渲染 → 主 → 渲染 | 异步，返回 Promise | 读文件、获取系统信息、数据库查询 |
| **单向推送** | `send` / `on` | 渲染 → 主（或主 → 渲染） | 异步，无返回值 | 通知事件、触发操作、状态同步 |

**一句话选型**：需要拿到结果 → `invoke/handle`；只通知不等结果 → `send/on`。

---

## 2. invoke / handle：请求-响应模式

这是 Electron 中最常用的 IPC 模式——渲染进程发起请求，主进程处理后返回结果。

### 2.1 基本用法

**主进程：注册处理器**

```typescript
// src/main.ts
import { ipcMain } from 'electron';

// 注册一个名为 'read-file' 的处理器
ipcMain.handle('read-file', async (_event, filePath: string) => {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
});
```

**preload：暴露安全方法**

```typescript
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
});
```

**渲染进程：调用**

```typescript
// 渲染进程中
const content = await window.electronAPI.readFile('/path/to/file.md');
console.log(content);
```

### 2.2 完整的请求-响应流程

```
时间线 →

渲染进程          preload           主进程
   │                │                │
   │ readFile(path)  │                │
   │ ─────────────→  │                │
   │                 │ invoke         │
   │                 │ ('read-file')  │
   │                 │ ─────────────→ │
   │                 │                │ handler 执行
   │                 │                │ fs.readFile()
   │                 │                │
   │                 │  return content │
   │                 │ ←───────────── │
   │  Promise resolve│                │
   │ ←─────────────  │                │
   │                 │                │
```

### 2.3 错误处理

`invoke/handle` 天然支持错误传播——主进程 handler 抛出的错误会变成渲染进程中 Promise 的 rejection：

**主进程**：

```typescript
ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const fs = await import('node:fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`文件读取失败: ${(err as Error).message}`);
  }
});
```

**渲染进程**：

```typescript
try {
  const content = await window.electronAPI.readFile('/not/exist.md');
} catch (err) {
  console.error(err.message); // "文件读取失败: ENOENT: no such file or directory"
}
```

> **注意**：主进程中 `throw new Error()` 的错误信息会通过 IPC 序列化传递到渲染进程。确保错误信息中不包含敏感路径或凭据。

### 2.4 传递复杂数据

`invoke/handle` 支持传递任何可序列化的数据（JSON 兼容类型）：

```typescript
// 主进程：返回复杂对象
ipcMain.handle('get-system-info', () => ({
  app: {
    name: app.getName(),
    version: app.getVersion(),
  },
  runtime: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  platform: process.platform,
  arch: process.arch,
  memory: {
    total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
    free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
  },
}));

// preload
getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

// 渲染进程
const info = await window.electronAPI.getSystemInfo();
console.log(info.runtime.electron); // "35.0.0"
```

---

## 3. send / on：单向推送模式

当你只需要"通知"而不需要"返回结果"时，使用 `send/on`。

### 3.1 渲染进程 → 主进程

**主进程：监听消息**

```typescript
// src/main.ts
import { ipcMain, Notification } from 'electron';

ipcMain.on('show-notification', (_event, title: string, body: string) => {
  new Notification({ title, body }).show();
});
```

**preload：暴露发送方法**

```typescript
// src/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title: string, body: string) =>
    ipcRenderer.send('show-notification', title, body),
});
```

**渲染进程：发送**

```typescript
window.electronAPI.showNotification('提醒', '文件保存成功');
// 不返回 Promise，发送即完成
```

### 3.2 主进程 → 渲染进程

主进程也可以主动向渲染进程推送消息。这在菜单操作、托盘事件等场景中非常常见。

**主进程：发送消息**

```typescript
// src/main.ts
import { BrowserWindow, Menu } from 'electron';

function createMenu(mainWindow: BrowserWindow) {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 主进程 → 渲染进程：通知"新建文件"
            mainWindow.webContents.send('menu-action', 'new-file');
          },
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save-file');
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
```

**preload：监听主进程消息**

```typescript
// src/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },
  // 提供移除监听器的方法（防止内存泄漏）
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
});
```

**渲染进程：接收消息**

```typescript
// 注册监听器
window.electronAPI.onMenuAction((action) => {
  switch (action) {
    case 'new-file':
      createNewDocument();
      break;
    case 'save-file':
      saveCurrentDocument();
      break;
  }
});

// 页面卸载时清理监听器（防止内存泄漏）
window.addEventListener('beforeunload', () => {
  window.electronAPI.removeMenuActionListener();
});
```

### 3.3 监听器清理：为什么重要？

每次调用 `ipcRenderer.on()` 都会注册一个新的监听器。如果不清理，反复注册会导致监听器堆积：

```typescript
// ❌ 错误：每次组件挂载都注册新监听器，从不清理
useEffect(() => {
  window.electronAPI.onMenuAction((action) => {
    // 这个回调会被注册多次
  });
}, []);

// ✅ 正确：注册时返回清理函数
useEffect(() => {
  window.electronAPI.onMenuAction((action) => {
    handleAction(action);
  });
  return () => {
    window.electronAPI.removeMenuActionListener();
  };
}, []);
```

---

## 4. invoke/handle vs send/on 完整对比

| 维度 | `invoke` / `handle` | `send` / `on` |
|------|-------------------|---------------|
| **返回值** | 返回 `Promise`，可 `await` | 无返回值（`void`） |
| **错误传播** | 主进程 `throw` → 渲染进程 `catch` | 不传播，需手动处理 |
| **调用频率** | 每次调用对应一次处理 | 可多次 `send`，监听器持续接收 |
| **双向通信** | 天然双向（请求 + 响应） | 单向（需配合反向 `send` 才能双向） |
| **适用场景** | 读文件、查数据库、获取系统信息 | 触发通知、菜单事件、状态同步 |
| **主进程 API** | `ipcMain.handle(channel, handler)` | `ipcMain.on(channel, handler)` |
| **preload API** | `ipcRenderer.invoke(channel, ...args)` | `ipcRenderer.send(channel, ...args)` |

**选型决策树**：

```
你需要从主进程拿到返回数据吗？
├── 需要（如文件内容、系统信息、数据库查询结果）
│   └── 用 invoke / handle
└── 不需要（如触发通知、发送事件、通知状态变化）
    └── 用 send / on
```

---

## 5. 渲染进程 → 主进程 → 渲染进程：完整链路

在实际应用中，经常需要渲染进程 A 通过主进程转发消息给渲染进程 B。这是多窗口通信的基础。

### 5.1 场景：设置窗口通知主窗口切换主题

```
渲染进程 B（设置窗口）     主进程              渲染进程 A（主窗口）
      │                    │                      │
      │ invoke             │                      │
      │ ('set-theme',      │                      │
      │  'dark')           │                      │
      │ ─────────────────→ │                      │
      │                    │  保存主题设置         │
      │                    │  send                 │
      │                    │  ('theme-changed',    │
      │                    │   'dark')             │
      │                    │ ────────────────────→ │
      │                    │                      │  切换 CSS 主题
      │  return success    │                      │
      │ ←──────────────── │                      │
```

### 5.2 主进程代码

```typescript
// src/main.ts
import { ipcMain, BrowserWindow } from 'electron';

let currentTheme = 'light';

// 设置窗口通过 invoke 修改主题
ipcMain.handle('set-theme', (_event, theme: string) => {
  currentTheme = theme;

  // 主进程通知所有窗口主题变化
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('theme-changed', currentTheme);
  });

  return { success: true, theme: currentTheme };
});

// 获取当前主题
ipcMain.handle('get-theme', () => currentTheme);
```

### 5.3 preload 代码

```typescript
// src/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (_event, theme) => callback(theme));
  },
});
```

### 5.4 渲染进程代码

```typescript
// 主窗口：监听主题变化
window.electronAPI.onThemeChanged((theme) => {
  document.documentElement.setAttribute('data-theme', theme);
});

// 设置窗口：切换主题
document.getElementById('dark-btn')?.addEventListener('click', async () => {
  const result = await window.electronAPI.setTheme('dark');
  console.log('主题已切换:', result.theme);
});
```

---

## 6. Channel 命名规范

IPC 通信中的 channel 名称就像 API 的 URL——好的命名让代码可维护、可调试。

### 6.1 推荐命名规范

```
{模块}:{操作}

示例：
file:read           文件读取
file:save           文件保存
file:delete         文件删除
dialog:open-file    打开文件对话框
dialog:save-file    保存文件对话框
app:get-info        获取应用信息
app:quit            退出应用
theme:set           设置主题
theme:get           获取主题
menu:action         菜单操作
```

### 6.2 常见反模式

```typescript
// ❌ 命名模糊：不知道是做什么的
ipcMain.handle('doStuff', handler)
ipcMain.handle('data', handler)
ipcMain.handle('handle', handler)

// ❌ 命名冲突：不同模块用了相同的 channel
ipcMain.handle('get', handler)    // 获取什么？
ipcMain.handle('save', handler)   // 保存什么？

// ✅ 命名清晰：一看就知道用途
ipcMain.handle('file:read', handler)
ipcMain.handle('file:save', handler)
ipcMain.handle('settings:get', handler)
```

---

## 7. TypeScript 类型安全封装

在大型项目中，手动维护 channel 名称和参数类型容易出错。可以用 TypeScript 做类型安全的 IPC 封装。

### 7.1 定义 IPC 协议

```typescript
// src/shared/ipc-channels.ts

// 定义所有 IPC channel 及其参数和返回值类型
export interface IPCChannelMap {
  // invoke / handle 模式
  'file:read': {
    params: [filePath: string];
    result: string;
  };
  'file:save': {
    params: [filePath: string, content: string];
    result: void;
  };
  'app:get-info': {
    params: [];
    result: {
      name: string;
      version: string;
      electronVersion: string;
    };
  };

  // send / on 模式（只有 params，没有 result）
  'menu:action': {
    params: [action: string];
  };
  'theme:changed': {
    params: [theme: string];
  };
}
```

### 7.2 类型安全的 preload

```typescript
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannelMap } from '../shared/ipc-channels';

// 类型安全的 invoke 包装
function typedInvoke<K extends keyof IPCChannelMap>(
  channel: K,
  ...args: IPCChannelMap[K]['params']
): Promise<IPCChannelMap[K] extends { result: infer R } ? R : never> {
  return ipcRenderer.invoke(channel, ...args);
}

// 类型安全的 send 包装
function typedSend<K extends keyof IPCChannelMap>(
  channel: K,
  ...args: IPCChannelMap[K]['params']
): void {
  ipcRenderer.send(channel, ...args);
}

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath: string) => typedInvoke('file:read', filePath),
  saveFile: (filePath: string, content: string) =>
    typedInvoke('file:save', filePath, content),
  getAppInfo: () => typedInvoke('app:get-info'),
  sendMenuAction: (action: string) => typedSend('menu:action', action),
});
```

### 7.3 类型安全的主进程

```typescript
// src/main.ts
import { ipcMain } from 'electron';
import type { IPCChannelMap } from '../shared/ipc-channels';

// 类型安全的 handle 包装
function typedHandle<K extends keyof IPCChannelMap>(
  channel: K,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    ...args: IPCChannelMap[K]['params']
  ) => IPCChannelMap[K] extends { result: infer R } ? R | Promise<R> : never
): void {
  ipcMain.handle(channel, handler);
}

// 使用：TypeScript 会自动检查参数和返回值类型
typedHandle('file:read', async (_event, filePath) => {
  // filePath 自动推断为 string
  const fs = await import('node:fs/promises');
  return await fs.readFile(filePath, 'utf-8');
  // 返回值自动检查为 string
});

typedHandle('file:save', async (_event, filePath, content) => {
  // filePath: string, content: string
  const fs = await import('node:fs/promises');
  await fs.writeFile(filePath, content, 'utf-8');
});

typedHandle('app:get-info', () => ({
  name: app.getName(),
  version: app.getVersion(),
  electronVersion: process.versions.electron,
}));
```

---

## 8. 常见通信模式汇总

### 8.1 文件读写

```typescript
// 主进程
ipcMain.handle('file:read', async (_event, filePath: string) => {
  return await fs.promises.readFile(filePath, 'utf-8');
});

ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
  await fs.promises.writeFile(filePath, content, 'utf-8');
});
```

### 8.2 系统对话框

```typescript
// 主进程
ipcMain.handle('dialog:open-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });
  if (result.canceled) return null;
  const content = await fs.promises.readFile(result.filePaths[0], 'utf-8');
  return { filePath: result.filePaths[0], content };
});
```

### 8.3 数据库查询

```typescript
// 主进程
import Database from 'better-sqlite3';
const db = new Database(path.join(app.getPath('userData'), 'data.db'));

ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) => {
  return db.prepare(sql).all(...(params ?? []));
});

ipcMain.handle('db:execute', (_event, sql: string, params?: unknown[]) => {
  return db.prepare(sql).run(...(params ?? []));
});
```

### 8.4 子进程调用

```typescript
// 主进程
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

ipcMain.handle('shell:exec', async (_event, command: string, args: string[]) => {
  // ⚠️ 安全警告：永远不要直接将用户输入拼接到命令中
  // 这里应该用白名单校验 command 和 args
  const { stdout, stderr } = await execFileAsync(command, args);
  return { stdout, stderr };
});
```

---

## ✏️ 练习

### 练习 1：实现 invoke/handle 通信

**要求**：
1. 在主进程中注册一个 `app:get-info` 处理器，返回应用名称、版本、Electron 版本、Node 版本、Chrome 版本
2. 在 preload 中暴露 `getAppInfo` 方法
3. 在渲染进程中调用并显示这些信息

**验收标准**：渲染进程中显示类似 "Electron 35.0.0 / Node 20.18.0 / Chrome 130.0.0" 的信息。

### 练习 2：实现 send/on 双向通信

**要求**：
1. 在主进程中监听 `show-notification` 消息，收到后弹出系统通知
2. 在 preload 中暴露 `showNotification(title, body)` 方法
3. 在渲染进程中添加一个按钮，点击后触发系统通知

**验收标准**：点击按钮后，操作系统弹出通知气泡。

### 练习 3：实现完整的文件读写

**要求**：
1. 主进程实现 `file:read` 和 `file:save` 两个处理器
2. preload 暴露 `readFile` 和 `saveFile` 方法
3. 渲染进程实现一个简易编辑器：输入框 + 保存按钮 + 读取按钮
4. 保存到 `app.getPath('userData')` 目录下的 `note.md`

**验收标准**：输入文字 → 点保存 → 关闭重开应用 → 点读取 → 之前的内容还在。

### 练习 4：Channel 命名练习

**要求**：
1. 为你未来的笔记编辑器应用设计一套 IPC Channel 命名（至少 10 个）
2. 用 `{模块}:{操作}` 的格式
3. 标注每个 channel 是用 `invoke/handle` 还是 `send/on`

**验收标准**：channel 命名没有歧义，一看就知道用途和通信方向。

---

## 📝 面试回答模板

> **问：Electron 的 IPC 通信机制是怎样的？**
>
> Electron 的 IPC 通信围绕三个核心模块：`ipcMain`（主进程端）、`ipcRenderer`（preload 端）、`contextBridge`（安全封装层）。有两种通信模式：`invoke/handle` 是请求-响应模式，渲染进程发起请求，主进程处理后返回结果，返回 Promise 可以 await，适合读文件、查数据库等需要拿到返回值的场景。`send/on` 是单向推送模式，发送方不等返回值，适合触发通知、菜单事件等场景。所有通信都通过 preload 脚本中的 `contextBridge` 做安全封装，渲染进程不直接接触 `ipcRenderer`。

> **问：invoke/handle 和 send/on 怎么选？**
>
> 核心区别是"是否需要返回数据"。`invoke/handle` 返回 Promise，天然支持错误传播——主进程 throw 的错误会变成渲染进程的 catch。适合读写文件、数据库查询、获取系统信息等需要拿到结果的场景。`send/on` 是单向推送，没有返回值，适合通知类场景，比如菜单点击事件、托盘操作、状态同步。一句话：需要结果用 invoke，只通知用 send。

> **问：Electron 的 IPC 如何保证安全？**
>
> 通过 preload 脚本 + contextBridge 两层保障。preload 脚本运行在渲染进程中，拥有部分 Node.js 能力，但它不直接暴露给渲染进程——而是通过 `contextBridge.exposeInMainWorld` 把精心筛选的方法挂载到 `window.electronAPI` 上。渲染进程只能调用这些预定义的方法，不能直接访问 `ipcRenderer`。这样即使有 XSS，攻击者也只能调用有限的 API，而不能发送任意 IPC 消息。
