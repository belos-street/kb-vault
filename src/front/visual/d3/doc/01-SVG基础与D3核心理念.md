# 01 - SVG 基础与 D3 核心理念

> 对应大纲模块 1 | 预计时间：1 天
> 面试可答：D3 的核心是数据驱动 DOM，`selectAll + data + enter` 是灵魂三件套。

---

## 1. SVG 热身

D3 最常用的渲染目标是 SVG，所以在学 D3 之前，先花 30 分钟把 SVG 的基本元素过一遍。

### 1.1 为什么用 SVG 而不是 Canvas？

| 维度 | SVG | Canvas |
|------|-----|--------|
| 类型 | 矢量图（DOM 元素） | 位图（像素画布） |
| 可交互 | 天然支持（每个元素都是 DOM 节点） | 需要手动计算坐标命中 |
| 适合场景 | 数据图表、少量元素（< 1000） | 游戏、大量粒子（> 1000） |
| 缩放 | 无损缩放 | 放大会模糊 |
| 事件绑定 | 直接 `addEventListener` | 需要自己实现命中检测 |

D3 选择 SVG 作为主要渲染方式，是因为**数据图表通常元素少、交互多**，SVG 的 DOM 模型天然适合数据驱动。

### 1.2 SVG 基本元素

#### rect — 矩形

```html
<svg width="400" height="300">
  <rect x="50" y="50" width="200" height="100"
        fill="#4A90D9" stroke="#333" stroke-width="2" rx="8" />
</svg>
```

`rx` 控制圆角。

#### circle — 圆

```html
<circle cx="200" cy="150" r="60" fill="tomato" />
```

注意是 `cx/cy`（圆心坐标），不是 `x/y`。

#### ellipse — 椭圆

```html
<ellipse cx="200" cy="150" rx="100" ry="60" fill="orange" />
```

#### line — 线段

```html
<line x1="50" y1="50" x2="350" y2="250" stroke="#333" stroke-width="2" />
```

#### text — 文字

```html
<text x="200" y="150" text-anchor="middle" font-size="20" fill="#333">
  Hello SVG
</text>
```

`text-anchor` 控制文字对齐方式：`start` / `middle` / `end`。

#### path — 路径

```html
<path d="M50,150 L150,50 L250,200 L350,100" stroke="#4A90D9" fill="none" stroke-width="2" />
```

`d` 属性是路径指令：
- `M x,y` — 移动到（MoveTo）
- `L x,y` — 画直线到（LineTo）
- `C` — 贝塞尔曲线
- `Z` — 闭合路径

**面试常问**：D3 的折线图就是用 `path` + `d3.line()` 自动生成这个 `d` 属性。

#### g — 分组

```html
<g transform="translate(100, 50)">
  <rect width="100" height="60" fill="#4A90D9" />
  <text x="50" y="35" text-anchor="middle" fill="white">Group</text>
</g>
```

`g` 本身不显示，用于**逻辑分组和整体变换**。D3 的坐标轴、图例都是用 `g` 组织的。

#### viewBox — 响应式缩放

```html
<svg width="600" height="400" viewBox="0 0 300 200">
  <!-- 内部坐标系是 300x200，但显示在 600x400 的区域内，等比缩放 -->
</svg>
```

`viewBox` 让 SVG 实现响应式——内部坐标独立于显示尺寸。

### 1.3 SVG 样式属性速查

| 属性 | 说明 | 示例 |
|------|------|------|
| `fill` | 填充色 | `#4A90D9`、`rgba(0,0,0,0.5)` |
| `stroke` | 描边色 | `#333` |
| `stroke-width` | 描边宽度 | `2` |
| `stroke-dasharray` | 虚线 | `6,3`（6px 实线 + 3px 间隔） |
| `opacity` | 透明度 | `0~1` |
| `transform` | 变换 | `translate(10,20) rotate(45) scale(2)` |

---

## 2. D3.js 是什么

D3（**D**ata-**D**riven **D**ocuments）是一个 JavaScript 可视化库，核心理念只有一句话：

> **把数据映射到 DOM 元素的属性上。**

和 ECharts 等"开箱即用"的图表库不同，D3 不提供现成的柱状图/折线图组件，而是提供**底层工具**（选择器、比例尺、形状生成器、过渡动画），让你从零组装出任何你想要的可视化效果。

### D3 的定位

```
ECharts / Chart.js        D3              原生 SVG/Canvas
  高层开箱即用           底层工具库            手动操作像素/属性
  配置驱动              数据驱动              硬编码
  标准图表              任意可视化             无抽象层
```

**面试回答**：D3 是底层工具库，它不替你决定画什么图表，而是给你选择器、比例尺、形状生成器等积木，让你自由拼装。适合**高度定制化**的可视化需求。如果是标准的业务图表（柱状图、折线图），ECharts 更高效。

---

## 3. D3 的核心模型

D3 的工作流可以用一个公式概括：

```
数据  →  比例尺映射  →  DOM 元素属性
```

举个例子，要把 `[10, 20, 30, 40, 50]` 映射为 5 个高度不同的柱子：

```
数据: [10, 20, 30, 40, 50]
     ↓
比例尺: scaleLinear([0, 50], [0, 300])
     ↓
像素: [60, 120, 180, 240, 300]
     ↓
DOM: <rect height="60"> <rect height="120"> ...
```

**这个"数据 → 映射 → DOM"的流程，是 D3 所有功能的根基。** 模块 2（数据绑定）和模块 3（比例尺）就是拆开讲这个流程的两个阶段。

---

## 4. 选择器

D3 的选择器 API 借鉴了 jQuery，但有一个关键区别：**D3 的选择器可以绑定数据**。

### 4.1 `d3.select()` — 选一个

```js
d3.select('body')                    // CSS 选择器
d3.select('#chart')                  // 选 id
d3.select('.bar')                    // 选 class
d3.select(document.querySelector('#chart'))  // 传 DOM 元素
```

返回一个**单元素选择集**（Selection），即使匹配多个也只取第一个。

### 4.2 `d3.selectAll()` — 选多个

```js
d3.selectAll('.bar')                 // 选所有 .bar
d3.selectAll('rect')                 // 选所有 rect
```

返回一个**多元素选择集**。

### 4.3 Selection 常用方法

```js
const svg = d3.select('#chart')

// 创建元素
svg.append('rect')                   // 在 #chart 内部追加一个 rect

// 设置属性
svg.attr('width', 600)               // 设置属性
svg.attr('fill', 'tomato')

// 设置样式
svg.style('background', '#f5f5f5')   // 设置内联样式

// 设置文本
svg.text('Hello D3')                 // 设置文本内容

// 事件绑定
svg.on('click', (event) => {
  console.log(event)                 // D3 v7：事件通过参数传递
})

// 子选择
svg.selectAll('rect')                // 在选择集内部查找
svg.select('rect')                   // 只取第一个
```

### 4.4 链式调用

D3 的 Selection 方法都返回 Selection 本身，支持链式调用：

```js
d3.select('#chart')
  .append('svg')
    .attr('width', 600)
    .attr('height', 400)
  .append('rect')
    .attr('x', 50)
    .attr('y', 50)
    .attr('width', 200)
    .attr('height', 100)
    .attr('fill', '#4A90D9')
```

这种写法非常常见，读的时候注意**缩进层级**——`append` 之后的链式操作是针对新 append 的元素。

---

## 5. 创建一个完整的 D3 图表

### 5.1 安装

```html
<!-- CDN -->
<script src="https://d3js.org/d3.v7.min.js"></script>
```

### 5.2 基础结构

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
  <div id="chart"></div>
  <script>
    const data = [10, 20, 30, 40, 50]

    const svg = d3.select('#chart')
      .append('svg')
        .attr('width', 500)
        .attr('height', 300)

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
        .attr('x', (d, i) => i * 80 + 30)
        .attr('y', (d) => 300 - d * 5)
        .attr('width', 60)
        .attr('height', (d) => d * 5)
        .attr('fill', '#4A90D9')
  </script>
</body>
</html>
```

这段代码做了什么？逐行拆解：

```js
svg.selectAll('rect')   // 1. 选中所有 rect（目前是 0 个）
  .data(data)           // 2. 绑定数据 [10, 20, 30, 40, 50]
  .enter()              // 3. 进入"数据多于元素"的分支（5 个数据 vs 0 个元素）
  .append('rect')       // 4. 为每个"多出来"的数据创建一个 rect
```

**这就是 D3 的灵魂：`selectAll + data + enter`。**

目前看不懂没关系，模块 2 会专门讲 `enter/update/exit` 模式。这里只需要记住：**D3 是先绑定数据，再根据数据创建/更新/删除元素**。

---

## 6. 练习：用 D3 创建 10 个不同颜色的圆

### 6.1 目标

创建 10 个圆，水平排列，每个颜色不同。

### 6.2 代码

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
  <div id="chart"></div>
  <script>
    const colors = [
      '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#1ABC9C',
      '#3498DB', '#9B59B6', '#34495E', '#95A5A6', '#E91E63'
    ]

    const svg = d3.select('#chart')
      .append('svg')
        .attr('width', 600)
        .attr('height', 100)

    svg.selectAll('circle')
      .data(colors)
      .enter()
      .append('circle')
        .attr('cx', (d, i) => i * 60 + 30)
        .attr('cy', 50)
        .attr('r', 20)
        .attr('fill', (d) => d)
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
  </script>
</body>
</html>
```

### 6.3 关键点

- `data(colors)` — 数组里有 10 个颜色值，所以会创建 10 个 circle
- `(d, i) => i * 60 + 30` — `d` 是当前数据值（颜色字符串），`i` 是索引
- `.attr('fill', (d) => d)` — 直接用数据值作为颜色

**`d` 和 `i` 是 D3 最常用的回调参数**，几乎所有属性设置都会用到。`d` 是绑定的数据，`i` 是在选择集中的索引。

---

## 7. 面试高频问题

### Q1：D3 的核心是什么？

D3 的核心是**数据驱动 DOM**——通过 `selectAll + data + enter` 将数据绑定到 DOM 元素，再通过比例尺将数据值映射为视觉属性（位置、大小、颜色）。整个流程是：数据 → 比例尺映射 → DOM 属性。

### Q2：D3 和 ECharts 的区别？

D3 是**底层工具库**，提供选择器、比例尺、形状生成器等积木，自由度极高但学习成本也高。ECharts 是**高层图表库**，通过配置项就能生成标准图表，开箱即用。选型标准：高度定制用 D3，标准业务图表用 ECharts。

### Q3：D3 的 `select` 和原生 `querySelector` 有什么区别？

`d3.select()` 返回的是 D3 的 **Selection 对象**，它封装了数据绑定（`data()`）、元素创建（`append()`）、属性设置（`attr()`）、事件绑定（`on()`）等方法。原生 `querySelector` 返回的是 DOM 元素，没有这些能力。D3 的选择器是**数据绑定的入口**，原生选择器只是查询 DOM。

---

## 📝 面试回答模板

> **问：介绍一下 D3.js？**
>
> D3（Data-Driven Documents）是一个数据驱动的可视化库，核心理念是把数据映射到 DOM 元素的属性上。和 ECharts 不同，D3 不提供现成的图表组件，而是提供选择器、比例尺、形状生成器、过渡动画等底层工具，让开发者自由组装出任意可视化效果。适合高度定制的场景，比如力导向图、地理可视化、复杂交互图表。
