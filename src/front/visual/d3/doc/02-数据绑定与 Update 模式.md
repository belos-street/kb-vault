# 模块 2：数据绑定与 Update 模式

> 对应大纲模块 2 | 预计时间：1 天
> 面试可答：`enter` 处理新增元素、`update` 处理更新、`exit` 处理删除，`merge()` 合并选择集避免重复设置属性。

---

## 🎯 学习目标

- 理解 D3 数据绑定的核心机制
- 掌握 Enter-Update-Exit 三种选择集
- 能够实现动态添加/删除数据元素
- 面试时能清晰解释 D3 的 Update 模式

---

## 📖 核心概念

### 1. 数据绑定（Data Join）

数据绑定是 D3 最核心的概念，它将**数据数组**与 **DOM 元素**建立关联。

```javascript
const data = [10, 20, 30, 40, 50];

// 选择所有 <circle> 元素，绑定数据
const circles = d3.select('svg')
    .selectAll('circle')
    .data(data);
```

**关键点**：
- `selectAll()` 返回的是选择集（selection）
- `.data()` 将数组中的每个元素与一个 DOM 元素配对
- 绑定后，可以通过 `d` 参数访问对应的数据值

---

### 2. Enter-Update-Exit 模式

当数据数量与 DOM 元素数量不匹配时，D3 将选择集分为三部分：

| 选择集 | 含义 | 使用场景 |
|--------|------|----------|
| **Enter** | 数据比 DOM 元素多的部分 | 新增元素 |
| **Update** | 数据与 DOM 元素匹配的部分 | 更新现有元素 |
| **Exit** | DOM 元素比数据多的部分 | 删除多余元素 |

```
数据:   [10, 20, 30, 40, 50]   (5个)
DOM:    [<circle>, <circle>]    (2个)

结果:
- Enter:  [30, 40, 50]  → 需要创建3个新circle
- Update: [10, 20]      → 已有2个circle，更新它们
- Exit:   []            → 没有多余的circle需要删除
```

---

## 🔧 选择集详解

### Enter 选择集

当数据项数量 > DOM 元素数量时，多余的数据进入 Enter 选择集。

```javascript
const data = [10, 20, 30, 40, 50];

d3.select('svg')
    .selectAll('circle')  // 当前有 0 个 circle
    .data(data)           // 绑定 5 个数据
    .enter()              // 获取全部 5 个数据（因为 DOM 中没有 circle）
    .append('circle')     // 创建 5 个 circle
    .attr('cx', (d, i) => i * 60 + 30)
    .attr('cy', 50)
    .attr('r', d => d)
    .attr('fill', 'steelblue');
```

**典型用途**：初始化时根据数据创建元素。

---

### Update 选择集

Update 选择集是数据与 DOM 元素一一对应的部分。

```javascript
// 假设已经有 3 个 circle，绑定新数据 [15, 25, 35]
const circles = d3.select('svg')
    .selectAll('circle')
    .data([15, 25, 35]);

// 直接对 Update 集合操作（更新已有元素）
circles
    .attr('r', d => d)
    .attr('fill', 'orange');
```

**注意**：Update 选择集可以直接链式调用 `.attr()` 更新属性。

---

### Exit 选择集

当 DOM 元素数量 > 数据项数量时，多余的 DOM 元素进入 Exit 选择集。

```javascript
// 假设已经有 5 个 circle，但只有 3 个数据项
const data = [10, 20, 30];

const circles = d3.select('svg')
    .selectAll('circle')  // 当前有 5 个 circle
    .data(data);          // 只绑定 3 个数据

// 删除多余的 2 个 circle
circles.exit()
    .remove();
```

**典型用途**：数据减少时删除多余元素。

---

## 🔀 merge() 合并选择集

`merge()` 用于将 Enter 和 Update 选择集合并，方便同时操作新增和更新的元素。

```javascript
const data = [10, 20, 30, 40, 50];

// 假设已有 2 个 circle
const circles = d3.select('svg')
    .selectAll('circle')
    .data(data);

// 合并 Enter 和 Update
const merged = circles.enter()
    .append('circle')
    .merge(circles)  // 合并两个选择集
    .attr('cx', (d, i) => i * 60 + 30)
    .attr('cy', 50)
    .attr('r', d => d)
    .attr('fill', 'steelblue');
```

**为什么需要 merge？**
- Enter 中的元素需要设置所有属性（因为是新建的）
- Update 中的元素只需要更新变化的属性
- 合并后可以用统一的代码设置相同属性

---

## 🔑 Key 函数：数据与元素的匹配规则

`data()` 的第二个参数是 **key 函数**，它决定了数据项与 DOM 元素如何匹配。

### 三种用法

#### 1. 不传 key（默认按索引匹配）

```javascript
// 数据: [10, 20, 30]  →  DOM: [<rect>, <rect>, <rect>]
// 匹配: 第1个数据 → 第1个元素，第2个数据 → 第2个元素...
svg.selectAll('rect').data([10, 20, 30]);
```

**问题**：如果删除中间元素，后面的元素会错位。

#### 2. 传 key 函数（按数据特征匹配）

```javascript
// 使用 id 作为匹配键
const data = [
    { id: 1, value: 30 },
    { id: 2, value: 50 },
    { id: 3, value: 40 }
];

svg.selectAll('rect')
    .data(data, d => d.id)  // 按 id 匹配，而非索引
```

**好处**：删除 id=2 后，id=1 和 id=3 的元素保持不变。

#### 3. 传 key 函数返回 null（强制重新绑定）

```javascript
// 每次都重新创建所有元素（不复用）
svg.selectAll('rect')
    .data(data, () => null);
```

**用途**：数据完全变化时，强制重建所有元素。

### key 函数的工作原理

```
数据: [{id:1}, {id:2}, {id:3}]
DOM:  [<rect data-id="1">, <rect data-id="2">]

key 函数执行:
1. 对每个数据项计算 key: 1, 2, 3
2. 对每个 DOM 元素计算 key: 1, 2
3. 匹配: id=1 → Update, id=2 → Update, id=3 → Enter
```

### 常见错误：key 函数返回值不唯一

```javascript
// ❌ 错误：name 可能重复
.data(data, d => d.name)

// ✅ 正确：使用唯一标识
.data(data, d => d.id)
```

**面试常问**：key 函数的作用是确保"对象恒常性"（Object Constancy）——即使数据顺序变化，已有的 DOM 元素也能正确复用。

---

## ⚠️ 常见踩坑点

### 1. 忘记 merge 导致新增元素属性未设置

```javascript
// ❌ 错误：只设置了 Enter 元素，Update 元素没更新
const bars = svg.selectAll('rect').data(data);
bars.enter()
    .append('rect')
    .attr('x', (d, i) => xScale(i))
    .attr('fill', 'steelblue');
// Update 元素的 x 坐标没有更新！

// ✅ 正确：merge 后统一设置
bars.enter()
    .append('rect')
    .merge(bars)  // 合并 Enter 和 Update
    .attr('x', (d, i) => xScale(i))
    .attr('fill', 'steelblue');
```

### 2. 忘记 exit 导致 DOM 元素残留

```javascript
// ❌ 错误：数据减少后，多余的 rect 还在 DOM 中
data = [10, 20];  // 从 5 个减少到 2 个
svg.selectAll('rect').data(data);
// 画面上还有 3 个多余的 rect！

// ✅ 正确：处理 exit
const bars = svg.selectAll('rect').data(data);
bars.exit().remove();  // 删除多余元素
```

### 3. 在 enter 之后直接调用 data（顺序错误）

```javascript
// ❌ 错误：enter() 之后不能再调用 data()
svg.selectAll('rect').data(data).enter().data(newData);  // 无效！

// ✅ 正确：先 selectAll 再 data
svg.selectAll('rect').data(newData);
```

### 4. 使用 index 作为 key 时删除元素导致错位

```javascript
// ❌ 问题：删除中间元素后，后面的元素会"向前补位"
// 数据: [10, 20, 30] → 删除 20 → [10, 30]
// DOM: [rect1, rect2, rect3] → rect2 变成 30，rect3 被删除

// ✅ 解决：使用 id 作为 key
.data(data, d => d.id)
```

---

## 📝 完整示例：动态柱状图

```javascript
// 初始数据
let data = [30, 80, 45, 60, 20, 90, 55];

const svg = d3.select('#chart')
    .append('svg')
    .attr('width', 500)
    .attr('height', 300);

const xScale = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([0, 500])
    .padding(0.2);

const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([300, 0]);

// 绘制柱状图函数
function draw() {
    // 数据绑定
    const bars = svg.selectAll('rect')
        .data(data, d => d);  // 使用数据值作为 key

    // Enter：新增柱子
    bars.enter()
        .append('rect')
        .attr('x', (d, i) => xScale(i))
        .attr('y', 300)  // 从底部开始
        .attr('width', xScale.bandwidth())
        .attr('height', 0)  // 初始高度为 0
        .attr('fill', 'steelblue')
        .merge(bars)  // 合并 Update 集合
        .transition()
        .duration(500)
        .attr('x', (d, i) => xScale(i))
        .attr('y', d => yScale(d))
        .attr('height', d => 300 - yScale(d));

    // Exit：删除多余柱子
    bars.exit()
        .transition()
        .duration(300)
        .attr('height', 0)
        .attr('y', 300)
        .remove();
}

// 初始绘制
draw();

// 模拟数据更新
setTimeout(() => {
    data = [40, 70, 30, 85, 50];
    draw();
}, 2000);
```

---

## 🎓 面试常见问题

### Q1: Enter 和 Exit 分别处理什么？

**答**：
- **Enter**：处理数据比 DOM 元素多的部分，用于创建新元素
- **Exit**：处理 DOM 元素比数据多的部分，用于删除多余元素

### Q2: 为什么需要 merge()？

**答**：
`merge()` 用于合并 Enter 和 Update 选择集，这样可以用统一的代码同时处理新增和更新的元素，避免重复设置属性。

### Q3: data() 的第二个参数是什么？

**答**：
`data()` 的第二个参数是 **key 函数**，用于指定数据与 DOM 元素的匹配规则。

```javascript
// 使用 id 作为匹配键
.data(data, d => d.id)
```

如果不提供 key，默认按索引匹配（第一个数据匹配第一个元素）。

### Q4: Enter 选择集为什么不直接返回新元素？

**答**：
Enter 选择集是一个"占位符"，它需要通过 `.append()` 才能真正创建 DOM 元素。这种设计让 D3 能够：
1. 先检查哪些数据需要新元素
2. 统一创建元素并设置属性
3. 保持数据与 DOM 的对应关系

---

## 📝 面试回答模板

> **问：解释一下 D3 的 Enter-Update-Exit 模式？**
>
> D3 的数据绑定机制将数据与 DOM 元素的关系分为三种情况：
> - **Enter**：数据比 DOM 元素多，需要创建新元素
> - **Update**：数据与 DOM 元素一一对应，直接更新属性
> - **Exit**：DOM 元素比数据多，需要删除多余元素
>
> 典型的更新流程是：`selectAll().data()` 执行后，`enter().append()` 创建新元素，`merge()` 合并 Enter 和 Update 集合统一设置属性，`exit().remove()` 删除多余元素。
>
> **追问：什么时候需要 merge()？**
> 当你需要同时处理新增和更新的元素时，用 merge() 合并两个选择集，避免重复写属性设置代码。

> **问：key 函数的作用是什么？**
>
> `data()` 的第二个参数是 key 函数，它决定数据与 DOM 元素的匹配规则。默认按索引匹配，但使用 key 函数（如 `d => d.id`）可以实现"对象恒常性"——即使数据顺序变化，已有的 DOM 元素也能正确复用。这在增删数据时很重要，避免元素错位。

---

## 🆚 D3 vs ECharts 数据更新机制对比

| 维度 | D3 | ECharts |
|------|-----|---------|
| 更新方式 | 手动管理 Enter/Update/Exit | `setOption()` 自动 diff |
| 数据绑定 | 显式 `data()` 绑定 | 配置驱动，自动绑定 |
| 元素复用 | 通过 key 函数控制 | 自动按索引/名称复用 |
| 学习成本 | 高（需理解三选择集） | 低（只需改配置） |
| 灵活性 | 极高（可精确控制每个元素） | 中等（受限于配置项） |

**面试回答**：D3 需要手动管理数据更新的三个阶段（Enter/Update/Exit），灵活性高但复杂度也高。ECharts 通过 `setOption()` 自动 diff 新旧配置，开发者只需关注数据本身，适合快速开发。选型时，需要精细控制动画和交互的场景用 D3，标准业务图表用 ECharts。

---

## 🧪 练习题

### 练习 1：基础数据绑定

**要求**：创建一个 SVG，绑定数组 `[5, 10, 15, 20, 25]`，绘制 5 个圆

**提示**：
- x 坐标：`i * 60 + 30`
- y 坐标：`50`
- 半径：`d`（数据值）
- 填充色：`steelblue`

**预期效果**：页面显示 5 个水平排列的圆，半径从左到右依次为 5、10、15、20、25

```javascript
const data = [5, 10, 15, 20, 25];

d3.select('#exercise1')
    .append('svg')
    .attr('width', 350)
    .attr('height', 100)
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d, i) => i * 60 + 30)
    .attr('cy', 50)
    .attr('r', d => d)
    .attr('fill', 'steelblue');
```

---

### 练习 2：动态添加柱子

**要求**：实现一个按钮，每次点击添加一个新的柱子（随机高度）

**提示**：使用 `data.push()` 添加数据，然后调用 `updateChart()` 重新绑定

**预期效果**：每次点击按钮，柱状图右侧新增一个从底部生长的柱子，高度随机

```javascript
let data = [];

function addBar() {
    data.push(Math.random() * 100);
    updateChart();
}

function updateChart() {
    const bars = svg.selectAll('rect')
        .data(data);

    bars.enter()
        .append('rect')
        .attr('x', (d, i) => xScale(i))
        .attr('y', 300)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .attr('fill', 'steelblue')
        .merge(bars)
        .transition()
        .duration(300)
        .attr('x', (d, i) => xScale(i))
        .attr('y', d => yScale(d))
        .attr('height', d => 300 - yScale(d));
}
```

---

### 练习 3：动态删除柱子

**要求**：在练习 2 基础上，添加删除功能（删除最后一个柱子）

**提示**：使用 `data.pop()` 删除数据，然后调用 `updateChart()` 重新绑定，注意处理 exit 选择集

**预期效果**：点击删除按钮后，最右侧的柱子平滑收缩到底部后消失

```javascript
function removeBar() {
    data.pop();
    updateChart();
}

// 在 updateChart 中添加 exit 处理
function updateChart() {
    // ... enter 和 update 代码 ...

    svg.selectAll('rect')
        .data(data)
        .exit()
        .transition()
        .duration(300)
        .attr('height', 0)
        .attr('y', 300)
        .remove();
}
```

---

### 练习 4：使用 key 函数

**要求**：修改练习 2，使用数据对象的 `id` 属性作为 key，确保删除中间元素时不会影响其他元素

**提示**：将数据改为对象数组，在 `data()` 中传入 key 函数 `d => d.id`

**预期效果**：删除 id=2 的元素后，id=1 和 id=3 的柱子保持原位，不会错位

```javascript
let data = [
    { id: 1, value: 30 },
    { id: 2, value: 50 },
    { id: 3, value: 40 }
];

function removeById(id) {
    data = data.filter(d => d.id !== id);
    updateChart();
}

// 在 data() 中使用 key 函数
svg.selectAll('rect')
    .data(data, d => d.id)  // 使用 id 作为 key
    .exit()
    .remove();
```

---

## 📚 进阶阅读

- [D3 官方文档 - Data Join](https://d3js.org/d3-selection/joining)
- [Thinking with Joins](https://bost.ocks.org/mike/join/) - Mike Bostock 的经典文章
- [Object Constancy](https://bost.ocks.org/mike/constancy/) - 理解 key 函数的重要性

---

## ✅ 本模块完成标准

- [ ] 理解 `selectAll().data()` 的工作原理
- [ ] 能解释 Enter、Update、Exit 三种选择集的区别
- [ ] 掌握 `merge()` 的使用场景
- [ ] 能实现动态添加/删除数据元素的功能
- [ ] 面试时能画出数据绑定的流程图
