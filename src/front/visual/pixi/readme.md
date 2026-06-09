根据"快速上手、面试能答、做出游戏"的目标，这份大纲把 PixiJS 学习拆解成 **8 个模块**（6 基础 + 2 进阶），每天 1~2 小时，**约两周完成**。每个模块都对应到面试常问点，最后用一个**飞机大战** Demo 串联全部知识。

> 本大纲基于 **PixiJS v8** API，v8 相比 v7 有较大改动（Graphics 链式 API、Application 异步初始化、eventMode 五种模式等）。

---

## 🎯 学习目标
- 理解 PixiJS 场景图、渲染循环、事件系统的设计理念
- 掌握核心 API 的作用与使用场景（能口头向面试官解释）
- 用纯代码绘制图形、管理纹理、处理交互和动画
- 独立开发一个包含碰撞检测、对象池、粒子特效的中型游戏

---

## 📋 前置要求
- 熟悉 JavaScript ES6+（类、模块、异步）
- 了解 Canvas 基本概念（不要求手写 API）
- 有 DOM 事件与树状结构的基础认知

---

## 🛠️ 开发工具推荐

- **PixiJS DevTools**：Chrome 浏览器扩展，可在 DevTools 中查看场景树、实时调整显示对象属性，开发调试必备
- **TexturePacker**：精灵图集打包工具，将多张小图合并为一张 sprite sheet，减少 GPU 纹理切换

---

## ⚖️ 方案对比：为什么选 PixiJS？

| 维度 | 原生 Canvas 2D | PixiJS | Phaser | Three.js |
|------|---------------|--------|--------|----------|
| **定位** | 浏览器内置 API | 2D 渲染引擎 | 2D 游戏框架 | 3D 渲染引擎 |
| **渲染方式** | CPU 软渲染 | WebGL 优先，Canvas 回退 | WebGL 优先 | WebGL / WebGPU |
| **场景图** | 无（手动管理） | ✅ Container 树 | ✅ Scene 体系 | ✅ Object3D 树 |
| **事件系统** | 手动命中检测 | ✅ 自动命中检测 | ✅ 内置事件 | ✅ Raycaster |
| **精灵/纹理** | drawImage 手动管理 | ✅ 纹理批处理、图集 | ✅ 内置 Sprite | ❌ 非 2D 场景 |
| **性能上限** | 低（CPU 绑定） | 高（GPU 批渲染） | 高（GPU 批渲染） | 高（GPU） |
| **包体积** | 0（内置） | ~150KB gzip | ~700KB gzip | ~600KB gzip |
| **学习曲线** | 低（原生 API） | 中 | 中高（框架约束多） | 高（3D 概念多） |
| **适用场景** | 简单图表、小动画 | 通用 2D 渲染、游戏、可视化 | 2D 游戏（内置物理/动画） | 3D 场景、数据可视化 |

**选型建议**：
- **选 PixiJS**：需要高性能 2D 渲染（游戏、可视化、交互式 H5），且不想被框架约束
- **选 Phaser**：专注做 2D 游戏，需要物理引擎、动画状态机等游戏框架能力
- **选 Three.js**：3D 场景或 2.5D 需求
- **选原生 Canvas**：简单图表、性能要求低、不想引入依赖

---

## 📚 模块详解

### 模块 1：环境搭建与第一个应用（0.5 天）
**面试可答**：如何初始化 PixiJS v8 应用，`Application` 的作用。

- CDN 引入与 npm 安装（`npm install pixi.js`）
- v8 核心变化：`Application` 必须通过 `await app.init()` 异步初始化
- 理解 `app.canvas`（Canvas 元素）、`app.stage`（根容器）、`app.screen`（屏幕尺寸）
- `app.canvas` 需手动添加到 DOM

```javascript
import { Application, Graphics } from 'pixi.js';

const app = new Application();
await app.init({ width: 800, height: 600, background: '#1a1a2e' });
document.body.appendChild(app.canvas);  // v8 需手动挂载

const circle = new Graphics();
circle.circle(0, 0, 50);  // v8：定义形状
circle.fill(0xff0000);     // v8：单独填充
circle.position.set(400, 300);
app.stage.addChild(circle);
```

**练习**：

**要求**：创建一个 800×600 的画布，设置深色背景，绘制一个红色圆形和一个蓝色矩形

**提示**：使用 `new Graphics()` 创建图形对象，分别调用 `circle()` + `fill()` 和 `rect()` + `fill()`

**验收标准**：打开浏览器能看到画布上有红色圆形和蓝色矩形，控制台无报错

---

### 模块 2：场景图与显示对象（1 天）
**面试可答**：`Container` 类似无样式 `<div>`，`addChild` 管理层级，父子变换继承。

- `DisplayObject` 公共属性：`x, y, scale, rotation, alpha, visible, width, height, pivot, anchor`
- `Container` 分组与嵌套，父子变换继承（父容器移动，子对象跟随）
- 排序与 `zIndex`（需设置 `container.sortableChildren = true`）
- **移除与销毁**：`removeChild()` 从场景图移除但保留对象可复用；`destroy()` 彻底销毁释放 GPU 资源

```javascript
// 移除 vs 销毁的区别
container.removeChild(sprite);  // 从场景图移除，sprite 仍可 addChild 回来
sprite.destroy();               // 彻底销毁纹理和内存，不可复用
```

**练习**：

**要求**：用圆形和矩形拼出一个机器人（头、身体、四肢），放入一个 Container，整体可移动

**提示**：先创建 `const robot = new Container()`，然后用 `new Graphics()` 分别绘制头部（圆形）、身体（矩形）、四肢（矩形），全部 `robot.addChild()`，最后 `app.stage.addChild(robot)`

**验收标准**：机器人在舞台上显示完整，修改 `robot.x` 时所有部位一起移动

---

### 模块 3：矢量绘图与文本（1 天）
**面试可答**：`Graphics` 无需外部资源即可绘制，v8 采用形状定义与样式分离的链式 API。

- **v8 Graphics API 变化**：形状定义与填充/描边分离

```javascript
import { Graphics } from 'pixi.js';

const g = new Graphics();

// v8 链式写法：先定义形状，再 fill/stroke
g.rect(0, 0, 200, 100);
g.fill(0x00ff00);           // 填充绿色
g.stroke({ width: 2, color: 0xffffff });  // 白色描边

// 多个形状
g.circle(0, 0, 30);
g.fill(0xff0000);

g.moveTo(0, 0);             // 路径绘制
g.lineTo(100, 50);
g.lineTo(100, 0);
g.closePath();
g.fill(0x0000ff);
```

- `Text` 创建与样式（v8 使用 `TextStyle` 对象）

```javascript
import { Text, TextStyle } from 'pixi.js';

const style = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 36,
  fill: '#ffffff',
  fontWeight: 'bold',
});
const text = new Text({ text: 'Score: 0', style });
text.position.set(10, 10);
```

- `Text` 动态更新：直接修改 `text.text = 'new value'`（v8 属性名变化）

**练习**：

**要求**：纯代码绘制一个计分板，包含一个星星图标（五角星路径）和分数文字

**提示**：用 `Graphics` 的 `moveTo/lineTo` 绘制五角星路径，用 `Text` + `TextStyle` 显示分数，放入同一个 Container

**验收标准**：计分板显示在左上角，星星图标和文字都可见，修改分数文字内容后实时更新

---

### 模块 4：精灵与纹理管理（1 天）
**面试可答**：`Sprite` 负责显示图片，`Texture` 是 GPU 纹理，`Assets` 异步加载。

- 使用 `Assets.load()` 异步加载资源（v8 推荐方式）

```javascript
import { Assets, Sprite } from 'pixi.js';

// 异步加载单张图片
const texture = await Assets.load('images/ship.png');
const ship = new Sprite(texture);
ship.anchor.set(0.5);  // 锚点居中
ship.position.set(400, 500);
app.stage.addChild(ship);

// 简写：Sprite.from()（同步，纹理已加载时可用）
const enemy = Sprite.from('images/enemy.png');
```

- **批量加载**：`Assets.load()` 支持批量

```javascript
const textures = await Assets.load([
  'images/ship.png',
  'images/enemy.png',
  'images/bullet.png',
]);
```

- **纹理复用**：多个精灵共享同一纹理对象，不额外占用 GPU 显存

```javascript
const bulletTexture = await Assets.load('images/bullet.png');
// 多个子弹精灵共享同一纹理
const bullet1 = new Sprite(bulletTexture);
const bullet2 = new Sprite(bulletTexture);
```

- **精灵图集（Spritesheet）**：将多张小图合并为一张大图 + JSON 描述文件，减少纹理切换次数

```javascript
import { Assets, Spritesheet } from 'pixi.js';

const spritesheetData = await fetch('images/game.json').then(r => r.json());
const atlasTexture = await Assets.load('images/game.png');
const spritesheet = new Spritesheet(atlasTexture, spritesheetData);
await spritesheet.parse();

// 使用图集中的单张纹理
const ship = new Sprite(spritesheet.textures['ship.png']);
const enemy = new Sprite(spritesheet.textures['enemy.png']);
```

**练习**：

**要求**：加载飞船和敌机两张图片，分别创建精灵，飞船居中偏下，敌机在上方随机位置

**提示**：使用 `await Assets.load()` 加载图片，`new Sprite(texture)` 创建精灵，`anchor.set(0.5)` 锚点居中

**验收标准**：两张图片成功加载并显示在正确位置，控制台无纹理加载错误

---

### 模块 5：动画与 Ticker（1 天）
**面试可答**：`Ticker` 是封装的帧循环，`deltaTime` 实现帧率无关动画。

- `app.ticker.add(callback)` 注册每帧回调
- `ticker.deltaTime` 基于时间的移动（帧率无关）

```javascript
app.ticker.add((ticker) => {
  // deltaTime：60fps 时约 1，30fps 时约 2
  const dt = ticker.deltaTime;
  enemy.y += 2 * dt;       // 匀速下落
  bullet.y -= 5 * dt;      // 子弹向上飞
  ship.rotation += 0.02 * dt;  // 匀速旋转
});
```

- 缓动函数（线性插值 lerp）

```javascript
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// 每帧平滑移动到目标位置
app.ticker.add((ticker) => {
  ship.x = lerp(ship.x, targetX, 0.05 * ticker.deltaTime);
  ship.y = lerp(ship.y, targetY, 0.05 * ticker.deltaTime);
});
```

- `ticker.maxFPS` 限制最大帧率（省电）

**练习**：

**要求**：敌机自动下落（每帧 `y += 2 * dt`），子弹向上飞行（`y -= 5 * dt`），玩家飞船跟随鼠标移动并带惯性（lerp）

**提示**：在 `app.ticker.add()` 回调中使用 `ticker.deltaTime` 保证帧率无关，用 lerp 函数实现平滑跟随

**验收标准**：60fps 和 30fps 下敌机下落速度视觉一致，飞船跟随鼠标但有平滑延迟感

---

### 模块 6：交互事件系统（1 天）
**面试可答**：事件模式类似 DOM，需开启 `eventMode`，底层自动做命中检测。

- **v8 的 `eventMode` 五种模式**（替代 v7 的 `interactive`）：

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `'none'` | 不接收事件 | 静态背景 |
| `'passive'` | 接收事件，不阻止冒泡（默认） | 一般 UI 元素 |
| `'auto'` | 根据是否绑定事件自动切换 | 不确定是否有事件 |
| `'static'` | 接收事件，命中区域固定 | 按钮、静态精灵 |
| `'dynamic'` | 接收事件，命中区域每帧重新计算 | 频繁移动/缩放的对象 |

```javascript
// 静态按钮用 'static'
button.eventMode = 'static';
button.cursor = 'pointer';

// 频繁移动的游戏对象用 'dynamic'
player.eventMode = 'dynamic';
```

- 常用事件：`pointertap`（点击）、`pointerdown`（按下）、`pointermove`（移动）、`pointerup`（抬起）
- 全局事件：`app.stage.on('pointermove', ...)` 在舞台任意位置触发

```javascript
enemy.eventMode = 'static';
enemy.cursor = 'pointer';
enemy.on('pointertap', () => {
  // 点击敌机 → 爆炸
  createExplosion(enemy.x, enemy.y);
  enemy.visible = false;
});
```

- 销毁时记得移除事件监听：`sprite.off('pointertap', handler)` 或 `sprite.destroy()`

**练习**：

**要求**：点击敌机时触发爆炸效果（Graphics 绘制的圆形扩散动画），点击飞船时发射一颗子弹向上飞

**提示**：敌机设置 `eventMode = 'static'`，监听 `pointertap` 事件；子弹在 ticker 中每帧移动

**验收标准**：点击敌机有视觉反馈（爆炸/消失），点击飞船有子弹射出，控制台无事件相关警告

---

### 模块 7a：碰撞检测与对象池（1.5 天）
**面试可答**：碰撞检测（距离公式 vs AABB）、对象池模式（减少 GC 压力）。

#### 7.1 碰撞检测

```javascript
// 圆形碰撞（距离公式，游戏最常用）
function circleCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < a.radius + b.radius;
}

// 矩形碰撞（AABB 包围盒）
function rectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
```

#### 7.2 对象池

```javascript
class BulletPool {
  constructor(texture, maxSize = 50) {
    this.pool = [];
    this.texture = texture;
    for (let i = 0; i < maxSize; i++) {
      const bullet = new Sprite(texture);
      bullet.visible = false;
      bullet.active = false;
      app.stage.addChild(bullet);
      this.pool.push(bullet);
    }
  }

  get() {
    const bullet = this.pool.find(b => !b.active);
    if (bullet) {
      bullet.visible = true;
      bullet.active = true;
      return bullet;
    }
    return null;  // 池已满
  }

  release(bullet) {
    bullet.visible = false;
    bullet.active = false;
  }
}
```

---

### 模块 7b：遮罩、滤镜与性能优化（1.5 天）
**面试可答**：遮罩实现视野效果、滤镜后处理、性能优化策略（对象池 / 图集 / ParticleContainer）。

```javascript
import { Graphics } from 'pixi.js';

// 圆形遮罩 → 实现视野效果
const mask = new Graphics();
mask.circle(400, 300, 200);
mask.fill(0xffffff);

gameContainer.mask = mask;
app.stage.addChild(mask);
```

#### 7.4 滤镜（Filter）

```javascript
import { BlurFilter, ColorMatrixFilter } from 'pixi.js';

// 爆炸模糊效果
const blur = new BlurFilter();
blur.strength = 8;
explosion.filters = [blur];

// 灰度效果（游戏结束画面）
const gray = new ColorMatrixFilter();
gray.desaturate();
gameOverContainer.filters = [gray];
```

#### 7.5 性能优化

| 技巧 | 说明 |
|------|------|
| 对象池 | 预创建子弹/敌机，回收复用，避免每帧 `new` + `destroy` |
| 纹理图集 | 合并小图为 sprite sheet，减少 GPU 纹理切换 |
| `cacheAsBitmap` | 静态复杂容器设为 `true`，缓存为位图减少重绘 |
| `ParticleContainer` | 批量渲染同类精灵（如粒子），比普通 Container 快 |
| 避免频繁 `filters` | 滤镜开销大，静态对象可 `cacheAsBitmap` + 滤镜 |
| `ticker.maxFPS` | 非游戏场景限制帧率，减少 CPU/GPU 负担 |
| `visible = false` | 隐藏对象不参与渲染，比 `alpha = 0` 更高效 |
| `destroy({ children: true })` | 销毁时级联销毁子对象，释放纹理和内存 |

```javascript
// ParticleContainer 示例（大批量同类精灵）
import { ParticleContainer } from 'pixi.js';

const particles = new ParticleContainer(1000, {
  position: true,
  rotation: true,
  alpha: true,
});
app.stage.addChild(particles);

// 向粒子容器添加大量精灵（仅支持基础属性）
for (let i = 0; i < 1000; i++) {
  const p = new Sprite(particleTexture);
  p.x = Math.random() * 800;
  p.y = Math.random() * 600;
  particles.addChild(p);
}
```

**完整游戏制作**：见下方实践项目

---

## 🕹️ 实践项目：飞机大战

**功能清单**（覆盖全部核心 API）：
- 键盘/触摸控制战机移动（事件 + Ticker 动画）
- 敌机波次生成（定时器 + 对象池）
- 子弹发射与回收（对象池 + Ticker）
- 碰撞检测（距离公式 + 爆炸粒子 `Graphics`）
- 分数与生命值 UI（`Text` 动态更新）
- 开始/结束场景（`Container` 切换显示）
- 加分项：音效（`HTMLAudioElement`）、移动端适配

**项目结构建议**：
```
/js
  main.js        // 初始化应用，启动游戏循环
  Player.js      // 玩家类，封装移动、射击
  Enemy.js       // 敌机类，自动下落
  Bullet.js      // 子弹类，对象池静态方法
  Explosion.js   // 粒子特效
  UI.js          // 分数、生命值
  pool.js        // 通用对象池
```

**制作时间**：5~7 天（每天 1-2 小时），可与模块 7 合并进行。

---

## 🐛 常见问题与调试技巧

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 图片加载后显示空白 | 纹理尺寸不是 2 的幂次方（如 300×300） | 使用 256×256 / 512×512 等尺寸，或用 TexturePacker 自动处理 |
| 点击事件不触发 | 未设置 `eventMode`，默认 `'passive'` 不响应交互 | 设置 `sprite.eventMode = 'static'` 或 `'dynamic'` |
| `Assets.load()` 返回 undefined | 路径错误或资源未部署 | 检查路径是否相对于 `index.html`，用 DevTools Network 面板查看 404 |
| 对象池中的精灵位置残留 | 回收时未重置位置 | 在 `release()` 中重置 `x, y, rotation, alpha, visible` |
| 文字渲染模糊 | Text 分辨率不足 | 创建时设置 `{ resolution: 2 }` 或使用 `BitmapText` |
| `destroy()` 后报错 | 销毁后仍被引用 | 销毁前从对象池/数组中移除引用，或用 `sprite.destroyed` 判断 |
| 移动端触摸无响应 | 使用了 `click` 而非 `pointertap` | PixiJS 推荐用 `pointertap`（兼容鼠标和触摸） |

**调试工具**：
- **PixiJS DevTools**：Chrome 扩展，查看场景树、实时调整属性
- **`app.renderer.extract.canvas(stage)`**：将当前帧导出为 Canvas，方便截图调试
- **`console.log(app.stage.children)`**：快速查看舞台子对象数量，排查内存泄漏

---

## 🗓️ 总时间线（每天 1-2 小时）

| 时间段 | 内容 | 积累成果 |
|--------|------|----------|
| 第 1-2 天 | 模块 1+2+3 | 环境搭建、场景图、v8 绘图 API |
| 第 3-4 天 | 模块 4+5 | 加载图片、图集、动画循环 |
| 第 5 天 | 模块 6 | 事件系统、eventMode 五种模式 |
| 第 6-7 天 | 模块 7a | 碰撞检测、对象池 |
| 第 8-9 天 | 模块 7b | 遮罩、滤镜、性能优化 |
| 第 10-14 天 | 飞机大战开发 + 优化 | 碰撞、对象池、粒子特效、项目完善 |

---

## ✅ 完成标准
- 能脱离文档写出 v8 初始化、加载资源、创建精灵、绑定事件、帧循环代码
- 能解释 PixiJS 相比原生 Canvas 的优势（无需手动重绘、事件系统、纹理批处理、对象管理）
- 能说清 PixiJS vs Phaser vs Three.js 的选型差异（面试常问"为什么选 PixiJS"）
- 能说清 v8 的 `eventMode` 五种模式及其适用场景
- 可演示 1942 风格飞机大战，代码结构清晰，有对象池、粒子特效和性能优化
- 面试时能对任何核心 API 说出"是什么、为什么用它、怎么用"

完成这份大纲后，你即可在简历上自信地写上："**熟练掌握 PixiJS v8，有完整的 2D 游戏开发经验，理解场景图、对象池与渲染优化**"。
