# 06 - Grid 布局

> 对应大纲模块 6 | 预计时间：2-3 天
> 面试可答：Grid 是二维布局，用 `grid-template-areas` 做语义化布局、`auto-fit + minmax` 做响应式网格；subgrid 让子元素对齐父网格轨道（Baseline 2023-09）。

---

## 学习目标

- 理解网格模型（行/列/轨道/区域/网格线）
- 掌握 repeat() / fr / minmax() / auto-fill vs auto-fit
- 熟练使用 grid-template-areas 做语义化布局
- 掌握 subgrid 解决跨卡片对齐问题
- 能用 Grid 实现响应式网格、栅格系统、仪表盘

---

## 核心概念

### 1. 网格模型术语

```
网格容器（Grid Container）
├── 网格线（Grid Line）：编号 1, 2, 3...（负数从末尾 -1）
├── 网格轨道（Grid Track）：两条相邻网格线之间的行或列
├── 网格单元（Grid Cell）：最小的格子（一行一列交叉）
└── 网格区域（Grid Area）：多个单元组成的矩形区域

    1     2     3     4    ← 列网格线
  ┌─────┬─────┬─────┐  1
  │     │     │     │
  ├─────┼─────┼─────┤  2
  │     │     │     │
  ├─────┼─────┼─────┤  3
  │     │     │     │
  └─────┴─────┴─────┘  4
```

### 2. 定义网格

```css
.container {
  display: grid;

  /* 显式定义 3 列：200px、剩余空间、100px */
  grid-template-columns: 200px 1fr 100px;

  /* 显式定义 2 行，各 150px */
  grid-template-rows: 150px 150px;

  gap: 16px; /* 网格间距 */
}
```

#### fr 单位（fraction，剩余空间份数）

```css
/* 1fr 2fr 1fr：剩余空间按 1:2:1 分配 */
.container { grid-template-columns: 1fr 2fr 1fr; }

/* 固定 + fr 混用：先扣除固定，剩余按 fr 分 */
.container { grid-template-columns: 200px 1fr; }
```

**fr 的本质**：分配的是"扣除固定尺寸后的剩余空间"，不是容器总宽。

#### repeat() 简写

```css
/* 3 列等宽 */
grid-template-columns: repeat(3, 1fr);

/* 重复模式：100px 200px 交替 */
grid-template-columns: repeat(2, 100px 200px); /* = 100px 200px 100px 200px */
```

#### minmax() 与 auto-fill / auto-fit（响应式网格核心）

```css
/* 每列最小 200px、最大 1fr，自动填充尽可能多的列 */
.responsive {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
```

**这是"零媒体查询响应式网格"的标准写法**——容器变宽自动增加列数，变窄自动减少。

#### auto-fill vs auto-fit

```css
/* auto-fill：尽可能多放列，空列保留（占位） */
grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));

/* auto-fit：折叠空列，让现有项目拉伸填满 */
grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
```

**差异**：项目少、容器宽时——auto-fill 保留空轨道（项目不拉伸），auto-fit 折叠空轨道（项目拉伸填满）。**项目足够多时两者表现一致**，日常用 auto-fit 更多。

```
auto-fill（项目少时）: [1][2][空][空][空]   项目不拉伸
auto-fit （项目少时）: [  1  ][  2  ]       项目拉伸填满
```

#### 隐式网格与 dense

```css
.container {
  grid-auto-rows: 100px;      /* 隐式行（超出显式定义的行）的高度 */
  grid-auto-flow: dense;      /* 密集填充：回头填补空洞 */
}
```

`grid-auto-flow: dense` 会让小项目回头填补大项目留下的空洞，适合瀑布流/相册（但会打乱视觉顺序，注意可访问性）。

### 3. 放置项目

#### 网格线编号

```css
.item {
  grid-column: 1 / 3;  /* 从第 1 列线到第 3 列线（跨 2 列） */
  grid-row: 1 / 2;     /* 第 1 行 */
}

/* span 语法：跨几个 */
.item { grid-column: span 2; } /* 跨 2 列 */

/* 负数：从末尾数 */
.item { grid-column: 1 / -1; } /* 从第 1 列到最后（整行） */
```

#### grid-template-areas（语义化布局神器）

```css
.dashboard {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "sidebar header"
    "sidebar main"
    "sidebar footer";
  gap: 12px;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

**优势**：布局结构一目了然，改布局只需改 areas 字符串（响应式重排特别方便）。

```css
/* 移动端：areas 重排为单列 */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
  }
}
```

**规则**：areas 必须是矩形，空位用 `.` 占位。

### 4. 对齐

```css
.container {
  /* 单元格内对齐（项目在自己格子里的位置） */
  justify-items: center;  /* 水平（行轴） */
  align-items: center;    /* 垂直（块轴） */
  place-items: center;    /* 简写：align / justify */

  /* 整个网格在容器内的对齐（网格小于容器时） */
  justify-content: center;
  align-content: center;
  place-content: center;
}

/* 单个项目覆盖 */
.item {
  justify-self: end;
  align-self: start;
  place-self: start end;
}
```

**记忆**：带 `-items` 的管所有项目，带 `-self` 的管单个项目，`justify` 管行轴（水平），`align` 管块轴（垂直）。

### 5. subgrid（Baseline 2023-09）

**问题**：Grid 的子元素默认创建自己的网格，无法对齐父网格的轨道。

```html
<div class="cards">          <!-- 父网格 -->
  <div class="card">         <!-- 子元素 -->
    <h3>标题</h3>
    <p>描述内容，长短不一...</p>
    <button>按钮</button>
  </div>
  <!-- 多个卡片 -->
</div>
```

**需求**：让所有卡片的"标题行/描述行/按钮行"跨卡片对齐。

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.card {
  display: grid;
  grid-template-rows: subgrid; /* 继承父网格的行轨道 */
  grid-row: span 3;            /* 占据 3 行（标题/描述/按钮） */
  gap: 8px;
}
```

**subgrid 的价值**：子网格继承父网格的轨道定义，实现"卡片内部元素跨卡片对齐"——这是 Flex 和普通 Grid 都做不到的。

**兼容性**：Firefox 71（2019）、Safari 16（2022）、Chrome 117（2023-09），已 Baseline。

### 6. 经典场景

#### 响应式卡片网格（零媒体查询）

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
```

#### 12 栅格系统

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}
.col-6 { grid-column: span 6; }  /* 占 6 列 */
.col-4 { grid-column: span 4; }
.col-12 { grid-column: 1 / -1; } /* 整行 */
```

#### 仪表盘（areas 布局）

```css
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    "sidebar topbar"
    "sidebar content";
  height: 100vh;
}
```

#### 瀑布流（dense）

```css
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  grid-auto-rows: 100px;
  grid-auto-flow: dense;
}
.tall { grid-row: span 2; }  /* 高的占 2 行 */
.wide { grid-column: span 2; } /* 宽的占 2 列 */
```

### 7. Grid vs Flex 选型

| 维度 | Flex | Grid |
|------|------|------|
| 维度 | 一维（行或列） | 二维（行和列） |
| 驱动 | 内容驱动（内容决定布局） | 布局驱动（布局决定位置） |
| 对齐 | 主轴/交叉轴 | 行轴/块轴 + areas |
| 典型 | 导航、按钮组、居中 | 页面骨架、栅格、跨行跨列 |
| 换行对齐 | 弱（align-content 有限） | 强（天然二维） |

**实践**：两者常嵌套使用——Grid 搭页面骨架，每个区块内部用 Flex 排列内容。

---

## 常见踩坑点

### 坑 1：fr 不等于百分比

```css
/* ❌ 误以为 1fr = 33.3% */
grid-template-columns: 1fr 1fr 1fr;

/* fr 分配的是"剩余空间"，有 gap 时： */
/* 每列 = (容器宽 - 2×gap) / 3，而非 容器宽/3 */
/* 百分比 33.3% 会包含 gap 导致溢出 */
```

### 坑 2：auto-fill 项目不拉伸

```css
/* 项目少时 auto-fill 保留空轨道，项目不会拉伸填满 */
grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));

/* 想让项目拉伸填满，用 auto-fit */
grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
```

### 坑 3：grid-area 名字不生效

```css
/* ❌ areas 字符串里的名字和 grid-area 对不上 */
grid-template-areas: "head main";
.header { grid-area: header; } /* 名字不匹配！应该是 head */

/* ✅ 名字必须完全一致 */
.header { grid-area: head; }
```

### 坑 4：subgrid 没设 span 导致塌陷

```css
/* ❌ 用 subgrid 但没指定跨几行，子网格只有 1 行 */
.card { grid-template-rows: subgrid; }

/* ✅ 必须告诉父网格这个子元素占几行 */
.card {
  grid-template-rows: subgrid;
  grid-row: span 3; /* 占 3 行供 subgrid 继承 */
}
```

---

## 面试高频问题

### Q1：Grid 和 Flex 的区别？怎么选？

**答**：Flex 是一维布局，一次处理一个方向，是内容驱动——内容多少决定布局；Grid 是二维布局，同时控制行和列，是布局驱动——先定义网格再放内容。导航栏、按钮组、居中这类一维排列用 Flex；页面骨架、栅格系统、需要跨行跨列或行列同时对齐的用 Grid。实践中常嵌套：Grid 搭骨架，区块内部用 Flex。

### Q2：auto-fill 和 auto-fit 的区别？

**答**：两者都配合 minmax 做响应式网格，自动计算列数。区别在项目少、容器宽时：auto-fill 保留空轨道（项目不拉伸，留下空白），auto-fit 折叠空轨道（项目拉伸填满容器）。项目足够多填满容器时两者表现一致。日常想让项目拉伸填满用 auto-fit。

### Q3：fr 单位是什么？和百分比有什么区别？

**答**：fr 是 fraction，分配的是"扣除固定尺寸和 gap 后的剩余空间"的份数。1fr 2fr 就是按 1:2 分剩余空间。和百分比的区别：百分比相对容器总宽（含 gap，多列会溢出），fr 相对剩余空间（自动扣除 gap，不会溢出）。所以有 gap 的网格应该用 fr 而非百分比。

### Q4：grid-template-areas 有什么好处？

**答**：用 ASCII 字符串直观描述布局结构，每个区域命名后元素用 grid-area 对应。好处是布局一目了然、改布局只需改字符串（响应式重排时在媒体查询里重写 areas 即可）、语义清晰。规则是区域必须是矩形，空位用点占位。

### Q5：subgrid 解决了什么问题？

**答**：默认情况下 Grid 子元素会创建独立网格，无法对齐父网格的轨道。典型痛点是卡片列表——每张卡片内部的标题/描述/按钮高度不一，跨卡片对不齐。subgrid 让子网格继承父网格的轨道定义（grid-template-rows: subgrid 配合 grid-row: span N），实现卡片内部元素跨卡片严格对齐。2023-09 已 Baseline（Chrome 117）。

### Q6：怎么实现一个不用媒体查询的响应式网格？

**答**：用 `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`。minmax 保证每列最小 250px、最大拉伸到 1fr，auto-fit 自动计算能放几列并折叠空轨道。容器变宽自动增列、变窄自动减列，全程零媒体查询。这是现代响应式网格的标准写法。

---

## 面试回答模板

> **问：介绍一下 Grid 布局？**
>
> Grid 是二维布局系统，先在容器上定义行和列的轨道（grid-template-columns/rows），再把项目放进去。定义轨道常用 repeat() 简写、fr 分配剩余空间、minmax 设弹性范围。放置项目可以用网格线编号（grid-column: 1 / 3）、span 跨格、或 grid-template-areas 语义化命名区域。对齐用 place-items（单元格内）和 place-content（整个网格）。Grid 适合布局驱动的二维场景，比如页面骨架和栅格系统。
>
> **追问：怎么做响应式网格？**
>
> 核心是 repeat(auto-fit, minmax(250px, 1fr))。minmax 限定每列的弹性范围，auto-fit 自动计算列数并拉伸填满，容器宽度变化时列数自动增减，不需要任何媒体查询。如果是卡片列表还想让内部元素跨卡片对齐，可以给卡片加 grid-template-rows: subgrid。

---

## 练习

### 练习 1：响应式相册

**要求**：用 auto-fit + minmax 实现响应式相册，验证任意宽度下列数自动变化

**提示**：`repeat(auto-fit, minmax(180px, 1fr))` + gap，缩放窗口观察

**预期效果**：宽屏多列、窄屏少列，全程无媒体查询，项目拉伸填满

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.gallery img { width: 100%; aspect-ratio: 1; object-fit: cover; }
```

### 练习 2：仪表盘布局

**要求**：用 grid-template-areas 实现仪表盘（侧边栏 + 顶栏 + 内容区 + 页脚），媒体查询重排 areas 适配移动端

**提示**：桌面 `"sidebar topbar" "sidebar content"`，移动端改为单列 areas

**预期效果**：桌面端侧边栏贯穿全高，移动端变为单列堆叠，只改 areas 字符串

```css
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr 40px;
  grid-template-areas:
    "sidebar topbar"
    "sidebar content"
    "sidebar footer";
  height: 100vh;
}
@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: 64px auto 1fr 40px;
    grid-template-areas: "topbar" "sidebar" "content" "footer";
  }
}
```

### 练习 3：subgrid 卡片对齐

**要求**：用 subgrid 实现卡片列表，让标题/描述/按钮三行跨卡片严格对齐

**提示**：父网格定义列，卡片设 grid-template-rows: subgrid + grid-row: span 3

**预期效果**：无论各卡片描述长短，所有卡片的按钮都在同一水平线上

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}
```

---

## 本模块完成标准

- [ ] 能解释 fr 与百分比的区别（剩余空间 vs 容器总宽）
- [ ] 能用 repeat(auto-fit, minmax()) 写零媒体查询响应式网格
- [ ] 能区分 auto-fill 与 auto-fit 的空轨道行为
- [ ] 能用 grid-template-areas 做语义化布局并响应式重排
- [ ] 能用 subgrid 解决跨卡片对齐问题
- [ ] 能说明 Grid 与 Flex 的选型边界
