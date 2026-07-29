# 05 - Flexbox

> 对应大纲模块 5 | 预计时间：2 天
> 面试可答：Flex 是一维布局，核心是主轴/交叉轴 + 弹性分配（grow/shrink/basis）；`flex: 1` 是 `1 1 0%` 的简写，basis 为 0 才能严格等分。

---

## 学习目标

- 理解主轴/交叉轴模型与 flex-direction 的关系
- 掌握容器属性（justify-content / align-items / flex-wrap / gap）
- 深入理解 flex-grow / flex-shrink / flex-basis 的分配算法
- 区分 `flex: 1` / `flex: auto` / `flex: none` 的差异
- 能用 Flex 实现居中、等分、圣杯布局等经典场景

---

## 核心概念

### 1. 弹性布局模型：主轴与交叉轴

Flex 是**一维布局**——一次只处理一个方向（行或列）。

```
主轴（main axis）→ flex-direction 决定
交叉轴（cross axis）→ 垂直于主轴

flex-direction: row（默认）
┌─────────────────────────────→ 主轴
│  [item1] [item2] [item3]
│     ↓ 交叉轴
```

```css
.container {
  display: flex;
  flex-direction: row;            /* 主轴水平（默认） */
  /* flex-direction: column; */   /* 主轴垂直 */
  /* flex-direction: row-reverse; */ /* 主轴水平反向 */
}
```

**关键认知**：`flex-direction: column` 后，`justify-content` 控制的是**垂直方向**（因为主轴变成垂直了）。这是初学者最常混淆的点。

### 2. 容器属性

#### justify-content（主轴对齐）

```css
.container {
  justify-content: flex-start;     /* 靠主轴起点（默认） */
  justify-content: center;         /* 居中 */
  justify-content: flex-end;       /* 靠主轴终点 */
  justify-content: space-between;  /* 两端对齐，中间等距 */
  justify-content: space-around;   /* 每个项目两侧等距（首尾有半距） */
  justify-content: space-evenly;   /* 所有间距完全相等 */
}
```

```
space-between:  [1]        [2]        [3]   首尾贴边
space-around:    [1]      [2]      [3]      首尾半距
space-evenly:    [1]      [2]      [3]      全等距
```

#### align-items（交叉轴对齐，单行）

```css
.container {
  align-items: stretch;    /* 拉伸填满交叉轴（默认） */
  align-items: flex-start; /* 靠交叉轴起点 */
  align-items: center;     /* 交叉轴居中 */
  align-items: flex-end;   /* 靠交叉轴终点 */
  align-items: baseline;   /* 按文字基线对齐 */
}
```

#### flex-wrap 与 gap

```css
.container {
  flex-wrap: wrap; /* 允许换行（默认 nowrap 不换行会挤压） */
  gap: 16px;       /* 项目间距（行列通用，替代 margin hack） */
  /* row-gap: 16px; column-gap: 24px; */
}
```

**`gap` 是现代 Flex 的标配**——比给每个项目加 margin 再处理首尾更干净。

#### align-content（多行对齐）

```css
/* 仅在 flex-wrap: wrap 且有多行时生效 */
.container {
  align-content: space-between; /* 多行在交叉轴上的分布 */
}
```

### 3. 项目属性：弹性分配算法

这是 Flex 的核心，也是面试重点。

```css
.item {
  flex-grow: 0;    /* 有剩余空间时，是否放大及放大比例（默认 0 不放大） */
  flex-shrink: 1;  /* 空间不足时，是否缩小及缩小比例（默认 1 等比缩小） */
  flex-basis: auto;/* 分配前的初始尺寸（默认 auto = 内容尺寸） */
}
```

#### flex-grow：分配剩余空间

```css
/* 容器 600px，三个项目 basis 各 100px → 剩余 300px */
.a { flex-grow: 1; } /* 得 100px 剩余 → 200px */
.b { flex-grow: 1; } /* 得 100px 剩余 → 200px */
.c { flex-grow: 1; } /* 得 100px 剩余 → 200px */

/* 按 grow 比例分配剩余空间 */
.a { flex-grow: 1; } /* 得 100px → 200px */
.b { flex-grow: 2; } /* 得 200px → 300px */
```

**算法**：`最终尺寸 = basis + 剩余空间 × (自身grow / 总grow)`

#### flex-shrink：分摊溢出空间

```css
/* 容器 300px，三个项目 basis 各 200px → 溢出 300px */
.item { flex-shrink: 1; } /* 各分摊 100px → 100px */

/* shrink 为 0 的项目不缩小（常用于固定宽度） */
.sidebar { flex-shrink: 0; width: 200px; } /* 永不被压缩 */
```

**算法**：`缩小量 = 溢出空间 × (自身shrink×basis / Σ(shrink×basis))`（注意 shrink 加权了 basis）

#### flex-basis：初始尺寸

```css
.item { flex-basis: 200px; } /* 分配前的基准宽度 */
.item { flex-basis: auto; }  /* 用内容/width 作为基准（默认） */
.item { flex-basis: 0; }     /* 基准为 0，完全按 grow 比例分配 */
```

### 4. flex 简写：1 / auto / none 的区别

```css
/* flex 简写 = flex-grow flex-shrink flex-basis */

flex: 1;      /* = 1 1 0%    → 严格等分（basis 为 0，忽略内容） */
flex: auto;   /* = 1 1 auto  → 按内容加权分配（内容多的占更多） */
flex: none;   /* = 0 0 auto  → 完全不伸缩（固定内容尺寸） */
flex: 0 auto; /* = 0 1 auto  同 flex: initial（默认值） */
```

**面试常问**：`flex: 1` 和 `flex: auto` 的区别？

```html
<div class="container">
  <div class="a">短</div>
  <div class="b">这是一段很长很长的内容</div>
</div>
```

```css
/* flex: 1（basis 0）→ 两者严格等宽，忽略内容差异 */
.a, .b { flex: 1; }

/* flex: auto（basis auto）→ b 内容多，分得更多空间 */
.a, .b { flex: auto; }
```

**记忆**：要"严格等分"用 `flex: 1`（basis 归零）；要"按内容自适应"用 `flex: auto`。

#### order 与可访问性

```css
.item { order: -1; } /* 视觉上排到最前 */
```

**警告**：`order` 只改变**视觉顺序**，不改变 DOM 顺序和 Tab 键导航顺序。滥用会导致键盘用户和屏幕阅读器的顺序混乱，仅用于无交互的装饰性重排。

### 5. 经典场景

#### 水平垂直居中（三行代码）

```css
.container {
  display: flex;
  justify-content: center; /* 主轴居中 */
  align-items: center;     /* 交叉轴居中 */
}
```

#### 等分与不等分

```css
/* 三等分 */
.col { flex: 1; }

/* 2:1 分栏 */
.main { flex: 2; }
.aside { flex: 1; }
```

#### 黏性页脚（内容不足时页脚贴底）

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main { flex: 1; } /* 内容区撑开剩余空间，把 footer 推到底部 */
```

#### 导航栏（logo 固定 + 菜单弹性）

```css
.nav { display: flex; align-items: center; gap: 24px; }
.logo { flex-shrink: 0; }      /* logo 不被压缩 */
.menu { margin-left: auto; }   /* 推到右侧（auto margin 吸收剩余空间） */
```

**`margin-left: auto`** 是 Flex 的隐藏技巧——auto margin 会吸收该方向的所有剩余空间，比 space-between 更灵活。

#### 圣杯布局（header/footer 固定 + 三栏）

```css
body { display: flex; flex-direction: column; min-height: 100vh; }
.header, .footer { flex: none; }        /* 固定高度 */
.content { flex: 1; display: flex; }    /* 中间撑开 */
.aside-left { flex: 0 0 200px; }        /* 左固定 200px */
.main { flex: 1; }                      /* 中间自适应 */
.aside-right { flex: 0 0 150px; }       /* 右固定 150px */
```

### 6. Flex 的局限 → Grid 的边界

```
Flex 适合：一维布局（一行或一列的项目排列）
  - 导航栏、按钮组、卡片行、居中

Grid 适合：二维布局（同时控制行和列）
  - 页面整体骨架、复杂栅格、跨行跨列
```

**经验法则**：
- 从**内容出发**（内容决定布局）→ Flex
- 从**布局出发**（布局决定内容位置）→ Grid

Flex 换行后（flex-wrap），各行之间的对齐控制较弱（align-content 有限），这种"多行网格"场景应该用 Grid。

---

## 常见踩坑点

### 坑 1：flex-direction: column 后 justify 方向变了

```css
/* ❌ 以为 justify-content 永远控制水平 */
.container {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 这控制的是垂直居中！ */
}

/* ✅ column 下：justify-content 管垂直，align-items 管水平 */
```

### 坑 2：flex: 1 没有严格等分

```css
/* ❌ 内容超长时，flex: 1 的项目被内容撑大（因为默认 min-width: auto） */
.item { flex: 1; }

/* ✅ Flex 项目默认 min-width: auto，内容会撑破。需要： */
.item { flex: 1; min-width: 0; } /* 允许收缩到比内容小 */
```

**这是 Flex 最高频的坑**：Flex 项目默认 `min-width: auto`（不能小于内容），导致长文本/图片撑破等分布局。设 `min-width: 0` 解决。

### 坑 3：忘记 flex-shrink: 0 导致固定宽度被压缩

```css
/* ❌ 空间不足时，"固定" 200px 的侧边栏被压缩 */
.sidebar { width: 200px; }

/* ✅ 明确不收缩 */
.sidebar { flex: 0 0 200px; } /* grow 0, shrink 0, basis 200px */
```

### 坑 4：用 margin 而非 gap 控制间距

```css
/* ❌ 每个项目加 margin，首尾还要特殊处理 */
.item { margin-right: 16px; }
.item:last-child { margin-right: 0; }

/* ✅ 直接用 gap */
.container { gap: 16px; }
```

---

## 面试高频问题

### Q1：Flex 的主轴和交叉轴是什么？

**答**：Flex 是一维布局，flex-direction 决定主轴方向：row 时主轴水平、column 时主轴垂直，交叉轴始终垂直于主轴。关键点是 justify-content 沿主轴对齐、align-items 沿交叉轴对齐，所以 flex-direction: column 后 justify-content 控制的是垂直方向，这是最容易混淆的地方。

### Q2：flex: 1 是什么意思？和 flex: auto 有什么区别？

**答**：flex 是 flex-grow、flex-shrink、flex-basis 的简写。flex: 1 等于 1 1 0%，flex: auto 等于 1 1 auto。区别在 basis：flex: 1 的 basis 是 0，分配时完全忽略内容，项目严格等分；flex: auto 的 basis 是 auto（内容尺寸），内容多的项目会分到更多空间。要严格等分用 flex: 1，要按内容自适应用 flex: auto。

### Q3：flex-grow 和 flex-shrink 怎么计算？

**答**：flex-grow 分配剩余空间：最终尺寸 = basis + 剩余空间 × (自身grow/总grow)。flex-shrink 分摊溢出空间，且加权了 basis：缩小量 = 溢出 × (自身shrink×basis / Σ(shrink×basis))。默认 grow 为 0（不放大）、shrink 为 1（等比缩小）。固定宽度的元素要设 flex-shrink: 0 防止被压缩。

### Q4：Flex 项目为什么会被内容撑破？怎么解决？

**答**：Flex 项目默认 min-width: auto，意味着不能收缩到比内容更小，所以长文本或图片会撑破等分布局。解决方法是给项目设 min-width: 0（或 min-height: 0），允许它收缩到比内容小，配合 overflow 处理溢出内容。这是 Flex 布局最高频的坑。

### Q5：Flex 和 Grid 怎么选？

**答**：Flex 是一维布局，适合处理一行或一列的项目排列，是"内容驱动"——内容决定布局；Grid 是二维布局，同时控制行和列，是"布局驱动"——布局决定内容位置。导航栏、按钮组、居中用 Flex；页面骨架、复杂栅格、需要跨行跨列用 Grid。Flex 换行后的多行对齐能力弱，这种场景应该用 Grid。

### Q6：怎么让页脚始终在底部？

**答**：用 Flex 纵向布局：body 设 display: flex、flex-direction: column、min-height: 100vh，header 和 footer 设 flex: none（固定高度），main 设 flex: 1 吸收剩余空间。内容少时 main 撑开把 footer 推到底部，内容多时正常滚动。

---

## 面试回答模板

> **问：介绍一下 Flexbox 布局？**
>
> Flex 是一维弹性布局，核心是主轴和交叉轴模型。容器上用 flex-direction 定主轴方向，justify-content 控制主轴对齐，align-items 控制交叉轴对齐，flex-wrap 控制换行，gap 控制间距。项目上用 flex-grow/shrink/basis 控制弹性分配，简写 flex: 1 表示可伸可缩且基准为 0（严格等分）。Flex 适合内容驱动的一维排列，比如导航、按钮组、居中；二维布局应该用 Grid。
>
> **追问：flex: 1 和 flex: auto 的区别？**
>
> 区别在 flex-basis。flex: 1 是 1 1 0%，basis 为 0 意味着分配时忽略内容尺寸，项目严格等分；flex: auto 是 1 1 auto，basis 为内容尺寸，内容多的项目分到更多空间。另外要注意 Flex 项目默认 min-width: auto，会被内容撑破，等分布局常需要配合 min-width: 0。

---

## 练习

### 练习 1：圣杯布局

**要求**：用 Flex 实现圣杯布局——header/footer 固定高度，中间三栏（左右固定、中间自适应），内容不足一屏时 footer 贴底

**提示**：外层 column + min-height: 100vh，中间 content 再开一层 row

**预期效果**：缩放窗口时中间栏自适应，左右栏宽度不变，内容少时 footer 始终在底部

```css
body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
.header, .footer { flex: none; padding: 20px; background: #e0e7ff; }
.content { flex: 1; display: flex; }
.aside-left { flex: 0 0 200px; background: #fef3c7; }
.main { flex: 1; min-width: 0; background: #f0fdf4; }
.aside-right { flex: 0 0 150px; background: #fce7f3; }
```

### 练习 2：可换行标签云

**要求**：实现一个可换行的标签云，用 gap 控制间距，验证换行后对齐正常

**提示**：flex-wrap: wrap + gap，不要用 margin

**预期效果**：标签自动换行，行列间距均匀，首尾无多余间距

```css
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { padding: 4px 12px; background: #e0e7ff; border-radius: 9999px; }
```

### 练习 3：flex: 1 vs flex: auto

**要求**：用两个内容长度差异大的项目，分别用 flex: 1 和 flex: auto，画图/截图说明宽度差异

**提示**：一个项目放"短"，另一个放长文本，对比两种简写的分配结果

**预期效果**：flex: 1 时两者等宽（忽略内容）；flex: auto 时长文本项目更宽。能口头解释 basis 的作用

```css
/* 对比实验 */
.demo-1 .item { flex: 1; }      /* 等宽 */
.demo-2 .item { flex: auto; }   /* 按内容 */
```

---

## 本模块完成标准

- [ ] 能说出 flex-direction: column 后 justify/align 的方向变化
- [ ] 能手算 flex-grow / flex-shrink 的分配结果
- [ ] 能区分 flex: 1 / auto / none 并说明适用场景
- [ ] 能用 min-width: 0 解决内容撑破等分布局的问题
- [ ] 能用 Flex 实现居中、等分、黏性页脚、圣杯布局
- [ ] 能说明 Flex 与 Grid 的选型边界
