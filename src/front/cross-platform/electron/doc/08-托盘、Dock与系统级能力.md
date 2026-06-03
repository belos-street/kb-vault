# 08 — 托盘、Dock 与系统级能力

> 对应大纲：应用层 | 预计时间：1 天
> 面试可答：Electron 提供了丰富的系统级能力——系统托盘（Tray）让应用最小化后仍在后台运行，macOS Dock 菜单可以定制右键操作，`globalShortcut` 注册全局快捷键（应用失焦时仍可响应），`clipboard` 读写剪贴板，`powerMonitor` 监控电源状态。这些 API 都在主进程中使用，是桌面应用区别于 Web 应用的关键能力。

---

## 1. 系统托盘（Tray）

### 1.1 基本用法

```typescript
import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'node:path';

let tray: Tray | null = null;

function createTray(mainWindow: BrowserWindow) {
  // 图标：建议使用 16x16 或 22x22 的 PNG
  // macOS 需要 @2x 版本（32x32）
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  // macOS：设置为模板图像（Template Image）
  // 系统会自动适配深色/浅色菜单栏
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('我的 Electron 应用');

  // 设置上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('menu-action', 'open-settings');
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 点击托盘图标：显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
```

### 1.2 macOS vs Windows 托盘差异

```
macOS 菜单栏托盘：
┌────────────────────────────────────┐
│  🔋 100%  📶  WiFi   🕐 14:30  🔶 │  ← 右侧图标区域
└────────────────────────────────────┘
                    ↑ 托盘图标在这里

Windows 系统托盘：
┌────────────────────────────────────────┐
│                              🔶 14:30 │  ← 任务栏右侧
└────────────────────────────────────────┘
                           ↑ 托盘图标在这里
```

| 特性 | macOS | Windows |
|------|-------|---------|
| 图标大小 | 22×22（@2x: 44×44），模板图像 | 16×16 或 32×32 |
| 点击行为 | 弹出上下文菜单 | 默认弹出上下文菜单，可自定义 |
| 图标颜色 | 模板图像自动适配系统主题 | 需要提供彩色图标 |
| 通知气泡 | 不支持（用系统通知替代） | `displayBalloon()` |

### 1.3 动态更新托盘

```typescript
// 更新图标（如未读消息数）
function updateTrayIcon(count: number) {
  if (!tray) return;

  if (count > 0) {
    const badgeIcon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'tray-icon-badge.png')
    );
    tray.setImage(badgeIcon);
    tray.setToolTip(`我的应用 (${count} 条未读)`);
  } else {
    const normalIcon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'tray-icon.png')
    );
    tray.setImage(normalIcon);
    tray.setToolTip('我的应用');
  }
}
```

### 1.4 Windows 通知气泡

```typescript
// Windows 特有：托盘气泡通知
if (process.platform === 'win32') {
  tray!.displayBalloon({
    iconType: 'info',
    title: '新消息',
    content: '您有 3 条未读消息',
  });
}
```

---

## 2. macOS Dock 菜单

### 2.1 Dock 菜单定制

```typescript
import { app, Menu } from 'electron';

if (process.platform === 'darwin') {
  const dockMenu = Menu.buildFromTemplate([
    {
      label: '新建文件',
      click: () => {
        mainWindow.webContents.send('menu-action', 'new-file');
      },
    },
    {
      label: '打开文件',
      click: () => {
        mainWindow.webContents.send('menu-action', 'open-file');
      },
    },
  ]);

  app.dock.setMenu(dockMenu);
}
```

### 2.2 Dock 角标（Badge）

```typescript
// 设置角标数字（显示在 Dock 图标右上角）
if (process.platform === 'darwin') {
  app.dock.setBadge('3');  // 显示 "3"
  app.dock.setBadge('');   // 清除角标
}

// 设置角标的另一种方式（使用 app.badgeCount）
app.badgeCount = 5;  // 跨平台（macOS 和 Linux 支持）
```

---

## 3. 全局快捷键（globalShortcut）

### 3.1 基本用法

```typescript
import { globalShortcut } from 'electron';

app.whenReady().then(() => {
  // 注册全局快捷键（应用失焦时也能响应）
  const ret = globalShortcut.register('CommandOrControl+Shift+X', () => {
    console.log('全局快捷键触发');
    mainWindow.show();
    mainWindow.focus();
  });

  if (!ret) {
    console.log('快捷键注册失败（可能被其他应用占用）');
  }

  // 检查是否注册成功
  console.log(globalShortcut.isRegistered('CommandOrControl+Shift+X'));
});

// 应用退出时注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

### 3.2 常见应用场景

```typescript
// 截图快捷键
globalShortcut.register('CommandOrControl+Shift+S', () => {
  captureScreen();
});

// 快速搜索（类似 Alfred / Spotlight）
globalShortcut.register('CommandOrControl+Shift+Space', () => {
  showQuickSearch();
});

// 静音切换
globalShortcut.register('CommandOrControl+Shift+M', () => {
  toggleMute();
});
```

### 3.3 注意事项

| 事项 | 说明 |
|------|------|
| 快捷键冲突 | 如果系统或其他应用已占用该快捷键，`register` 返回 `false` |
| 必须注销 | 应用退出时必须 `unregisterAll()`，否则快捷键可能被"占用"直到系统重启 |
| 不要在开发时滥用 | 全局快捷键会拦截系统级操作，开发时容易和 IDE 快捷键冲突 |
| macOS 权限 | macOS 可能需要辅助功能权限（Accessibility） |

---

## 4. 剪贴板（Clipboard）

### 4.1 基本读写

```typescript
import { clipboard } from 'electron';

// 读写文本
clipboard.writeText('Hello Electron');
const text = clipboard.readText();
console.log(text); // "Hello Electron"

// 读写 HTML
clipboard.writeHTML('<b>Hello</b>');
const html = clipboard.readHTML();

// 读写图片
const image = nativeImage.createFromPath('/path/to/image.png');
clipboard.writeImage(image);
const pastedImage = clipboard.readImage();

// 读写 RTF
clipboard.writeRTF('{\\rtf1 Hello}');
const rtf = clipboard.readRTF();
```

### 4.2 通过 IPC 暴露给渲染进程

```typescript
// 主进程
ipcMain.handle('clipboard:read-text', () => clipboard.readText());
ipcMain.handle('clipboard:write-text', (_event, text: string) => {
  clipboard.writeText(text);
});
ipcMain.handle('clipboard:read-image', () => {
  const image = clipboard.readImage();
  return image.isEmpty() ? null : image.toDataURL();
});
```

### 4.3 剪贴板格式

剪贴板支持多种格式同时存在：

```typescript
// 同时写入多种格式
clipboard.write({
  text: 'Hello',
  html: '<b>Hello</b>',
  rtf: '{\\rtf1 \\b Hello}',
});

// 读取时选择格式
console.log(clipboard.readText());  // "Hello"
console.log(clipboard.readHTML());  // "<b>Hello</b>"
```

---

## 5. 电源监控（Power Monitor）

### 5.1 基本用法

```typescript
import { powerMonitor } from 'electron';

app.whenReady().then(() => {
  // 系统进入休眠
  powerMonitor.on('suspend', () => {
    console.log('系统即将休眠');
    // 保存数据、暂停任务
    saveAppState();
  });

  // 系统从休眠唤醒
  powerMonitor.on('resume', () => {
    console.log('系统已唤醒');
    // 恢复状态、刷新数据
    refreshData();
  });

  // 屏幕锁定
  powerMonitor.on('lock-screen', () => {
    console.log('屏幕已锁定');
    // 暂停敏感操作
  });

  // 屏幕解锁
  powerMonitor.on('unlock-screen', () => {
    console.log('屏幕已解锁');
  });

  // 电源状态变化（使用电池 / 接通电源）
  powerMonitor.on('on-battery', () => {
    console.log('切换到电池供电');
    // 降低刷新频率、减少后台任务
  });

  powerMonitor.on('on-ac', () => {
    console.log('已接通电源');
    // 恢复正常刷新频率
  });

  // 获取当前电源状态
  const batteryLevel = powerMonitor.getSystemIdleState(5);
  console.log('系统空闲状态:', batteryLevel); // 'active' / 'idle' / 'locked' / 'unknown'
});
```

### 5.2 应用场景

| 事件 | 典型操作 |
|------|---------|
| `suspend` | 保存未完成的数据、暂停同步任务、断开数据库连接 |
| `resume` | 刷新数据、恢复同步、检查 token 是否过期 |
| `lock-screen` | 暂停敏感操作、锁屏显示应用锁 |
| `unlock-screen` | 恢复操作 |
| `on-battery` | 降低刷新频率、关闭动画、减少后台计算 |
| `on-ac` | 恢复正常模式 |

---

## 6. 开机自启动

### 6.1 使用 app.setLoginItemSettings（推荐）

```typescript
import { app } from 'electron';

// 设置开机自启动
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,  // macOS: 启动时隐藏窗口（仅后台运行）
  // Windows 特有选项
  path: app.getPath('exe'),
  args: ['--hidden'],
});

// 查询当前自启动状态
const settings = app.getLoginItemSettings();
console.log('开机自启动:', settings.openAtLogin);

// 取消开机自启动
app.setLoginItemSettings({
  openAtLogin: false,
});
```

### 6.2 平台差异

| 特性 | macOS | Windows | Linux |
|------|-------|---------|-------|
| `openAtLogin` | ✅ | ✅ | ✅（部分发行版） |
| `openAsHidden` | ✅ | ❌（用 `--hidden` 参数替代） | ❌ |
| 注册方式 | Login Items | 注册表 | .desktop 文件 |

---

## 7. 屏幕信息

### 7.1 获取屏幕尺寸

```typescript
import { screen } from 'electron';

app.whenReady().then(() => {
  // 获取主显示器信息
  const primaryDisplay = screen.getPrimaryDisplay();
  console.log('主显示器:', {
    width: primaryDisplay.size.width,
    height: primaryDisplay.size.height,
    scaleFactor: primaryDisplay.scaleFactor,  // Retina: 2
    workAreaSize: primaryDisplay.workAreaSize, // 减去任务栏/菜单栏
  });

  // 获取所有显示器
  const allDisplays = screen.getAllDisplays();
  console.log('显示器数量:', allDisplays.length);

  // 获取鼠标位置
  const cursorPos = screen.getCursorScreenPoint();
  console.log('鼠标位置:', cursorPos);
});
```

---

## ✏️ 练习

### 练习 1：实现系统托盘

**要求**：
1. 创建一个系统托盘图标（可以用 nativeImage 创建纯色方块替代）
2. 右键托盘弹出菜单：显示窗口、设置、退出
3. 左键点击托盘切换窗口显示/隐藏

**验收标准**：托盘图标正常显示，点击可以切换窗口可见性。

### 练习 2：注册全局快捷键

**要求**：
1. 注册 `Cmd/Ctrl+Shift+Space` 全局快捷键
2. 快捷键触发时显示/隐藏主窗口
3. 应用退出时注销快捷键

**验收标准**：应用失焦时，按快捷键可以显示窗口。

### 练习 3：剪贴板监听

**要求**：
1. 每秒轮询剪贴板内容（`clipboard.readText()`）
2. 当剪贴板内容变化时，在渲染进程中显示新内容
3. 保留最近 10 条剪贴板历史

**验收标准**：复制文本后，应用中自动显示剪贴板历史。

### 练习 4：电源状态响应

**要求**：
1. 监听 `suspend` 和 `resume` 事件
2. 休眠时保存应用状态，唤醒时恢复
3. 在渲染进程中显示当前电源状态

**验收标准**：系统休眠唤醒后，应用状态正确恢复。

---

## 📝 面试回答模板

> **问：Electron 的系统托盘是怎么实现的？**
>
> 通过 `Tray` 类创建，传入图标路径或 `NativeImage` 对象。设置上下文菜单（`setContextMenu`）定义右键菜单项。托盘图标建议使用 16×16（Windows）或 22×22（macOS）的 PNG，macOS 推荐使用模板图像（`setTemplateImage(true)`）以自动适配深色/浅色菜单栏。典型的应用是最小化到托盘——关闭窗口时 `e.preventDefault()` 并 `win.hide()`，点击托盘图标时 `win.show()`。

> **问：globalShortcut 和菜单快捷键有什么区别？**
>
> 菜单快捷键（accelerator）只在应用窗口获得焦点时响应，是应用内的快捷键。`globalShortcut` 注册的是系统级全局快捷键，即使应用窗口失焦甚至最小化到托盘也能响应。典型应用场景是截图工具、快速搜索（类似 Alfred）。需要注意的是，全局快捷键可能和系统或其他应用的快捷键冲突，`register` 会返回 `false` 表示注册失败。应用退出时必须 `unregisterAll()` 注销。

> **问：Electron 如何实现开机自启动？**
>
> 使用 `app.setLoginItemSettings({ openAtLogin: true })` 即可。macOS 通过 Login Items 注册，Windows 通过注册表注册，Linux 通过 .desktop 文件注册。macOS 还支持 `openAsHidden: true` 让应用启动时隐藏窗口（仅在后台运行）。可以通过 `app.getLoginItemSettings()` 查询当前状态。实际产品中，这个设置通常放在"设置"页面中让用户自行开关。
