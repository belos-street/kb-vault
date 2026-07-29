# 09 - 变换（Transform）

> 对应大纲模块 9 | 预计时间：1-2 天
> 面试可答：transform 不改变文档流、只影响视觉呈现，走合成线程不触发重排；3D 变换靠 perspective 提供景深，`transform-style: preserve-3d` 让子元素保持 3D 位置。

---

## 学习目标

- 掌握 2D 变换（translate/rotate/scale/skew）与变换顺序
- 理解 transform-origin 与百分比参照物
- 掌握 3D 变换（perspective/preserve-3d/backface-visibility）
- 理解 transform 的合成层性能优势
- 能用纯 CSS 实现 3D 卡片翻转、立方体等效果

---

## 核心概念

### 1. 2D 变换

```css
.box {
  transform: translate(50px, 100px);  /* 平移：x, y */
  transform: translateX(50px);        /* 仅水平 */
  transform: rotate(45deg);           /* 旋转：正数顺时针 */
  transform: scale(1.5);              /* 缩放：1.5 倍（可分别 x,y） */
  transform: scale(2, 0.5);           /* x 放大 2 倍，y 压缩一半 */
  transform: skew(30deg, 20deg);      /* 倾斜 */
}
```

#### 关键认知：transform 不影响文档流

```css
/* transform 只改变"视觉呈现"，不改变布局位置 */
/* 元素移动后，它原本占据的空间仍被保留，周围元素不受影响 */
.moved { transform: translateX(100px); } /* 视觉上右移，但不影响兄弟元素 */
```

这与 `position: relative` + `left` 类似，但 transform 性能更好（走合成线程）。

#### 变换顺序很重要

```css
/* transform 函数从右往左依次应用（或者说，坐标系逐步变换） */

/* 先平移后旋转：元素在新位置原地旋转 */
.a { transform: translateX(100px) rotate(45deg); }

/* 先旋转后平移：元素沿"旋转后的坐标系"移动 → 斜着走 */
.b { transform: rotate(45deg) translateX(100px); }
```

**理解方式**：每个变换都在改变元素的局部坐标系，后续变换基于已变换的坐标系。`rotate` 后 `translateX` 会沿着旋转后的 x 轴（斜方向）移动。

#### transform-origin 变换基点

```css
/* 默认基点是元素中心（50% 50%） */
.box { transform-origin: center; }

/* 改为左上角旋转 */
.box { transform-origin: top left; }      /* 关键字 */
.box { transform-origin: 0 0; }          /* 坐标 */
.box { transform-origin: 100% 100%; }    /* 右下角 */

/* scale 从底部向上放大（进度条、评分条常用） */
.bar { transform-origin: bottom; transform: scaleY(0.5); }
```

#### 百分比参照物（居中技巧）

```css
/* translate 的百分比相对"元素自身尺寸"（不是父元素！） */
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 相对自身宽高偏移一半 → 精确居中 */
}
```

**这是经典居中方案**：top/left 50% 定位到父元素中心（相对父），再用 translate(-50%, -50%) 把元素自身往回挪一半（相对自身），实现任意尺寸元素的精确居中。

### 2. 3D 变换

#### perspective 景深

```css
/* perspective 提供"观察者距离"，值越小透视越强（近大远小越明显） */
.stage {
  perspective: 800px;  /* 观察距离 800px */
}
.card {
  transform: rotateY(45deg);  /* 有透视的 3D 旋转 */
}
```

**没有 perspective 时**，rotateY 看起来只是平面压缩（正交投影）；有 perspective 才有真实的近大远小。

```css
/* perspective 两种写法 */
/* 1. 父元素 perspective 属性（影响所有子元素，共享同一视点） */
.parent { perspective: 800px; }

/* 2. transform 内的 perspective() 函数（每个元素独立视点） */
.child { transform: perspective(800px) rotateY(45deg); }
```

**区别**：父元素 `perspective` 让所有子元素共享一个视点（像看一面墙）；`perspective()` 函数让每个元素有自己的视点（像各自独立旋转）。网格排列的多个卡片用父元素 perspective 更真实。

#### perspective-origin 视点位置

```css
/* 默认从正前方看（center），可以改变视角 */
.stage {
  perspective: 800px;
  perspective-origin: top left; /* 从左上角俯视 */
}
```

#### 3D 旋转与位移

```css
.box {
  transform: rotateX(45deg);   /* 绕 x 轴（上下翻转感） */
  transform: rotateY(45deg);   /* 绕 y 轴（左右翻转感） */
  transform: rotateZ(45deg);   /* 绕 z 轴（= 2D rotate） */
  transform: translateZ(100px);/* 沿 z 轴向观察者靠近（需 perspective） */
  transform: rotate3d(1, 1, 0, 45deg); /* 绕自定义轴 */
}
```

#### transform-style: preserve-3d

```css
/* 默认情况下，子元素会被"压平"到父元素的平面（flat） */
/* preserve-3d 让子元素保持自己的 3D 位置 */

.cube {
  transform-style: preserve-3d; /* 关键！让六个面保持 3D 空间 */
  transform: rotateX(-30deg) rotateY(45deg);
}
.cube .face {
  position: absolute;
  /* 每个面通过 rotate + translateZ 摆到对应位置 */
}
```

**没有 preserve-3d**，子元素的 3D 变换会被扁平化，立方体就"散架"了。

#### backface-visibility 背面可见性

```css
/* 元素背面（旋转超过 90° 后）默认是可见的（镜像显示） */
/* backface-visibility: hidden 让背面不可见 → 卡片翻转的基础 */
.card-face {
  backface-visibility: hidden;
}
```

### 3. 变换的性能：合成层

```css
/* transform 和 opacity 是仅有的两个"纯合成"属性 */
/* 它们的动画在合成线程（Compositor Thread）完成，不经过 Layout 和 Paint */

/* ❌ 触发重排（Layout）→ 慢 */
.bad { left: 100px; width: 200px; }

/* ❌ 触发重绘（Paint）→ 较慢 */
.worse { background: red; box-shadow: ...; }

/* ✅ 仅合成（Composite）→ 快，60fps */
.good { transform: translateX(100px); opacity: 0.5; }
```

#### will-change 的利与弊

```css
/* will-change 提前告知浏览器"这个元素要变了"，让它提升为合成层 */
.element { will-change: transform; }

/* ⚠️ 副作用：每个合成层都占用内存（位图缓存） */
/* 不要给大量元素加 will-change，用完移除 */
```

**正确用法**：只在确实需要的高频动画元素上使用，或用 `transform: translateZ(0)` 作为轻量 hack。

### 4. 经典场景

#### 任意尺寸元素居中

```css
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

#### 3D 卡片翻转

```css
.flip-card { perspective: 1000px; }
.flip-inner {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}
.flip-card:hover .flip-inner { transform: rotateY(180deg); }

.flip-front, .flip-back {
  position: absolute;
  backface-visibility: hidden; /* 背面不可见 */
}
.flip-back { transform: rotateY(180deg); } /* 背面预先翻转 */
```

#### 纯 CSS 立方体

```css
.cube {
  width: 200px; height: 200px;
  transform-style: preserve-3d;
  animation: spin 8s linear infinite;
}
.face {
  position: absolute;
  width: 200px; height: 200px;
  opacity: 0.9;
}
/* 六个面：旋转后沿 z 轴推出半边长（100px） */
.front  { transform: translateZ(100px); }
.back   { transform: rotateY(180deg) translateZ(100px); }
.right  { transform: rotateY(90deg) translateZ(100px); }
.left   { transform: rotateY(-90deg) translateZ(100px); }
.top    { transform: rotateX(90deg) translateZ(100px); }
.bottom { transform: rotateX(-90deg) translateZ(100px); }

@keyframes spin {
  from { transform: rotateX(-30deg) rotateY(0); }
  to   { transform: rotateX(-30deg) rotateY(360deg); }
}
```

**立方体的核心**：每个面先旋转到朝向对应方向，再 `translateZ(半边长)` 推出去。

#### 视差滚动（translateZ + scale 补偿）

```css
.parallax {
  perspective: 1px;
  overflow-y: auto;
  height: 100vh;
}
.layer-back {
  transform: translateZ(-1px) scale(2); /* 更远 → 移动更慢，scale 补偿尺寸 */
}
.layer-front { transform: translateZ(0); }
```

---

## 常见踩坑点

### 坑 1：变换顺序导致结果不符预期

```css
/* ❌ 想"移到右边再旋转"，但写反了 */
.box { transform: rotate(45deg) translateX(100px); } /* 沿斜方向移动 */

/* ✅ 先平移后旋转 */
.box { transform: translateX(100px) rotate(45deg); }
```

### 坑 2：3D 变换子元素被压平

```css
/* ❌ 忘了 preserve-3d，立方体的面全挤在一个平面 */
.cube { transform: rotateY(45deg); }

/* ✅ 必须加 preserve-3d */
.cube { transform-style: preserve-3d; }
```

### 坑 3：perspective 加错位置

```css
/* ❌ perspective 加在旋转元素自身（无效，perspective 影响子元素） */
.card { perspective: 800px; transform: rotateY(45deg); }

/* ✅ 加在父元素，或用 perspective() 函数 */
.stage { perspective: 800px; }
.card { transform: rotateY(45deg); }
/* 或 */
.card { transform: perspective(800px) rotateY(45deg); }
```

### 坑 4：transform 创建了意外的层叠上下文

```css
/* ❌ 给 fixed 元素的祖先加 transform，fixed 退化为相对该祖先定位 */
.wrapper { transform: translateX(0); }
.fixed-nav { position: fixed; } /* 不再相对视口！ */

/* 这是 transform 的副作用（创建包含块），需注意 */
```

### 坑 5：will-change 滥用导致内存暴涨

```css
/* ❌ 给所有元素加 will-change */
* { will-change: transform; } /* 每个元素都创建合成层 → 内存爆炸 */

/* ✅ 只给真正需要的高频动画元素 */
.animated-hero { will-change: transform; }
```

---

## 面试高频问题

### Q1：transform 有哪些函数？translate 的百分比相对谁？

**答**：2D 有 translate（平移）、rotate（旋转）、scale（缩放）、skew（倾斜），3D 还有 rotateX/Y/Z、translateZ、rotate3d 等。translate 的百分比相对元素自身尺寸（不是父元素），这个特性配合 top: 50% + left: 50% 可以实现任意尺寸元素的精确居中。transform 只改变视觉呈现，不影响文档流，周围元素不受影响。

### Q2：transform 的书写顺序有影响吗？

**答**：有。transform 的多个函数从右往左依次应用，每个变换都在改变元素的局部坐标系。比如 translateX(100px) rotate(45deg) 是先平移到新位置再原地旋转；而 rotate(45deg) translateX(100px) 是先旋转，再沿着旋转后的 x 轴（斜方向）移动。顺序不同结果完全不同。

### Q3：怎么实现 3D 效果？perspective 和 preserve-3d 的作用？

**答**：3D 变换需要三个要素。perspective 提供景深（观察者距离），值越小近大远小越明显，可以加在父元素（共享视点）或用 perspective() 函数（独立视点）。transform-style: preserve-3d 让子元素保持自己的 3D 位置而不被压平到父平面，做立方体、卡片翻转必须加。backface-visibility: hidden 让元素背面不可见，是卡片翻转的基础。

### Q4：为什么 transform 动画性能好？

**答**：浏览器渲染流水线是 JS → Style → Layout（重排）→ Paint（重绘）→ Composite（合成）。transform 和 opacity 是仅有的两个只在合成阶段处理的属性，它们的动画由合成线程（GPU）完成，不触发 Layout 和 Paint，所以能稳定 60fps。而动画 left/top 会触发重排，动画 background 会触发重绘，都慢得多。这就是"只动画 transform/opacity"原则的原因。

### Q5：will-change 是什么？要注意什么？

**答**：will-change 提前告知浏览器某元素将发生变化，让它预先提升为合成层，避免动画开始时的层创建开销。但要注意副作用：每个合成层都会把元素渲染成位图缓存在内存中，大量使用会导致内存暴涨。所以只给真正需要的高频动画元素使用，动画结束后可以移除，不要全局滥用。

### Q6：transform 有什么副作用？

**答**：transform 会创建新的层叠上下文和包含块。两个典型影响：一是元素内部的 z-index 被限制在这个上下文内（z-index 失效的常见原因）；二是 fixed 定位的后代会退化为相对这个 transform 祖先定位，而不是视口。所以给 fixed 元素的祖先加 transform 要特别小心。

---

## 面试回答模板

> **问：介绍一下 CSS transform？**
>
> transform 用于对元素做平移、旋转、缩放、倾斜等变换，分 2D 和 3D。它只改变视觉呈现，不影响文档流。几个关键点：一是变换顺序从右往左应用，顺序不同结果不同；二是 translate 的百分比相对自身尺寸，配合 50% 定位可以精确居中；三是 3D 变换需要 perspective 提供景深、preserve-3d 保持子元素 3D 位置、backface-visibility 控制背面。最重要的是性能——transform 走合成线程，不触发重排重绘，是动画的首选属性。
>
> **追问：为什么动画推荐用 transform 而不是 left/top？**
>
> 因为渲染流水线不同。动画 left/top 每帧都要重新 Layout（计算位置）和 Paint（重绘），在主线程执行，容易掉帧。而 transform 只是把已渲染的图层做仿射变换，由合成线程在 GPU 上完成，跳过了 Layout 和 Paint，所以能稳定 60fps。这就是为什么位移用 translate、缩放用 scale、透明度用 opacity，而不是改 width/left/background。

---

## 练习

### 练习 1：3D 卡片翻转

**要求**：用 preserve-3d + backface-visibility 实现悬停 3D 翻转卡片（正面→背面）

**提示**：外层 perspective，内层 preserve-3d + rotateY(180deg)，正反面都设 backface-visibility: hidden，背面预先 rotateY(180deg)

**预期效果**：悬停时卡片立体翻转到背面，背面内容正常显示（非镜像），有真实景深

```css
.flip-card { perspective: 1000px; width: 300px; height: 200px; }
.flip-inner {
  position: relative; width: 100%; height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}
.flip-card:hover .flip-inner { transform: rotateY(180deg); }
.flip-front, .flip-back {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  display: grid; place-items: center;
}
.flip-front { background: #e0e7ff; }
.flip-back { background: #4f46e5; color: white; transform: rotateY(180deg); }
```

### 练习 2：纯 CSS 立方体

**要求**：用纯 CSS 实现一个旋转的 3D 立方体（六面体）

**提示**：preserve-3d + 六个面各自 rotate 后 translateZ(半边长)，外层加旋转动画

**预期效果**：一个六面不同颜色的立方体持续旋转，有真实透视（近大远小）

```css
.scene { perspective: 800px; width: 200px; height: 200px; }
.cube {
  width: 100%; height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: spin 8s linear infinite;
}
.face {
  position: absolute; width: 200px; height: 200px;
  opacity: 0.85; border: 2px solid #fff;
}
.front  { background: #ef4444; transform: translateZ(100px); }
.back   { background: #3b82f6; transform: rotateY(180deg) translateZ(100px); }
.right  { background: #22c55e; transform: rotateY(90deg) translateZ(100px); }
.left   { background: #eab308; transform: rotateY(-90deg) translateZ(100px); }
.top    { background: #a855f7; transform: rotateX(90deg) translateZ(100px); }
.bottom { background: #06b6d4; transform: rotateX(-90deg) translateZ(100px); }
@keyframes spin {
  from { transform: rotateX(-30deg) rotateY(0deg); }
  to   { transform: rotateX(-30deg) rotateY(360deg); }
}
```

### 练习 3：translate 居中 vs margin auto

**要求**：分别用 translate(-50%,-50%) 和 margin: auto 实现绝对定位元素居中，对比适用场景

**提示**：translate 不需要知道元素尺寸；margin auto 需要元素有确定宽高（或 inset: 0）

**预期效果**：两种都能居中；能说出 translate 适合未知尺寸元素、margin auto 适合已知尺寸或 inset: 0 场景

```css
/* 方案 A：translate（适合未知尺寸） */
.a { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* 方案 B：margin auto（需要 inset: 0 + 确定尺寸） */
.b { position: absolute; inset: 0; margin: auto; width: 200px; height: 100px; }
```

---

## 本模块完成标准

- [ ] 能解释变换顺序的影响（先平移后旋转 vs 先旋转后平移）
- [ ] 能用 translate(-50%, -50%) 实现任意尺寸元素居中
- [ ] 能说出 perspective 的两种写法与 preserve-3d 的作用
- [ ] 能用纯 CSS 实现 3D 卡片翻转和立方体
- [ ] 能解释 transform 走合成线程的性能原理
- [ ] 知道 transform 创建层叠上下文/包含块的副作用
