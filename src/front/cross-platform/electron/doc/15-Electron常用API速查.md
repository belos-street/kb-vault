# 15 — Electron 常用 API 速查

> 对应大纲：速查参考 | 预计时间：随用随查
> 面试可答：Electron 内置 API 按进程分为三类：主进程 API（app、BrowserWindow、ipcMain、dialog、Menu、Tray、shell、globalShortcut、protocol、session、powerMonitor、systemPreferences、screen）、渲染进程 API（ipcRenderer）、通用 API（nativeImage、Notification、shell、clipboard）。主进程 API 控制应用生命周期和系统能力，渲染进程 API 负责 IPC 通信，通用 API 在两个进程中都能使用（例外：screen 是主进程模块；clipboard 的渲染进程用法自 Electron 40 起已弃用，将在后续版本移除）。

> 本篇是速查参考，不按"认知→核心→安全"递进，而是按模块分类，方便开发中随时查阅。

---

## 1. app — 应用生命周期

控制应用的启动、退出和全局行为。**仅主进程**。

### 1.1 常用属性

```typescript
import { app } from 'electron';

app.getVersion()           // 应用版本号（来自 package.json）
app.getName()              // 应用名称
app.isPackaged             // 是否已打包（布尔值）
app.isReady()              // 应用是否已就绪（返回 boolean）
app.whenReady()            // 返回 Promise，应用就绪后 resolve
app.getAppPath()           // 应用根目录路径
app.getPath('userData')    // 用户数据目录
app.setPath('userData', newPath)  // 自定义用户数据目录
```

### 1.2 getPath 常用路径

| 名称 | macOS | Windows | 用途 |
|------|-------|---------|------|
| `home` | `/Users/user` | `C:\Users\user` | 用户主目录 |
| `appData` | `~/Library/Application Support` | `%APPDATA%` | 应用数据根目录 |
| `userData` | `~/Library/Application Support/{app}` | `%APPDATA%\{app}` | 当前应用数据目录 |
| `temp` | `/tmp` | `%TEMP%` | 临时目录 |
| `desktop` | `~/Desktop` | `C:\Users\user\Desktop` | 桌面 |
| `documents` | `~/Documents` | `C:\Users\user\Documents` | 文档目录 |
| `downloads` | `~/Downloads` | `C:\Users\user\Downloads` | 下载目录 |
| `logs` | `~/Library/Logs/{app}` | `%APPDATA%\{app}\logs` | 日志目录 |
| `crashDumps` | `~/Library/Logs/DiagnosticReports` | `%LOCALAPPDATA%\{app}\CrashDumps` | 崩溃报告目录 |

### 1.3 生命周期事件

```typescript
// 应用就绪（所有初始化完成后触发）
app.whenReady().then(() => {
  createWindow();
});

// 所有窗口关闭后
app.on('window-all-closed', () => {
  // macOS 关闭窗口不退出应用
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用激活（macOS 点击 Dock 图标）
app.on('activate', () => {
  // macOS 重新创建窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用退出前（可阻止退出）
app.on('before-quit', (event) => {
  event.preventDefault(); // 阻止退出
});

// 应用即将退出（不可阻止）
app.on('will-quit', () => {
  // 清理资源
});

// 第二个实例启动时（单实例锁）
app.on('second-instance', (_event, commandLine, workingDirectory) => {
  // 将已有窗口激活
  mainWindow?.focus();
});
```

### 1.4 常用方法

```typescript
// 退出应用
app.quit();

// 重启应用
app.relaunch();
app.quit();

// 单实例锁（防止多开）
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// 设置应用用户模型 ID（Windows 任务栏分组）
app.setAppUserModelId('com.yourcompany.myapp');

// 禁用硬件加速（解决某些 GPU 兼容问题）
app.disableHardwareAcceleration();

// 设置 Dock 角标数字（macOS）
app.dock.setBadge('3');

// 隐藏菜单栏（Windows/Linux）
app.setMenu(null);

// 退出后清除最近文档（macOS）
app.clearRecentDocuments();

// 添加到最近文档（macOS/Windows）
app.addRecentDocument('/path/to/file.txt');

// 设置默认协议（注册 deep link）
app.setAsDefaultProtocolClient('myapp');
```

---

## 2. BrowserWindow — 窗口

创建和管理应用窗口。**仅主进程**。

### 2.1 创建窗口

```typescript
import { BrowserWindow } from 'electron';

const win = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  title: 'My App',
  show: false,               // 延迟显示，等 ready-to-show
  backgroundColor: '#1e1e1e',
  titleBarStyle: 'hiddenInset',  // macOS 隐藏标题栏
  frame: false,              // 无边框窗口
  transparent: true,         // 透明窗口
  alwaysOnTop: false,
  fullscreenable: true,
  resizable: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});

// 加载页面
win.loadFile('index.html');
win.loadURL('http://localhost:5173');
```

### 2.2 窗口事件

```typescript
// 窗口准备好显示（推荐在此调用 show）
win.on('ready-to-show', () => {
  win.show();
});

// 窗口关闭前（可阻止关闭）
win.on('close', (event) => {
  event.preventDefault();
  // 弹确认对话框后 win.destroy()
});

// 窗口已关闭（DOM 已销毁）
win.on('closed', () => {
  // 清除引用
});

// 窗口获得/失去焦点
win.on('focus', () => {});
win.on('blur', () => {});

// 窗口最大化/最小化
win.on('maximize', () => {});
win.on('minimize', () => {});

// 进入/退出全屏
win.on('enter-full-screen', () => {});
win.on('leave-full-screen', () => {});
```

### 2.3 常用方法

```typescript
win.show();                  // 显示窗口
win.hide();                  // 隐藏窗口
win.close();                 // 关闭窗口
win.destroy();               // 强制关闭（不触发 close 事件）
win.focus();                 // 聚焦窗口
win.minimize();              // 最小化
win.maximize();              // 最大化
win.unmaximize();            // 取消最大化
win.isMaximized();           // 是否最大化
win.isMinimized();           // 是否最小化
win.isVisible();             // 是否可见
win.isFocused();             // 是否聚焦
win.setFullScreen(true);     // 设置全屏
win.setAlwaysOnTop(true);    // 置顶
win.setPosition(x, y);      // 设置位置
win.getPosition();           // 获取位置 [x, y]
win.setSize(width, height); // 设置尺寸
win.getSize();               // 获取尺寸 [width, height]
win.setContentSize(w, h);   // 设置内容区尺寸
win.setResizable(true);      // 设置是否可调整大小
win.setTitle('New Title');   // 设置标题
win.setOpacity(0.8);         // 设置透明度（0~1）
win.setIcon(nativeImage);    // 设置图标
win.flashFrame(true);        // 任务栏闪烁
win.setProgressBar(0.5);     // 任务栏进度条
win.setSkipTaskbar(true);    // 从任务栏隐藏
win.center();                // 居中显示
win.webContents;             // 获取 webContents 实例
```

### 2.4 阻止渲染进程导航与新窗口

```typescript
// 阻止渲染进程导航到外部 URL
win.webContents.on('will-navigate', (event, url) => {
  if (!url.startsWith('http://localhost')) {
    event.preventDefault();
  }
});

// 阻止新窗口，改用默认浏览器打开
win.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url);
  return { action: 'deny' };
});
```

---

## 3. webContents — 页面内容控制

控制渲染进程中的页面内容。**仅主进程**（通过 `win.webContents` 访问）。

### 3.1 页面操作

```typescript
const wc = win.webContents;

wc.reload();                     // 刷新页面
wc.reloadIgnoringCache();        // 忽略缓存刷新
wc.goBack();                     // 后退
wc.goForward();                  // 前进
wc.stop();                       // 停止加载
wc.isLoading();                  // 是否正在加载
wc.getURL();                     // 获取当前 URL
wc.getTitle();                   // 获取页面标题

// 执行 JavaScript（在渲染进程中执行）
const result = await wc.executeJavaScript('document.title');

// 插入 CSS
await wc.insertCSS('body { background: red; }');

// 打印
wc.print();                      // 打印对话框
await wc.printToPDF({});         // 导出 PDF
```

### 3.2 DevTools

```typescript
wc.openDevTools({ mode: 'right' });   // 打开 DevTools
wc.closeDevTools();                    // 关闭 DevTools
wc.isDevToolsOpened();                 // 是否已打开
wc.toggleDevTools();                   // 切换打开/关闭
```

### 3.3 发送消息到渲染进程

```typescript
// 主进程 → 渲染进程
wc.send('channel-name', data1, data2);

// 渲染进程接收
// window.electronAPI.onChannelName((data1, data2) => { ... });
```

### 3.4 事件

```typescript
// 页面 DOM 加载完成
wc.on('dom-ready', () => {});

// 页面标题变化
wc.on('page-title-updated', (event, title) => {
  event.preventDefault();  // 阻止自动更新标题
  win.setTitle(title);
});

// 新窗口被打开
wc.on('did-create-window', (childWindow) => {});

// 渲染进程崩溃
wc.on('render-process-gone', (event, details) => {
  console.error('渲染进程崩溃:', details.reason);
});

// 未响应（渲染进程卡死）
wc.on('unresponsive', () => {});
wc.on('responsive', () => {});

// 控制台消息
wc.on('console-message', (_event, level, message) => {
  console.log(`[Renderer] ${message}`);
});
```

### 3.5 权限与安全

```typescript
// 处理权限请求（如通知、位置）
wc.session.setPermissionRequestHandler((webContents, permission, callback) => {
  const allowedPermissions = ['notifications'];
  callback(allowedPermissions.includes(permission));
});

// 处理证书验证
wc.on('certificate-error', (event, url, error, cert, callback) => {
  // 开发环境跳过证书验证
  if (url.startsWith('https://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
```

---

## 4. ipcMain / ipcRenderer — 进程间通信

双向通信桥梁。**ipcMain 在主进程，ipcRenderer 在 preload 中使用**。

### 4.1 请求-响应模式（推荐）

```typescript
// 主进程
import { ipcMain } from 'electron';

ipcMain.handle('get-data', async (_event, id: string) => {
  return await fetchDataFromDB(id);
});

ipcMain.handle('save-file', async (_event, filePath: string, content: string) => {
  await fs.promises.writeFile(filePath, content);
  return { success: true };
});

// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getData: (id: string) => ipcRenderer.invoke('get-data', id),
  saveFile: (path: string, content: string) => ipcRenderer.invoke('save-file', path, content),
});
```

### 4.2 单向推送模式

```typescript
// 主进程 → 渲染进程
win.webContents.send('update-progress', { percent: 75 });
win.webContents.send('menu-clicked', 'new-file');

// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('update-progress', (_event, data) => callback(data));
  },
  // 清理监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
```

### 4.3 渲染进程 → 主进程（单向通知）

```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  logError: (error: string) => ipcRenderer.send('renderer-error', error),
});

// 主进程
ipcMain.on('renderer-error', (_event, error) => {
  console.error('渲染进程错误:', error);
});
```

### 4.4 方法对比

| 方法 | 方向 | 返回值 | 用途 |
|------|------|--------|------|
| `ipcMain.handle` + `ipcRenderer.invoke` | 渲染 → 主 | Promise | 请求-响应（推荐） |
| `ipcRenderer.send` + `ipcMain.on` | 渲染 → 主 | 无 | 单向通知 |
| `webContents.send` + `ipcRenderer.on` | 主 → 渲染 | 无 | 主进程推送 |
| `ipcMain.handleOnce` | 渲染 → 主 | Promise | 一次性 handler |

---

## 5. dialog — 系统对话框

操作系统原生对话框。**仅主进程**。

### 5.1 打开文件

```typescript
import { dialog } from 'electron';

// 打开文件选择对话框
const result = await dialog.showOpenDialog(win, {
  title: '选择文件',
  defaultPath: app.getPath('documents'),
  buttonLabel: '选择',
  filters: [
    { name: '文本文件', extensions: ['txt', 'md'] },
    { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif'] },
    { name: '所有文件', extensions: ['*'] },
  ],
  properties: ['openFile', 'multiSelections', 'showHiddenFiles'],
});

if (!result.canceled) {
  console.log('选中的文件:', result.filePaths);
}
```

### 5.2 保存文件

```typescript
const result = await dialog.showSaveDialog(win, {
  title: '保存文件',
  defaultPath: path.join(app.getPath('documents'), 'untitled.txt'),
  filters: [
    { name: '文本文件', extensions: ['txt'] },
  ],
});

if (!result.canceled) {
  console.log('保存路径:', result.filePath);
}
```

### 5.3 消息框

```typescript
const result = await dialog.showMessageBox(win, {
  type: 'question',        // 'none' | 'info' | 'error' | 'question' | 'warning'
  title: '确认',
  message: '是否保存当前文件？',
  detail: '未保存的更改将丢失。',
  buttons: ['保存', '不保存', '取消'],
  defaultId: 0,
  cancelId: 2,
  noLink: true,            // 不将按钮渲染为链接
});

// result.response: 0=保存, 1=不保存, 2=取消
```

### 5.4 错误框（同步）

```typescript
// 同步阻塞，适合应用启动失败时使用
dialog.showErrorBox('启动失败', '无法加载配置文件');
```

### 5.5 properties 速查

| 值 | 说明 |
|----|------|
| `openFile` | 允许选择文件 |
| `openDirectory` | 允许选择目录 |
| `multiSelections` | 允许多选 |
| `showHiddenFiles` | 显示隐藏文件 |
| `createDirectory` | macOS：允许创建目录 |
| `promptToCreate` | Windows：提示创建不存在的文件 |
| `noResolveAliases` | macOS：不解析别名 |
| `treatPackageAsDirectory` | macOS：将 .app 包视为目录 |

---

## 6. Menu / MenuItem — 菜单

创建应用菜单和上下文菜单。**仅主进程**。

### 6.1 应用菜单

```typescript
import { Menu } from 'electron';

const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: '文件',
    submenu: [
      { label: '新建', accelerator: 'CmdOrCtrl+N', click: () => createNewFile() },
      { label: '打开', accelerator: 'CmdOrCtrl+O', click: () => openFile() },
      { type: 'separator' },
      { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => saveFile() },
      { role: 'quit' },  // 内置角色
    ],
  },
  {
    label: '编辑',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  },
  {
    label: '视图',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

### 6.2 上下文菜单

```typescript
import { Menu } from 'electron';

win.webContents.on('context-menu', (_event, params) => {
  const template: Electron.MenuItemConstructorOptions[] = [];

  if (params.selectionText) {
    template.push({ role: 'copy' });
  }

  if (params.isEditable) {
    template.push({ role: 'paste' });
  }

  if (params.linkURL) {
    template.push({
      label: '在浏览器中打开',
      click: () => shell.openExternal(params.linkURL),
    });
  }

  if (template.length > 0) {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: win });
  }
});
```

### 6.3 常用 role 速查

| role | 说明 | 快捷键 |
|------|------|--------|
| `undo` | 撤销 | Cmd/Ctrl+Z |
| `redo` | 重做 | Cmd+Shift+Z / Ctrl+Y |
| `cut` | 剪切 | Cmd/Ctrl+X |
| `copy` | 复制 | Cmd/Ctrl+C |
| `paste` | 粘贴 | Cmd/Ctrl+V |
| `selectAll` | 全选 | Cmd/Ctrl+A |
| `delete` | 删除 | - |
| `quit` | 退出应用 | Cmd+Q（macOS） |
| `reload` | 刷新 | Cmd/Ctrl+R |
| `forceReload` | 强制刷新 | Cmd+Shift+R / Ctrl+Shift+R |
| `toggleDevTools` | 切换 DevTools | Cmd+Option+I / Ctrl+Shift+I |
| `togglefullscreen` | 切换全屏 | Ctrl+Cmd+F / F11 |
| `zoomIn` | 放大 | Cmd/Ctrl+= |
| `zoomOut` | 缩小 | Cmd/Ctrl+- |
| `resetZoom` | 重置缩放 | Cmd/Ctrl+0 |
| `minimize` | 最小化窗口 | Cmd+M / Win+M |
| `close` | 关闭窗口 | Cmd+W / Ctrl+W |

---

## 7. Tray — 系统托盘

在系统托盘区域显示图标。**仅主进程**。

```typescript
import { Tray, Menu, nativeImage } from 'electron';

// 创建托盘图标（macOS 推荐 22x22，Windows 推荐 16x16 或 32x32）
const icon = nativeImage.createFromPath(path.join(__dirname, 'tray-icon.png'));
const tray = new Tray(icon);

// macOS：设置模板图像（自动适配深色/浅色菜单栏）
tray.setImage(nativeImage.createFromPath('trayTemplate.png'));
// 或
const icon = nativeImage.createFromPath('tray-icon.png');
icon.setTemplateImage(true);
tray.setImage(icon);

// 设置提示文字
tray.setToolTip('My App');

// 设置上下文菜单
const contextMenu = Menu.buildFromTemplate([
  { label: '打开主窗口', click: () => mainWindow?.show() },
  { type: 'separator' },
  { label: '退出', click: () => app.quit() },
]);
tray.setContextMenu(contextMenu);

// 点击托盘图标
tray.on('click', () => {
  mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
});

// 双击（Windows）
tray.on('double-click', () => {
  mainWindow?.show();
});

// 更新图标（如不同状态）
tray.setImage(nativeImage.createFromPath('tray-icon-active.png'));

// 销毁托盘
tray.destroy();
```

---

## 8. shell — 系统能力

调用系统默认行为。**主进程和渲染进程都可用**（通过 preload 暴露更安全）。

```typescript
import { shell } from 'electron';

// 用默认浏览器打开 URL
await shell.openExternal('https://electronjs.org');

// 在文件管理器中显示文件
shell.showItemInFolder('/path/to/file.txt');

// 用默认应用打开文件
await shell.openPath('/path/to/document.pdf');

// 移动到回收站
await shell.trashItem('/path/to/file.txt');

// 读取快捷方式信息（Windows）
const shortcutDetails = await shell.readShortcutLink('C:\\path\\to\\shortcut.lnk');
```

---

## 9. clipboard — 剪贴板

读写系统剪贴板。**主进程可用**；渲染进程仅支持非沙箱页面，且自 Electron 40 起已弃用（官方计划在后续版本移除）。

> 渲染进程操作剪贴板的推荐做法：使用浏览器标准的 `navigator.clipboard` API，或在 preload 中通过 contextBridge 暴露 clipboard 方法。

```typescript
import { clipboard } from 'electron';

// 读写文本
clipboard.writeText('Hello');
const text = clipboard.readText();

// 读写 HTML
clipboard.writeHTML('<b>Bold</b>');
const html = clipboard.readHTML();

// 读写图片
const image = nativeImage.createFromPath('screenshot.png');
clipboard.writeImage(image);
const img = clipboard.readImage();

// 读写 RTF
clipboard.writeRTF('{\\rtf1 Hello}');
const rtf = clipboard.readRTF();

// 清空剪贴板
clipboard.clear();

// 检查剪贴板内容
clipboard.availableFormats();  // ['text/plain', 'text/html', ...]
clipboard.has('text/plain');   // true/false（Experimental API）

// 命名剪贴板（自定义格式，仅 macOS）
clipboard.writeBookmark('Electron', 'https://electronjs.org');
```

---

## 10. globalShortcut — 全局快捷键

注册系统级快捷键（即使应用不在前台也能响应）。**仅主进程**。

```typescript
import { globalShortcut } from 'electron';

// 注册快捷键
const registered = globalShortcut.register('CommandOrControl+Shift+X', () => {
  console.log('全局快捷键触发');
});

if (!registered) {
  console.warn('快捷键注册失败（可能被其他应用占用）');
}

// 检查是否已注册
globalShortcut.isRegistered('CommandOrControl+Shift+X'); // true/false

// 注销单个快捷键
globalShortcut.unregister('CommandOrControl+Shift+X');

// 注销所有快捷键（应用退出时必须调用）
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

### 10.1 Accelerator 格式速查

| 按键 | 写法 |
|------|------|
| Ctrl（Win/Linux）/ Cmd（macOS） | `CommandOrControl` 或 `CmdOrCtrl` |
| Shift | `Shift` |
| Alt | `Alt` |
| Super/Win 键 | `Super` |
| 字母 | `A` ~ `Z` |
| 数字 | `0` ~ `9` |
| 功能键 | `F1` ~ `F24` |
| 方向键 | `Up` / `Down` / `Left` / `Right` |
| 空格 | `Space` |
| Tab | `Tab` |
| 组合示例 | `CmdOrCtrl+Shift+S`、`Alt+Shift+R` |

---

## 11. nativeImage — 图片处理

创建和处理图标、托盘图像等。**主进程和渲染进程都可用**。

```typescript
import { nativeImage } from 'electron';

// 从文件路径创建
const img1 = nativeImage.createFromPath('/path/to/icon.png');

// 从 Data URL 创建
const img2 = nativeImage.createFromDataURL('data:image/png;base64,iVBOR...');

// 从 Buffer 创建
const img3 = nativeImage.createFromBuffer(buffer, { width: 64, height: 64 });

// 调整大小
const resized = img.resize({ width: 16, height: 16 });

// 裁剪
const cropped = img.crop({ x: 0, y: 0, width: 100, height: 100 });

// 获取尺寸
img.getSize();  // { width: 256, height: 256 }

// 转为 Data URL
const dataUrl = img.toDataURL();

// 转为 PNG Buffer
const pngBuffer = img.toPNG();

// 转为 JPEG Buffer（可指定质量 0-100）
const jpegBuffer = img.toJPEG(80);

// 是否为空
img.isEmpty();

// macOS：模板图像（自动适配深色/浅色）
img.setTemplateImage(true);
img.isTemplateImage();
```

---

## 12. screen — 屏幕信息

获取显示器信息和光标位置。**仅主进程**。

```typescript
import { screen } from 'electron';

// 获取主显示器
const primary = screen.getPrimaryDisplay();
console.log(primary.size);          // { width: 2560, height: 1440 }
console.log(primary.scaleFactor);   // 2（Retina）
console.log(primary.workAreaSize);  // 除去任务栏/菜单栏的可用区域

// 获取所有显示器
const displays = screen.getAllDisplays();

// 获取光标位置
const cursor = screen.getCursorScreenPoint();
console.log(cursor);  // { x: 100, y: 200 }

// 获取光标所在的显示器
const display = screen.getDisplayNearestPoint(cursor);

// 获取包含指定点的显示器
const display = screen.getDisplayMatching({ x: 0, y: 0, width: 800, height: 600 });

// 监听显示器变化
screen.on('display-added', (_event, newDisplay) => {});
screen.on('display-removed', (_event, oldDisplay) => {});
screen.on('display-metrics-changed', (_event, display, changedMetrics) => {});
```

---

## 13. Notification — 通知

发送系统通知。**主进程和渲染进程都可用**。

```typescript
import { Notification } from 'electron';

// 简单通知
const notification = new Notification({
  title: '更新完成',
  body: '新版本 v2.0.0 已安装成功。',
  silent: false,  // 是否静音
});

notification.show();

// 点击事件
notification.on('click', () => {
  mainWindow?.show();
});

notification.on('close', () => {
  console.log('通知已关闭');
});

// 检查是否支持通知
if (Notification.isSupported()) {
  // 发送通知
}

// 带图标的通知
const notification = new Notification({
  title: '新消息',
  body: '您有一条新消息',
  icon: nativeImage.createFromPath('icon.png'),
  hasReply: true,      // macOS：支持快速回复
  replyPlaceholder: '回复...',
  actions: [           // macOS：通知操作按钮
    { type: 'button', text: '查看' },
    { type: 'button', text: '忽略' },
  ],
});
```

---

## 14. systemPreferences — 系统偏好

获取系统外观和偏好设置。**仅主进程**。

```typescript
import { systemPreferences } from 'electron';

// 深色模式
systemPreferences.isDarkMode();             // true/false
systemPreferences.getEffectiveAppearance(); // 'dark' | 'light' | 'no-preference'

// 监听外观变化
systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
  const isDark = systemPreferences.isDarkMode();
  win.webContents.send('theme-changed', isDark);
});

// 系统强调色（Windows）
systemPreferences.getAccentColor();  // 'FF6600'

// 是否减少动画
systemPreferences.isReducedMotionEnabled();

// 是否启用了反转颜色
systemPreferences.isInvertedColorScheme();

// 获取字体大小偏好
systemPreferences.getUserDefault('AppleFontSmoothing', 'integer'); // macOS

// 监听系统颜色变化（Windows）
systemPreferences.on('accent-color-changed', (_event, color) => {
  console.log('强调色变化:', color);
});
```

---

## 15. protocol — 自定义协议

注册自定义 URL 协议。**仅主进程**。

```typescript
import { protocol } from 'electron';

// 注册自定义协议（必须在 app.ready 之前调用）
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'myapp',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// app.ready 后处理协议请求
app.whenReady().then(() => {
  protocol.handle('myapp', (request) => {
    const url = new URL(request.url);
    const filePath = path.join(__dirname, 'assets', url.pathname);

    // 读取本地文件并返回
    return new Response(fs.readFileSync(filePath));
  });
});

// 渲染进程中使用
// <img src="myapp://images/logo.png">
// fetch('myapp://api/data')
```

---

## 16. session — 会话管理

管理浏览器会话、Cookie、代理等。**仅主进程**。

### 16.1 基本使用

```typescript
import { session } from 'electron';

// 获取默认会话
const ses = session.defaultSession;

// 获取窗口对应的会话
const ses = win.webContents.session;
```

### 16.2 Cookie 操作

```typescript
// 获取所有 Cookie
const cookies = await ses.cookies.get({});
console.log(cookies);

// 获取指定 URL 的 Cookie
const cookies = await ses.cookies.get({ url: 'https://example.com' });

// 设置 Cookie
await ses.cookies.set({
  url: 'https://example.com',
  name: 'token',
  value: 'abc123',
  httpOnly: true,
  secure: true,
  expirationDate: Math.floor(Date.now() / 1000) + 86400, // 24 小时后
});

// 删除 Cookie
await ses.cookies.remove('https://example.com', 'token');
```

### 16.3 存储清理

```typescript
// 清除所有缓存
await ses.clearCache();

// 清除存储数据（localStorage、IndexedDB 等）
await ses.clearStorageData();

// 清除指定类型的存储
await ses.clearStorageData({
  storages: ['localstorage', 'indexeddb'],
  origin: 'https://example.com',
});
```

### 16.4 下载管理

```typescript
ses.on('will-download', (event, item) => {
  item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()));

  item.on('updated', (_event, state) => {
    if (state === 'progressing') {
      const progress = item.getReceivedBytes() / item.getTotalBytes();
      console.log(`下载进度: ${(progress * 100).toFixed(1)}%`);
    }
  });

  item.on('done', (_event, state) => {
    if (state === 'completed') {
      console.log('下载完成');
    }
  });
});
```

### 16.5 网络拦截

```typescript
// 拦截请求（添加 header）
ses.webRequest.onBeforeSendHeaders((details, callback) => {
  details.requestHeaders['Authorization'] = 'Bearer token123';
  callback({ requestHeaders: details.requestHeaders });
});

// 拦截响应（添加 CSP）
ses.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ["default-src 'self'"],
    },
  });
});

// 阻止特定请求
ses.webRequest.onBeforeRequest({ urls: ['*://*.ads.com/*'] }, (details, callback) => {
  callback({ cancel: true });
});
```

---

## 17. powerMonitor — 电源监控

监听系统电源事件。**仅主进程**。

```typescript
import { powerMonitor } from 'electron';

// 系统休眠/唤醒
powerMonitor.on('suspend', () => {
  console.log('系统即将休眠');
  // 暂停同步、保存状态
});

powerMonitor.on('resume', () => {
  console.log('系统已唤醒');
  // 恢复同步、检查更新
});

// 屏幕锁定/解锁
powerMonitor.on('lock-screen', () => {
  console.log('屏幕已锁定');
});

powerMonitor.on('unlock-screen', () => {
  console.log('屏幕已解锁');
});

// 用户空闲（macOS/Windows）
powerMonitor.on('user-did-become-active', () => {});
powerMonitor.on('user-did-resign-active', () => {});

// 获取空闲时间
const idleTime = powerMonitor.getSystemIdleTime();  // 秒
const idleState = powerMonitor.getSystemIdleState(60); // 'active' | 'idle' | 'unknown'
```

---

## 18. net — 网络请求（主进程）

Electron 内置的网络请求模块，基于 Chromium 的网络栈。**仅主进程**。

```typescript
import { net } from 'electron';

// 简单 GET 请求
const request = net.request('https://api.example.com/data');
request.on('response', (response) => {
  let body = '';
  response.on('data', (chunk) => { body += chunk; });
  response.on('end', () => { console.log(JSON.parse(body)); });
});
request.end();

// 带选项的请求
const request = net.request({
  method: 'POST',
  url: 'https://api.example.com/data',
  session: session.defaultSession,  // 使用默认会话的 Cookie/代理
});
request.setHeader('Content-Type', 'application/json');
request.write(JSON.stringify({ key: 'value' }));
request.end();

// ⚠️ 推荐使用 Node.js 原生 fetch 替代 net（Electron 28+）
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

---

## 19. 类型安全封装速查

### 19.1 IPC Channel 类型映射

```typescript
// shared/ipc-channels.ts
export interface IPCChannelMap {
  // 请求-响应（handle/invoke）
  'get-data': { params: [id: string]; result: DataType };
  'save-file': { params: [path: string, content: string]; result: { success: boolean } };
  'select-file': { params: []; result: string[] };

  // 单向推送（send/on）
  'update-progress': { params: [data: { percent: number }] };
  'theme-changed': { params: [isDark: boolean] };
}
```

### 19.2 类型安全的 preload

```typescript
// preload.ts
import { ipcRenderer } from 'electron';
import type { IPCChannelMap } from '../shared/ipc-channels';

function invoke<C extends keyof IPCChannelMap & string>(
  channel: C,
  ...args: IPCChannelMap[C]['params']
): Promise<IPCChannelMap[C] extends { result: infer R } ? R : void> {
  return ipcRenderer.invoke(channel, ...args);
}

function send<C extends keyof IPCChannelMap & string>(
  channel: C,
  ...args: IPCChannelMap[C]['params']
): void {
  ipcRenderer.send(channel, ...args);
}
```

---

## 20. 模块可用进程速查表

| 模块 | 主进程 | preload | 渲染进程 | 说明 |
|------|:------:|:-------:|:--------:|------|
| `app` | ✅ | ❌ | ❌ | 应用生命周期 |
| `BrowserWindow` | ✅ | ❌ | ❌ | 窗口管理 |
| `ipcMain` | ✅ | ❌ | ❌ | IPC 接收端 |
| `ipcRenderer` | ❌ | ✅ | ❌ | IPC 发送端 |
| `dialog` | ✅ | ❌ | ❌ | 系统对话框 |
| `Menu` | ✅ | ❌ | ❌ | 菜单管理 |
| `Tray` | ✅ | ❌ | ❌ | 系统托盘 |
| `globalShortcut` | ✅ | ❌ | ❌ | 全局快捷键 |
| `protocol` | ✅ | ❌ | ❌ | 自定义协议 |
| `session` | ✅ | ❌ | ❌ | 会话管理 |
| `powerMonitor` | ✅ | ❌ | ❌ | 电源监控 |
| `systemPreferences` | ✅ | ❌ | ❌ | 系统偏好 |
| `net` | ✅ | ❌ | ❌ | 网络请求 |
| `screen` | ✅ | ❌ | ❌ | 屏幕信息 |
| `clipboard` | ✅ | ✅ | ⚠️ | 剪贴板（渲染进程 40 起弃用，后续版本移除） |
| `shell` | ✅ | ✅ | ✅ | 系统能力 |
| `nativeImage` | ✅ | ✅ | ✅ | 图片处理 |
| `Notification` | ✅ | ✅ | ✅ | 系统通知 |

---

## ✏️ 练习

### 练习 1：封装 IPC 类型安全层

**要求**：
1. 定义 `IPCChannelMap` 类型，包含 3 个 handle channel 和 2 个 send channel
2. 在 preload 中实现类型安全的 `invoke` 和 `send` 包装函数
3. 在渲染进程中使用这些方法，验证 TypeScript 类型推断正确

**验收标准**：调用 `invoke` 时参数类型和返回值类型都被正确推断。

### 练习 2：构建系统信息面板

**要求**：
1. 使用 `app` 获取应用版本、名称、路径
2. 使用 `screen` 获取显示器分辨率和缩放比
3. 使用 `systemPreferences` 获取深色模式状态
4. 使用 `powerMonitor` 获取系统空闲时间
5. 通过 IPC 将所有信息发送到渲染进程展示

**验收标准**：渲染进程中显示完整的系统信息面板。

### 练习 3：实现剪贴板监听

**要求**：
1. 使用 `clipboard.readText()` 定时读取剪贴板内容
2. 内容变化时通知渲染进程
3. 支持一键复制和清空剪贴板

**验收标准**：渲染进程实时显示剪贴板内容变化。

---

## 📝 面试回答模板

> **问：Electron 的常用 API 有哪些？分别属于哪个进程？**
>
> Electron API 按进程分为三类。主进程 API 包括 app（生命周期）、BrowserWindow（窗口）、ipcMain（IPC）、dialog（对话框）、Menu（菜单）、Tray（托盘）、globalShortcut（全局快捷键）、protocol（自定义协议）、session（会话）、powerMonitor（电源）。渲染进程 API 只有 ipcRenderer（通过 preload 使用）。通用 API 包括 clipboard（剪贴板）、nativeImage（图片）、shell（系统能力）、Notification（通知）、screen（屏幕信息），这些在主进程和渲染进程都能用。设计原则是：涉及系统能力和窗口管理的 API 只在主进程可用，纯数据操作的 API 双进程通用。

> **问：主进程和渲染进程之间有哪些通信方式？**
>
> 四种方式：1）`ipcMain.handle` + `ipcRenderer.invoke`——请求-响应模式，渲染进程发起请求，主进程返回 Promise，最常用；2）`ipcRenderer.send` + `ipcMain.on`——渲染进程单向通知主进程，不关心返回值；3）`webContents.send` + `ipcRenderer.on`——主进程单向推送到渲染进程，用于进度更新、事件通知等；4）`webContents.executeJavaScript`——主进程直接在渲染进程执行代码，不推荐，耦合度高。推荐的模式是渲染进程只通过 preload 暴露的方法调用 `invoke`，主进程统一处理请求。

> **问：globalShortcut 和应用内快捷键有什么区别？**
>
> 应用内快捷键通过 `Menu` 的 `accelerator` 配置，只在应用窗口聚焦时生效。`globalShortcut` 注册的是系统级快捷键，即使应用不在前台、甚至最小化到托盘也能响应。全局快捷键需要在应用退出时 `unregisterAll()` 清理，否则快捷键会被"占用"导致其他应用无法使用。常见场景：截图工具（Ctrl+Shift+S）、音乐播放器（媒体键控制）、效率工具（快速唤出窗口）。
