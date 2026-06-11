# 05 — 动画与 Ticker

> 对应大纲：模块 5 | 预计时间：1 天
> 面试可答：`Ticker` 是 PixiJS 内置的帧循环，封装了 `requestAnimationFrame`，每秒约 60 次调用回调函数。核心是 `deltaTime`——它表示当前帧与上一帧的时间比值（60fps 时约为 1，30fps 时约为 2），用它乘以速度可以实现帧率无关的动画。Ticker 还支持 `maxFPS` 限制帧率、`speed` 调整全局速度、`destroy()` 停止循环。

---

## 1. Ticker 基础

### 1.1 什么是 Ticker

Ticker 本质是 `requestAnimationFrame`（rAF）的封装，每帧调用一次注册的回调函数。

```javascript
// 原生 rAF
function loop() {
  // 更新逻辑
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// PixiJS Ticker（更简洁）
app.ticker.add((ticker) => {
  // 更新逻辑 — 自动每帧调用
});
```

### 1.2 基本用法

```javascript
// 注册每帧回调
app.ticker.add((ticker) => {
  // ticker 对象包含帧信息
  console.log(ticker.deltaTime);  // 帧时间比
  console.log(ticker.elapsedMS);  // 距上一帧的毫秒数
  console.log(ticker.FPS);        // 当前帧率
});

// 带上下文的回调
app.ticker.add(this.update, this);

// 移除回调
app.ticker.remove(callback);

// 移除所有回调
app.ticker.removeCallbacks();
```

### 1.3 帧循环生命周期

```
每一帧：
  1. 计算 deltaTime（基于上一帧的时间差）
  2. 按注册顺序调用所有 ticker.add 的回调
  3. 渲染场景图到 Canvas
  4. requestAnimationFrame 下一帧
```

---

## 2. deltaTime — 帧率无关动画

### 2.1 为什么需要 deltaTime

不同设备的帧率不同（60fps、120fps、30fps），如果直接用固定值移动，帧率高的设备物体移动更快。

```
❌ 不使用 deltaTime：
  60fps：每帧移动 2px → 每秒移动 120px
  30fps：每帧移动 2px → 每秒移动 60px   ← 速度不一致！

✅ 使用 deltaTime：
  60fps：每帧移动 2 × 1 = 2px  → 每秒移动 120px
  30fps：每帧移动 2 × 2 = 4px  → 每秒移动 120px  ← 速度一致！
```

### 2.2 deltaTime 的含义

```javascript
app.ticker.add((ticker) => {
  // deltaTime 是当前帧与理想帧时间的比值
  // 理想帧率 60fps → 每帧 16.67ms
  //
  // 如果实际帧时间为 16.67ms → deltaTime ≈ 1.0
  // 如果实际帧时间为 33.33ms（30fps）→ deltaTime ≈ 2.0
  // 如果实际帧时间为 8.33ms（120fps）→ deltaTime ≈ 0.5

  const dt = ticker.deltaTime;

  // 所有移动/旋转/缩放都乘以 dt
  enemy.y += 2 * dt;         // 匀速下落
  bullet.y -= 8 * dt;        // 子弹向上飞
  ship.rotation += 0.02 * dt; // 匀速旋转
});
```

### 2.3 ticker 对象属性

```javascript
app.ticker.add((ticker) => {
  ticker.deltaTime;   // 帧时间比（60fps ≈ 1，30fps ≈ 2）
  ticker.elapsedMS;   // 距上一帧的实际毫秒数（60fps ≈ 16.67）
  ticker.FPS;         // 当前帧率（只读，大约值）
  ticker.deltaMS;     // 同 elapsedMS
  ticker.lastTime;    // 上一帧的时间戳
  ticker.speed;       // 全局速度倍率（默认 1）
});
```

### 2.4 实战：匀速移动

```javascript
const ship = new Sprite(shipTexture);
ship.anchor.set(0.5);
ship.position.set(400, 500);
app.stage.addChild(ship);

const enemies = [];
const SPEED = 3;

app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;

  // 敌机匀速下落
  for (const enemy of enemies) {
    enemy.y += SPEED * dt;

    // 出屏回收
    if (enemy.y > 700) {
      enemy.y = -50;
      enemy.x = Math.random() * 800;
    }
  }
});
```

---

## 3. Ticker 配置

### 3.1 限制帧率

```javascript
// 限制最大帧率（省电、减少 CPU/GPU 负担）
app.ticker.maxFPS = 30;   // 最高 30fps

// 不限制（默认）
app.ticker.maxFPS = 0;    // 0 = 不限制
```

### 3.2 全局速度

```javascript
// 调整全局速度倍率（影响所有 ticker 回调的 deltaTime）
app.ticker.speed = 2;     // 2 倍速（游戏加速）
app.ticker.speed = 0.5;   // 半速（慢动作）
app.ticker.speed = 1;     // 正常速度（默认）
```

### 3.3 暂停与恢复

```javascript
// 暂停所有动画
app.ticker.stop();

// 恢复
app.ticker.start();

// 检查是否在运行
app.ticker.started;  // true/false
```

### 3.4 多个 Ticker

```javascript
import { Ticker } from 'pixi.js';

// 创建独立的 Ticker（不依赖 app.ticker）
const physicsTicker = new Ticker();
physicsTicker.maxFPS = 30;  // 物理引擎 30fps

physicsTicker.add((ticker) => {
  // 物理更新
  updatePhysics(ticker.deltaTime);
});

physicsTicker.start();
```

---

## 4. 缓动函数（Easing）

### 4.1 线性插值（Lerp）

最基础的缓动，让对象平滑地移动到目标位置。

```javascript
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// 每帧应用
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;
  const speed = 0.05;

  // 平滑跟随鼠标
  ship.x = lerp(ship.x, mouseX, speed * dt);
  ship.y = lerp(ship.y, mouseY, speed * dt);
});
```

**lerp 的 t 值含义**：
- `t = 0`：不动
- `t = 1`：瞬间到达
- `t = 0.05`：每帧移动剩余距离的 5%（平滑跟随）
- `t * dt`：帧率无关的平滑

### 4.2 常见缓动函数

```javascript
// 线性（匀速）
function linear(t) { return t; }

// 缓入（先慢后快）
function easeIn(t) { return t * t; }

// 缓出（先快后慢）
function easeOut(t) { return t * (2 - t); }

// 缓入缓出
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// 弹性
function elastic(t) {
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1;
}
```

### 4.3 基于时间的缓动

```javascript
// 从 A 点移动到 B 点，持续 1 秒
function tweenTo(obj, targetX, targetY, duration) {
  const startX = obj.x;
  const startY = obj.y;
  let elapsed = 0;

  const update = (ticker) => {
    elapsed += ticker.elapsedMS;
    const t = Math.min(elapsed / duration, 1);  // 0~1
    const eased = easeOut(t);                    // 应用缓动

    obj.x = lerp(startX, targetX, eased);
    obj.y = lerp(startY, targetY, eased);

    if (t >= 1) {
      app.ticker.remove(update);  // 到达目标，移除更新
    }
  };

  app.ticker.add(update);
}

// 使用
tweenTo(ship, 400, 100, 1000);  // 1 秒内移动到 (400, 100)
```

### 4.4 缓动效果速查

| 效果 | 函数 | 适用场景 |
|------|------|---------|
| 线性 | `linear(t)` | 匀速移动、旋转 |
| 缓入 | `easeIn(t)` | 物体开始移动 |
| 缓出 | `easeOut(t)` | 物体停止移动 |
| 缓入缓出 | `easeInOut(t)` | 平滑过渡 |
| 弹性 | `elastic(t)` | 到达目标后弹跳 |
| 回弹 | `back(t)` | 超过目标后回弹 |

---

## 5. 实战：游戏循环模式

### 5.1 典型游戏循环结构

```javascript
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;

  // 1. 输入处理（读取键盘/鼠标状态）
  handleInput(dt);

  // 2. 更新游戏状态
  updatePlayer(dt);
  updateEnemies(dt);
  updateBullets(dt);
  checkCollisions();

  // 3. 更新 UI
  updateScoreText();
  updateHealthBar();
});
```

### 5.2 分离更新频率

```javascript
// 高频：每帧更新（渲染相关）
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;
  updateVisuals(dt);      // 移动、旋转、缩放
});

// 低频：每 3 帧更新一次（物理/碰撞）
let frameCount = 0;
app.ticker.add((ticker) => {
  frameCount++;
  if (frameCount % 3 === 0) {
    checkCollisions();    // 碰撞检测开销大，降频
  }
});
```

---

## 6. 常见问题

### 6.1 动画在不同设备上速度不一致

```javascript
// ❌ 不使用 deltaTime
app.ticker.add(() => {
  ship.x += 5;  // 60fps 设备每秒 300px，120fps 设备每秒 600px
});

// ✅ 使用 deltaTime
app.ticker.add((ticker) => {
  ship.x += 5 * ticker.deltaTime;  // 所有设备每秒 300px
});
```

### 6.2 deltaTime 值异常大

```javascript
// 切换标签页后回来，deltaTime 可能非常大
// 导致物体瞬移

app.ticker.add((ticker) => {
  const dt = Math.min(ticker.deltaTime, 3);  // 限制最大值
  ship.y += 2 * dt;
});
```

### 6.3 Ticker 回调顺序

```javascript
// 回调按注册顺序执行
app.ticker.add(() => { /* 先执行 */ });
app.ticker.add(() => { /* 后执行 */ });

// 确保物理更新在渲染更新之前
app.ticker.add(updatePhysics);    // 先更新位置
app.ticker.add(updateVisuals);    // 再更新视觉
```

---

## 7. 方案对比：Ticker vs 原生 rAF vs GSAP

| 特性 | PixiJS Ticker | 原生 rAF | GSAP (gsap.ticker) |
|------|:---:|:---:|:---:|
| **deltaTime** | ✅ 内置（`ticker.deltaTime`） | ❌ 需自行计算 | ✅ 内置（`gsap.ticker.deltaRatio()`） |
| **帧率限制** | ✅ `maxFPS` | ❌ 不支持 | ❌ 不支持 |
| **暂停/恢复** | ✅ `stop()`/`start()` | ❌ 需手动 flag | ✅ `gsap.globalTimeline.pause()` |
| **速度倍率** | ✅ `ticker.speed` | ❌ 不支持 | ✅ `gsap.globalTimeline.timeScale()` |
| **渲染集成** | ✅ 自动触发渲染 | ❌ 需手动调用 | ❌ 需配合渲染调用 |
| **回调管理** | ✅ `add()`/`remove()` | ❌ 需自行管理 | ✅ `add()`/`remove()` |
| **适用场景** | PixiJS 项目首选 | 简单动画/无框架 | 复杂缓动/跨框架动画 |

**选择建议**：
- PixiJS 项目 → 直接用 `app.ticker`，和渲染管线无缝集成
- 纯 DOM 动画 → GSAP 的缓动函数更强大
- 极简场景 → 原生 rAF 零依赖，但需自行处理 deltaTime 和暂停逻辑

---

## ✏️ 练习

### 练习 1：匀速移动

**要求**：
1. 创建 5 个敌机精灵，从顶部向下匀速移动
2. 使用 `deltaTime` 保证帧率无关
3. 出屏后重新回到顶部随机位置

**提示**：参考第 2.4 节匀速移动代码，`app.ticker.add` 回调中用 `ticker.deltaTime` 乘以速度，出屏判断 `y > app.screen.height` 时重置 `y = -50` 并随机 `x`

**验收标准**：不同帧率下敌机移动速度一致。

### 练习 2：缓动动画

**要求**：
1. 创建一个精灵，点击画布任意位置时平滑移动到该位置
2. 使用 lerp 实现缓动效果
3. 到达目标后停止更新

**提示**：参考第 4.1 节 lerp 代码，监听 `app.stage.on('pointertap')` 获取目标坐标，ticker 中 `ship.x = lerp(ship.x, targetX, 0.05 * dt)`，距离小于 1 时停止

**验收标准**：精灵平滑移动到点击位置，有"减速停止"的效果。

### 练习 3：弹性效果

**要求**：
1. 创建一个精灵，按空格键后从画布底部弹跳到顶部
2. 使用弹性缓动函数（elastic）
3. 到达顶部后有轻微弹跳效果

**提示**：参考第 4.3 节 `tweenTo` 函数结构，将 `easeOut` 替换为第 4.2 节的 `elastic` 函数，监听 `keydown` 空格键触发，起始位置 `(400, 550)` 目标 `(400, 100)`

**验收标准**：精灵弹跳上升，到达目标后有弹性回弹。

---

## 📝 面试回答模板

> **问：PixiJS 的 Ticker 是什么？和 requestAnimationFrame 有什么区别？**
>
> Ticker 是 `requestAnimationFrame` 的封装，核心功能一致——每帧调用一次回调。Ticker 额外提供了 `deltaTime`（帧时间比）、`FPS`（当前帧率）、`maxFPS`（帧率限制）、`speed`（全局速度倍率）等实用属性。使用 Ticker 而不是直接用 rAF 的好处是：1）`deltaTime` 让动画帧率无关；2）`maxFPS` 可以限制帧率省电；3）多个回调统一管理，暂停/恢复只需 `ticker.stop()` / `ticker.start()`。

> **问：什么是 deltaTime？为什么要用它？**
>
> `deltaTime` 是当前帧与理想帧时间（60fps = 16.67ms）的比值。60fps 时约为 1，30fps 时约为 2，120fps 时约为 0.5。所有移动、旋转、缩放都应该乘以 `deltaTime`，这样在不同帧率的设备上动画速度一致。如果不使用 `deltaTime`，120fps 设备上物体会比 30fps 设备快 4 倍。
