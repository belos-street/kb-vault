# 11 - 颜色体系与设计 Token

> 对应大纲模块 11 | 预计时间：2 天
> 面试可答：oklch 是感知均匀色彩空间，色相/色度/明度分离，适合派生主题色；color-mix 做明暗混合；light-dark() 一行搞定双主题；@property 给变量加类型，让渐变和颜色可过渡。

---

## 学习目标

- 理解 sRGB 的局限与 oklch 感知均匀的优势
- 掌握 color-mix() 与相对颜色语法派生主题色
- 掌握自定义属性的作用域与 @property 类型化
- 能用 light-dark() 实现原生双主题
- 能设计三层 Token 体系（primitive/semantic/component）
- 理解 WCAG 对比度标准与 color-contrast() 的现状

---

## 核心概念

### 1. 颜色模型的演进

#### sRGB（hex/rgb/hsl）的局限

```css
/* 传统颜色写法 */
color: #4f46e5;
color: rgb(79, 70, 229);
color: hsl(243, 75%, 59%);
```

**hsl 的问题：感知不均匀**。同样 50% 亮度，黄色看起来比蓝色亮得多：

```css
/* 都是 hsl(x, 100%, 50%)，但视觉明度差异巨大 */
.yellow { color: hsl(60, 100%, 50); }   /* 刺眼的亮黄 */
.blue   { color: hsl(240, 100%, 50); }  /* 深沉的蓝 */
```

用 hsl 调整明度做主题色板时，不同色相的"50% 明度"视觉不一致，导致色板不协调。

#### oklch / oklab（Baseline 2023）

```css
/* oklch(L, C, H)：明度 Lightness、色度 Chroma、色相 Hue */
color: oklch(70% 0.15 250);

/* oklab(L, a, b)：笛卡尔坐标形式（少用） */
color: oklab(70% -0.1 0.1);
```

**oklch 的优势**：
- **感知均匀**：相同 L 值的不同色相，视觉明度一致
- **维度分离**：调色相（H）不影响明度，调明度（L）不影响鲜艳度
- **可预测派生**：`L + 10%` 在所有色相上看起来都"亮了同样的程度"

```css
/* 用 oklch 做色板：固定 L 和 C，只改 H → 视觉明度一致的彩虹 */
.c1 { background: oklch(70% 0.15 0); }    /* 红 */
.c2 { background: oklch(70% 0.15 120); }  /* 绿 */
.c3 { background: oklch(70% 0.15 240); }  /* 蓝 */
/* 三个颜色看起来一样亮（hsl 做不到） */
```

#### P3 广色域（了解）

```css
/* display-p3 色域比 sRGB 广，能显示更鲜艳的颜色（需广色域屏幕） */
color: color(display-p3 1 0 0); /* 更纯的红 */

/* 用 @media 检测广色域支持 */
@media (color-gamut: p3) {
  .brand { color: color(display-p3 0.9 0.1 0.2); }
}
```

### 2. 颜色派生

#### color-mix()（Baseline 2023-05）

```css
/* color-mix(in <色彩空间>, <颜色1> <比例>, <颜色2> <比例>) */

/* 把主色调亮 20%（混入白色） */
--primary-light: color-mix(in oklch, var(--primary), white 20%);

/* 调暗 20%（混入黑色） */
--primary-dark: color-mix(in oklch, var(--primary), black 20%);

/* 加透明度（混入 transparent） */
--primary-ghost: color-mix(in oklch, var(--primary), transparent 80%);

/* 两色插值（取中间色） */
--blend: color-mix(in oklch, #4f46e5, #ec4899);
```

**为什么用 `in oklch`**：指定混合的色彩空间。在 oklch 中混合更自然（不会经过灰暗的中间色），在 srgb 中混合某些颜色会变灰。

#### 相对颜色语法（Relative Color Syntax）

```css
/* from 关键字：基于某个颜色，修改其分量 */

/* 在主色基础上，明度 +10% */
--lighter: oklch(from var(--primary) calc(l + 0.1) c h);

/* 降低色度（变灰一点） */
--muted: oklch(from var(--primary) l calc(c - 0.05) h);

/* 色相旋转 30°（互补/邻近色） */
--accent: oklch(from var(--primary) l c calc(h + 30));
```

**语法结构**：`oklch(from <源颜色> <L表达式> <C表达式> <H表达式>)`，l/c/h 引用源颜色的对应分量。

#### 用单一主色派生完整状态

```css
:root {
  --primary: oklch(60% 0.2 250);

  /* 交互状态：明度递变 */
  --primary-hover:  oklch(from var(--primary) calc(l - 0.05) c h);
  --primary-active: oklch(from var(--primary) calc(l - 0.1) c h);

  /* 禁用：降色度 + 提明度 */
  --primary-disabled: oklch(from var(--primary) calc(l + 0.2) calc(c * 0.4) h);

  /* 边框/背景：高透明度 */
  --primary-border: color-mix(in oklch, var(--primary), transparent 60%);
  --primary-bg:     color-mix(in oklch, var(--primary), transparent 90%);
}
```

**这就是现代主题系统的核心**——一个主色，通过 oklch 分量运算派生全部状态，换主题只需改一个变量。

### 3. 自定义属性（CSS Variables）

```css
/* 声明：-- 前缀 */
:root {
  --primary: #4f46e5;
  --spacing-md: 16px;
}

/* 使用：var() + 回退值 */
.btn {
  background: var(--primary);
  padding: var(--spacing-md, 12px); /* 变量未定义时用 12px */
}
```

#### 作用域与继承

```css
/* 自定义属性遵循 CSS 继承，可以局部覆盖 */
:root { --color: blue; }

.card { --color: red; }        /* 局部覆盖 */
.card p { color: var(--color); } /* 红色（继承自 .card） */

body > p { color: var(--color); } /* 蓝色（继承自 :root） */
```

**这是自定义属性 vs Sass 变量的本质区别**：CSS 变量是**运行时**的、可继承、可被媒体查询/JS 动态修改；Sass 变量是**编译时**的静态值。

#### 与 JS 交互

```js
// 读取
const color = getComputedStyle(document.documentElement)
  .getPropertyValue('--primary').trim();

// 设置（运行时换肤）
document.documentElement.style.setProperty('--primary', '#ec4899');
```

### 4. @property 类型化自定义属性（Baseline 2024-07）

普通自定义属性是"字符串"，浏览器不知道它的类型，所以**无法过渡/动画**。

```css
/* ❌ 普通变量：渐变角度变化是跳变，不是平滑过渡 */
:root { --angle: 0deg; }
.gradient { background: linear-gradient(var(--angle), red, blue); }
.gradient:hover { --angle: 180deg; } /* 瞬间跳变 */
```

```css
/* ✅ @property 声明类型 → 可以过渡 */
@property --angle {
  syntax: '<angle>';      /* 类型：角度 */
  inherits: false;        /* 是否继承 */
  initial-value: 0deg;    /* 初始值（必填） */
}

.gradient {
  background: linear-gradient(var(--angle), red, blue);
  transition: --angle 0.5s; /* 现在可以平滑过渡了！ */
}
.gradient:hover { --angle: 180deg; }
```

#### 常用 syntax 类型

```css
@property --my-color { syntax: '<color>'; inherits: false; initial-value: #fff; }
@property --my-length { syntax: '<length>'; inherits: false; initial-value: 0px; }
@property --my-number { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --my-percent { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
```

**@property 的价值**：让渐变动画、颜色过渡、数值动画成为可能——这些以前只能靠 JS 或 SVG hack。

### 5. light-dark() 原生双主题（Baseline 2024-05）

```css
/* 前提：声明 color-scheme */
:root { color-scheme: light dark; }

/* light-dark(亮色值, 暗色值)：根据当前方案自动选值 */
:root {
  --bg: light-dark(#ffffff, #1a1a1a);
  --text: light-dark(#1f2937, #f3f4f6);
  --surface: light-dark(#f9fafb, #26272b);
  --border: light-dark(#e5e7eb, #3f3f46);
}

body { background: var(--bg); color: var(--text); }
```

#### 与 color-mix 组合派生明暗语义色

```css
:root {
  color-scheme: light dark;
  --primary: light-dark(oklch(55% 0.2 250), oklch(70% 0.18 250));

  /* 暗色模式下主色通常更亮（在深背景上需要更高明度） */
  --primary-hover: oklch(from var(--primary) calc(l - 0.05) c h);
}
```

**对比旧方案**：以前每个颜色要写两份 `@media (prefers-color-scheme: dark)`，现在 light-dark() 一行搞定，且 color-scheme 会自动适配滚动条、表单控件等原生 UI。

### 6. 设计 Token 体系

Token 是设计决策的最小单位（颜色、间距、圆角、阴影），分三层：

```
primitive（原始层）  →  semantic（语义层）  →  component（组件层）
原始值，无含义          用途含义               组件专属
```

#### 三层示例

```css
/* 1. primitive：原始调色板/尺寸（不含语义） */
:root {
  --blue-500: oklch(60% 0.2 250);
  --blue-600: oklch(55% 0.2 250);
  --gray-100: #f3f4f6;
  --gray-900: #111827;
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
}

/* 2. semantic：语义化（描述用途，映射到 primitive） */
:root {
  --color-primary: var(--blue-500);
  --color-primary-hover: var(--blue-600);
  --color-bg: var(--gray-100);
  --color-text: var(--gray-900);
  --spacing-sm: var(--space-2);
  --spacing-md: var(--space-4);
}

/* 3. component：组件级（特定组件的决策） */
.btn {
  --btn-bg: var(--color-primary);
  --btn-padding: var(--spacing-sm) var(--spacing-md);
  background: var(--btn-bg);
  padding: var(--btn-padding);
}
```

**分层的价值**：
- 换品牌色：只改 semantic 层的映射，primitive 和 component 不动
- 暗色模式：semantic 层用 light-dark() 切换，component 层无感知
- 一致性：所有组件引用 semantic token，而非硬编码原始值

#### 间距系统

```css
/* 4px/8px 基准的间距阶梯 */
:root {
  --space-1: 4px;   /* 极小 */
  --space-2: 8px;   /* 小 */
  --space-3: 12px;
  --space-4: 16px;  /* 中（基准） */
  --space-6: 24px;
  --space-8: 32px;  /* 大 */
}
```

**原则**：用有限的间距阶梯（而非任意 px 值），保证视觉节奏一致。

### 7. 对比度与可访问性

#### WCAG 标准

```
AA 级（最低要求）：
  正文文本：对比度 ≥ 4.5:1
  大文本（≥24px 或 ≥18.66px 粗体）：≥ 3:1
  UI 组件/图形：≥ 3:1

AAA 级（增强）：
  正文文本：≥ 7:1
  大文本：≥ 4.5:1
```

```css
/* 确保文字与背景对比度达标 */
.text-on-primary {
  background: var(--primary);
  color: white; /* 需验证 white 与 primary 的对比度 ≥ 4.5:1 */
}
```

#### color-contrast() 的现状

```css
/* ⚠️ color-contrast() 曾设想自动选择对比色： */
/* color: color-contrast(var(--bg) vs white, black); */
/* 但它已从 CSS Color Level 5 规范移除，浏览器未实现 */
/* 自动取对比色目前需用 JS 计算 WCAG 对比度 */
```

**面试注意**：不要说 color-contrast() 可用——它已出局。自动对比色需要 JS（计算相对亮度，按 WCAG 公式选黑/白）。

---

## 常见踩坑点

### 坑 1：oklch 色度超出 sRGB 范围

```css
/* ❌ 高色度 + 某些色相超出 sRGB 色域，浏览器会裁剪（颜色失真） */
color: oklch(70% 0.4 150); /* 色度 0.4 太高，绿色会溢出 */

/* ✅ sRGB 内安全色度通常 < 0.37，或用 color() 指定 p3 色域 */
color: oklch(70% 0.2 150);
```

### 坑 2：color-mix 没指定色彩空间

```css
/* 默认在 oklab 混合（通常 OK），但明确指定更可控 */
/* ❌ 在 srgb 混合互补色会经过灰色 */
color-mix(in srgb, red, cyan); /* 中间发灰 */

/* ✅ 在 oklch 混合更自然 */
color-mix(in oklch, red, cyan);
```

### 坑 3：@property 缺少 initial-value

```css
/* ❌ syntax 非 '*' 时，initial-value 必填，否则无效 */
@property --x { syntax: '<length>'; inherits: false; } /* 报错 */

/* ✅ */
@property --x { syntax: '<length>'; inherits: false; initial-value: 0px; }
```

### 坑 4：light-dark() 不生效

```css
/* ❌ 没有 color-scheme 声明 */
:root { --bg: light-dark(#fff, #000); } /* 不生效 */

/* ✅ 必须先声明 color-scheme */
:root { color-scheme: light dark; --bg: light-dark(#fff, #000); }
```

### 坑 5：Token 层级混乱

```css
/* ❌ 组件直接引用 primitive（跳过 semantic） */
.btn { background: var(--blue-500); } /* 换主题时要改所有组件 */

/* ✅ 组件引用 semantic */
.btn { background: var(--color-primary); } /* 换主题只改 semantic 映射 */
```

---

## 面试高频问题

### Q1：oklch 相比 hsl 有什么优势？

**答**：核心是感知均匀。hsl 的明度不均匀——同样 50% 亮度，黄色看起来比蓝色亮很多，导致用 hsl 调出的色板视觉不协调。oklch 是感知均匀色彩空间，相同 L 值的不同色相视觉明度一致。而且 oklch 的维度分离更好：调色相不影响明度，调明度不影响鲜艳度，所以特别适合用分量运算派生主题色板（L+10% 在所有色相上看起来都亮同样的程度）。

### Q2：color-mix() 和相对颜色语法怎么用？

**答**：color-mix(in 色彩空间, 颜色1 比例, 颜色2 比例) 做两色混合，常用于把主色和白色/黑色/透明色混合来调亮调暗加透明。相对颜色语法 oklch(from 源色 L C H) 基于某个颜色修改其分量，比如 calc(l + 0.1) 提亮明度、calc(h + 30) 旋转色相。两者配合，用一个主色就能派生 hover/active/disabled/border 全部状态，换主题只需改一个变量。建议在 oklch 空间混合，避免互补色混合发灰。

### Q3：@property 解决了什么问题？

**答**：普通自定义属性是字符串，浏览器不知道类型，所以无法过渡动画——比如渐变角度变化是瞬间跳变。@property 给变量声明类型（syntax: '<angle>'/'<color>' 等）、是否继承、初始值，浏览器就能对它做插值，于是渐变动画、颜色过渡、数值动画都能纯 CSS 实现。注意 syntax 非通配符时 initial-value 必填。2024-07 已 Baseline。

### Q4：怎么设计一套设计 Token 体系？

**答**：分三层。primitive 原始层放调色板和尺寸阶梯，不含语义（如 --blue-500、--space-4）；semantic 语义层描述用途并映射到 primitive（如 --color-primary → --blue-500、--spacing-md → --space-4）；component 组件层是特定组件的决策（如 --btn-bg → --color-primary）。价值是：换品牌色只改 semantic 映射，暗色模式在 semantic 层用 light-dark 切换，组件无感知，且所有组件引用语义 token 保证一致性。

### Q5：light-dark() 怎么用？和旧方案比有什么优势？

**答**：先在根元素声明 color-scheme: light dark（前提），再用 light-dark(亮色值, 暗色值) 定义颜色，浏览器根据当前配色方案自动选值。优势：旧方案每个颜色要写两份 prefers-color-scheme 媒体查询，代码翻倍；light-dark 一行搞定。而且 color-scheme 声明会让浏览器自动适配滚动条、表单控件等原生 UI 的配色。手动切换通过覆写 color-scheme 实现。

### Q6：怎么保证颜色的可访问性？color-contrast() 能用吗？

**答**：遵循 WCAG 对比度标准——正文文本对比度至少 4.5:1（AA 级），大文本至少 3:1。color-contrast() 本来设想自动选择对比色，但它已从 CSS Color Level 5 规范移除，浏览器没有实现，所以不能用。目前自动取对比色需要 JS：计算背景色的相对亮度，按 WCAG 公式判断用黑字还是白字。设计阶段可以用对比度检查工具验证。

---

## 面试回答模板

> **问：现代 CSS 怎么做主题系统？**
>
> 三个技术组合。第一，用 oklch 定义颜色——它感知均匀、维度分离，适合派生。第二，用 color-mix 和相对颜色语法从一个主色派生全部状态，比如 oklch(from var(--primary) calc(l - 0.05) c h) 做 hover 色，color-mix 加透明做背景色，换主题只改一个主色变量。第三，用三层 Token 组织——primitive 原始值、semantic 语义映射、component 组件决策，换品牌或暗色模式只动 semantic 层。暗色模式用 color-scheme + light-dark() 原生切换。需要动画的颜色或渐变用 @property 类型化。
>
> **追问：为什么不用 hsl 而用 oklch？**
>
> hsl 感知不均匀，同样 50% 明度黄色比蓝色看起来亮很多，调出的色板不协调。oklch 感知均匀，相同 L 值视觉明度一致，而且调色相不影响明度、调明度不影响鲜艳度，分量运算的结果可预测。所以用 oklch 派生主题色板，所有色相的 hover/disabled 状态看起来都协调一致，这是 hsl 做不到的。

---

## 练习

### 练习 1：单主色派生完整主题

**要求**：用 oklch + color-mix + light-dark() 从单个主色派生完整主题色板（含 hover/active/disabled/border/bg + 暗色模式）

**提示**：主色用 oklch，状态用相对颜色语法改 L，透明度用 color-mix，明暗用 light-dark

**预期效果**：改一个 --primary 变量，所有状态色和暗色模式同步更新；色板视觉协调

```css
:root {
  color-scheme: light dark;
  --primary: light-dark(oklch(55% 0.2 250), oklch(70% 0.18 250));
  --primary-hover: oklch(from var(--primary) calc(l - 0.06) c h);
  --primary-active: oklch(from var(--primary) calc(l - 0.12) c h);
  --primary-disabled: oklch(from var(--primary) calc(l + 0.2) calc(c * 0.4) h);
  --primary-border: color-mix(in oklch, var(--primary), transparent 60%);
  --primary-bg: color-mix(in oklch, var(--primary), transparent 90%);
}
```

### 练习 2：@property 渐变动画

**要求**：用 @property 实现渐变背景色的平滑过渡动画（原生 CSS，无 JS）

**提示**：@property 声明 <color> 或 <angle> 类型变量，transition 该变量

**预期效果**：悬停时渐变颜色/角度平滑过渡，而非瞬间跳变

```css
@property --c1 { syntax: '<color>'; inherits: false; initial-value: #4f46e5; }
@property --c2 { syntax: '<color>'; inherits: false; initial-value: #ec4899; }
.gradient {
  background: linear-gradient(135deg, var(--c1), var(--c2));
  transition: --c1 0.5s, --c2 0.5s;
}
.gradient:hover { --c1: #06b6d4; --c2: #8b5cf6; }
```

### 练习 3：三层 Token 体系

**要求**：设计一套 primitive/semantic/component 三层 Token 体系，画出映射图，验证换主题只改 semantic 层

**提示**：primitive 放调色板+间距阶梯，semantic 映射用途，component 引用 semantic

**预期效果**：把 semantic 层的 --color-primary 从蓝改到粉，所有组件自动换色，component 和 primitive 层零改动

```css
/* primitive */
:root { --blue-500: oklch(60% 0.2 250); --pink-500: oklch(65% 0.2 350); --space-4: 16px; }
/* semantic（换主题只改这里） */
:root { --color-primary: var(--blue-500); --spacing-md: var(--space-4); }
/* component */
.btn { background: var(--color-primary); padding: var(--spacing-md); }
```

---

## 本模块完成标准

- [ ] 能解释 oklch 感知均匀的优势，用分量运算派生色板
- [ ] 能用 color-mix 和相对颜色语法派生主题色全状态
- [ ] 能用 @property 实现渐变/颜色过渡动画
- [ ] 能用 color-scheme + light-dark() 实现原生双主题
- [ ] 能设计三层 Token 体系并说明换主题的改动范围
- [ ] 知道 WCAG 对比度标准，了解 color-contrast() 已移除
