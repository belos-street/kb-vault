# CSS — 大纲与学习目标

> 目标：从层叠机制到现代布局，从变换动画到工程化，建立完整且有深度的 CSS 知识体系。
> 参考《深入解析 CSS》（CSS in Depth）的章节颗粒度打牢基础，叠加 2023-2026 现代特性。
> 以 MDN 为权威参考，所有特性标注 Baseline 状态（验证时间：2026-07）。

---

## 学习目标

完成本模块后，你应该能够：

- 准确解释层叠、优先级、继承三大机制，能手算任意选择器（含 :is()/:where()/:has()）的优先级
- 深入理解相对单位与排版，能构建流式字号与间距系统
- 熟练运用背景、渐变、阴影、混合模式构建视觉层次
- 一维布局用 Flex、二维布局用 Grid，掌握 subgrid 与容器查询
- 理解层叠上下文与 z-index 的本质，能用 top-layer / popover 绕开 z-index 治理
- 掌握 2D/3D 变换与高性能动画（transform/opacity 合成层），理解 scroll-driven animations、@starting-style 与 View Transitions
- 掌握 oklch 色彩空间与设计 Token 体系，能用 light-dark() + color-mix 派生完整主题
- 理解原子化 CSS 设计哲学，能落地 Tailwind / UnoCSS
- 掌握 CSS 工程化全链路：PostCSS、预处理器、CSS Modules、CSS-in-JS 的取舍

---

## 前置要求

- HTML 基础（语义化标签、文档流概念）
- 浏览器开发者工具基本使用

---

## 模块详解

### 模块 1：层叠、优先级与继承

> 面试可答："层叠按 来源 → 上下文 → 元素附加 → @layer → 优先级 → 顺序 逐层决策；优先级是 (id, class, 标签) 三元组逐位比较；@layer 让你把'来源顺序'变成可控的声明顺序"

- 层叠（Cascade）的完整决策链（按 MDN 级联排序，前者胜出后者）：
  - 来源与重要性（Origin & Importance）：用户代理 < 用户 < 作者，!important 反转顺序
  - 上下文（Context）：Shadow DOM 的样式隔离
  - 元素附加（Element-Attached）：直接挂在元素上的样式（style 属性、presentational hints）
  - **@layer 级联层**（Baseline 2022）：层的声明顺序决定优先级，未分层样式 > 所有层
  - 优先级（Specificity）与出现顺序
- 优先级深入：
  - 三元组计算：ID / (类+伪类+属性) / (标签+伪元素)
  - :is() / :not() 取参数中最高优先级，:where() 恒为 0
  - :has() 同样取参数最高优先级
  - 内联样式、!important 的真实权重与滥用代价
- 继承：
  - 哪些属性继承（颜色/字体/文本类）、哪些不继承（盒模型/定位类）
  - inherit / initial / unset / revert 四者的差异与适用场景
- 实战：用 @layer 治理第三方库样式覆盖问题

**练习**：

1. 手写优先级计算题 10 道（含 :is()/:where()/:has() 陷阱）
2. 用 @layer 重构一个"reset → 第三方组件 → 业务样式"的覆盖链，验证未分层样式的行为
3. 解释 `all: unset` 与 `all: revert` 在按钮上的差异

---

### 模块 2：选择器与盒模型

> 面试可答：":has() 让 CSS 能'向上选择'父元素（Baseline 2023-12）；全局 border-box 避免 padding 撑破布局；margin 折叠只在块级 BFC 中发生"

- 选择器全谱系：
  - 基础：元素、类、ID、属性（[type="text"]、^= $= *=）、通配符
  - 组合器：后代、子代 `>`、相邻兄弟 `+`、通用兄弟 `~`
  - 状态伪类：:hover / :focus / **:focus-visible**（键盘可访问性）/ :active / :checked / :disabled
  - 结构伪类：:nth-child() / :nth-of-type() / :first-child / :last-child / :empty
  - **父选择器 :has()**（Baseline 2023-12）：表单校验高亮、空状态检测、布局感知
- 伪元素：::before / ::after（content 与清除浮动）、::marker（列表符号）、::selection、::placeholder
- 盒模型：
  - content-box vs border-box，为什么全局 `*, *::before, *::after { box-sizing: border-box }`
  - width/height 的计算：padding + border 的影响
- margin 折叠（Collapsing Margins）：
  - 三种场景：相邻兄弟、父子上溢、空块
  - BFC 触发条件与消除折叠
- **逻辑属性**（Baseline 2022）：
  - margin-inline / padding-block / inset-inline-start
  - 书写模式（writing-mode）与国际化适配
  - 逻辑值：text-align: start/end、inset 简写
- BFC（块级格式化上下文）：触发条件、应用（清除浮动、自适应两栏、防 margin 穿透）

**练习**：

1. 用纯 CSS（:has()）实现：表单含 invalid 输入时禁用并高亮提交按钮
2. 用 BFC 实现两栏布局（左固定右自适应），并解释原理
3. 把一个物理属性布局改写为逻辑属性，切换 writing-mode 验证 RTL 适配

---

### 模块 3：相对单位与排版

> 面试可答："rem 相对根字号、em 相对父级字号（用于 padding 会级联放大）；移动端用 dvh 解决 100vh 遮挡问题；流式排版用 clamp() 一行替代多个断点"

- 相对单位：
  - em 的级联陷阱（嵌套放大）与适用场景（按钮 padding 随字号缩放）
  - rem 与根字号策略（62.5% 技巧：了解其历史即可，不推荐用于生产——破坏用户字号设置、与 rem 语义相悖；推荐用 clamp() 流式根字号）
  - 视口单位：vw/vh、**dvh/svh/lvh**（Baseline 2022，移动端地址栏遮挡问题）
  - 百分比、ch（等宽字符宽度）、ex
  - 单位选择决策树
- 字体与排版：
  - font-family 字体栈与回退策略、系统字体栈
  - **可变字体（Variable Fonts）**：font-variation-settings、单文件多字重
  - @font-face 与字体加载：font-display: swap/optional、FOIT/FOUT、预加载
  - 行高（line-height 无单位值的继承优势）、字间距、text-rendering
  - **font-feature-settings**：连字（liga）、等宽数字（tnum）、旧式数字
- 文本布局：
  - text-overflow / white-space / word-break / overflow-wrap（长单词换行）
  - **text-wrap: balance / pretty**（Baseline 2023-2024）：标题与段落优化
  - 多行截断（-webkit-line-clamp）
- 流式排版：clamp(min, preferred, max) + vw 构建无断点字号体系

**练习**：

1. 用 clamp() 实现 h1~body 全站流式字号（零媒体查询），拖拽窗口验证
2. 接入一个可变字体，用 font-variation-settings 实现字重悬停动画
3. 对比 100vh 与 100dvh 在移动端的表现，用 dvh 实现全屏 Hero

---

### 模块 4：背景、边框、阴影与混合模式

> 面试可答："background 是多重背景叠加（先写的在上层）；box-shadow 不占布局空间、多层叠加模拟真实光照；mix-blend-mode 基于像素颜色混合，配合 isolation 控制作用域"

- 背景系统：
  - background 简写的完整语法与顺序陷阱
  - 多重背景：叠加顺序、独立控制 background-position/size
  - background-size: cover vs contain 与居中裁剪
  - background-attachment: fixed 的视差效果与移动端失效
  - background-origin / background-clip（**background-clip: text 文字渐变**）
- 渐变：
  - linear-gradient / radial-gradient / **conic-gradient**（色轮、饼图、加载环）
  - repeating-* 渐变实现条纹、棋盘格
  - 渐变硬边（color stop 同位置）绘制图形
- 边框与圆角：
  - border-radius 椭圆角（斜杠语法）、border-image（了解）
  - outline vs border（不占空间、focus 环）
- 阴影：
  - box-shadow：偏移、模糊、扩展、内阴影 inset，多层叠加模拟海拔（Material 层级）
  - text-shadow：文字描边、发光、长阴影
- 混合模式（Blend Modes）：
  - mix-blend-mode（multiply/screen/overlay/difference）像素混合原理
  - background-blend-mode
  - **isolation: isolate** 创建独立混合上下文（防止穿透到页面背景）
  - 实战：图片着色、文字镂空、暗色蒙版

**练习**：

1. 纯 CSS（conic-gradient + mask）实现一个环形进度条
2. 用多层 box-shadow 实现 Material Design 的 5 级海拔卡片
3. 用 mix-blend-mode: difference 实现滚动时自动反色的导航栏 Logo

---

### 模块 5：Flexbox

> 面试可答："Flex 是一维布局，核心是主轴/交叉轴 + 弹性分配（grow/shrink/basis）；flex: 1 是 1 1 0% 的简写，basis 为 0 才能严格等分"

- 弹性布局模型：主轴与交叉轴、flex-direction 与书写模式
- 容器属性：
  - justify-content（主轴对齐）、align-items / align-content（交叉轴）
  - flex-wrap 换行与 gap
- 项目属性：
  - flex-grow / flex-shrink / flex-basis 的分配算法（按剩余空间/溢出空间加权）
  - flex 简写：`flex: 1`（1 1 0%）vs `flex: auto`（1 1 auto）vs `flex: none`
  - order 重排与可访问性（视觉顺序 ≠ DOM 顺序）
  - align-self 单独对齐
- 经典场景：
  - 水平垂直居中（三行代码）
  - 等分布局与不等分（2:1）
  - 黏性页脚（flex-grow 撑开）
  - 圣杯/双飞翼布局
  - 导航栏（logo 固定 + 菜单弹性）
- Flex 的局限：一维性、换行后的对齐问题 → Grid 的适用边界

**练习**：

1. 手写实现圣杯布局（header/footer 固定 + 三栏中间自适应）
2. 实现一个可换行的标签云，gap 控制间距，验证换行对齐
3. 解释 `flex: 1` 与 `flex: auto` 在内容不等长时的宽度差异（画图说明）

---

### 模块 6：Grid 布局

> 面试可答："Grid 是二维布局，用 grid-template-areas 做语义化布局、auto-fit + minmax 做响应式网格；subgrid 让子元素对齐父网格轨道（Baseline 2023-09）"

- 网格模型：行/列/轨道/区域/网格线
- 定义网格：
  - grid-template-columns / rows、repeat()、fr 单位（剩余空间分配）
  - **minmax() + auto-fill vs auto-fit**（空轨道折叠的差异）
  - grid-auto-rows 与隐式网格、grid-auto-flow: dense（密集填充）
- 放置项目：
  - grid-column / grid-row（网格线编号、span）
  - **grid-template-areas**：ASCII 艺术式语义布局
  - 负网格线（-1 表示末尾）
- 对齐：justify-items / align-items / justify-content / align-content / place-*
- **subgrid**（Baseline 2023-09）：
  - 子网格继承父轨道：grid-template-columns: subgrid
  - 解决"卡片内部元素跨卡片对齐"的经典难题
- 经典场景：
  - 响应式卡片网格（auto-fit + minmax，零媒体查询）
  - 12 栅格系统
  - 仪表盘（areas 布局）
  - 瀑布流（dense）
- Grid vs Flex 选型：一维 vs 二维、内容驱动 vs 布局驱动

**练习**：

1. 用 auto-fit + minmax 实现响应式相册，验证任意宽度下的列数变化
2. 用 grid-template-areas 实现仪表盘（侧边栏 + 顶栏 + 内容区），媒体查询重排 areas
3. 用 subgrid 实现卡片列表：标题/描述/按钮三行跨卡片严格对齐

---

### 模块 7：浮动、定位与层叠上下文

> 面试可答："z-index 只在层叠上下文内比较，父级上下文决定比较边界；transform/filter/opacity<1 都会创建新层叠上下文——这是'z-index 失效'的根因；现代 popover/dialog 走 top-layer，直接绕开 z-index"

- 浮动（Float）：
  - 浮动的设计初衷（文字环绕）与布局滥用史
  - 清除浮动：clearfix 的原理（BFC）
  - 现代项目中浮动的残留场景（图文环绕）
- 定位模型：
  - static / relative / absolute / fixed / sticky
  - 各自的参照物（包含块）：absolute 相对最近定位祖先、fixed 相对视口
  - sticky 的触发条件（top 阈值 + 滚动容器）与失效场景（父级 overflow）
  - **Anchor Positioning**（部分 Baseline 2026-01，渐进增强）：
    - anchor-name / position-anchor / position-area
    - position-try-fallbacks 自动翻转（tooltip/dropdown 不再需要 JS）
    - 注意：`anchor()` 函数已 Baseline 2026-01，但 `position-anchor` 等部分属性 MDN 仍标 "Limited availability"，使用前请查 MDN 各属性页
- 层叠上下文（Stacking Context）：
  - 创建条件：根元素、定位+z-index、transform、filter、opacity<1、will-change
  - 层叠顺序：背景 → 负 z-index → 块级 → 浮动 → 行内 → z-index:0 → 正 z-index
  - 诊断方法：DevTools 3D 视图 / 逐层排查
- **top-layer 与声明式 overlay**（Popover API，Baseline 2024-04）：
  - `popover` 属性 + `popovertarget` 声明式弹出，无需 JS 控制显隐
  - `::backdrop` 伪元素（Baseline Widely available 2022-03）：遮罩层样式
  - top-layer 机制：元素脱离常规层叠上下文，直接置于最顶层——绕开 z-index 治理
  - light-dismiss：点击外部自动关闭（`popover="auto"`）
  - 与 `<dialog>` showModal 的对比：popover 非模态、dialog 模态
- z-index 治理：
  - 为什么不要用 z-index: 9999
  - 分层命名规范（dropdown 100 / modal 200 / toast 300）
  - 现代替代：优先用 top-layer（popover/dialog）而非手堆 z-index
- 实战：sticky 表头、吸顶导航、模态框层级管理

**练习**：

1. 复现"z-index 失效"场景（父级 transform 创建层叠上下文），画出层叠树解释
2. 用 Anchor Positioning 实现自动翻转的 tooltip（附 @supports 降级方案）
3. 用 popover 属性 + `::backdrop` 实现一个声明式信息卡片弹出，对比 JS 控制显隐的写法
4. 用 sticky 实现表格吸顶表头 + 吸底合计行

---

### 模块 8：响应式设计与容器查询

> 面试可答："媒体查询基于视口、容器查询基于父容器——组件级响应式用 @container（Baseline 2023-02）；移动优先用 min-width 断点；用 @supports 做渐进增强"

- 响应式设计基础：
  - viewport meta 与移动端渲染原理
  - 移动优先（min-width）vs 桌面优先（max-width）
  - 断点策略：内容驱动断点而非设备断点
- 媒体查询：
  - 特性查询：prefers-color-scheme（暗色模式）、prefers-reduced-motion（动画无障碍）
  - 逻辑运算符与范围语法（width >= 768px）
  - hover / pointer 特性（触屏 vs 鼠标适配）
- **容器查询**（Baseline 2023-02）：
  - container-type: inline-size、container-name
  - @container 语法与嵌套查询
  - 容器查询 vs 媒体查询的选型：页面级 vs 组件级
  - 实战：同一卡片组件在主内容区横排、侧边栏竖排
- 流式设计：
  - clamp() 流式字号/间距（呼应模块 3）
  - 响应式图片：srcset / sizes、<picture>、aspect-ratio 防布局偏移（CLS）
- 渐进增强：@supports 特性检测与回退策略
- 暗色模式完整方案：
  - `color-scheme: light dark` 声明可用配色方案（前置条件）
  - **`light-dark()` 函数**（Baseline 2024-05）：`color: light-dark(#333, #efefec)` 一行替代双份媒体查询
  - prefers-color-scheme + 手动切换 + localStorage 持久化
  - 新旧对比：旧方案（每个颜色写两份 @media）vs 新方案（light-dark 一行 + color-scheme 驱动）

**练习**：

1. 实现一个"位置无关"的卡片组件：仅用容器查询适配宽/窄容器
2. 用 `color-scheme: light dark` + `light-dark()` 实现暗色模式切换（系统偏好 + 手动覆盖 + localStorage 持久化）
3. 用 aspect-ratio + object-fit 实现图片画廊，验证无布局偏移

---

### 模块 9：变换（Transform）

> 面试可答："transform 不改变文档流、只影响视觉呈现，走合成线程；3D 变换靠 perspective 提供景深，transform-style: preserve-3d 让子元素保持 3D 位置"

- 2D 变换：
  - translate / rotate / scale / skew
  - 变换顺序的影响（先平移后旋转 vs 先旋转后平移）
  - transform-origin 变换基点
  - 百分比参照物（translate 相对自身尺寸 → 居中技巧）
- 3D 变换：
  - perspective 景深（值越小透视越强）、perspective-origin
  - rotateX/Y/Z、translateZ
  - **transform-style: preserve-3d** 与 3D 空间保持
  - backface-visibility（卡片翻转正反面）
- 变换的合成与性能：
  - transform 触发合成层（composite），不引起重排/重绘
  - will-change: transform 的提升与副作用（内存占用）
- 经典场景：
  - 居中（translate(-50%, -50%)）
  - 卡片 3D 翻转
  - 立方体 / 旋转木马
  - 视差滚动（translateZ + scale 补偿）

**练习**：

1. 用 preserve-3d + backface-visibility 实现 3D 卡片翻转
2. 用纯 CSS 实现一个旋转的 3D 立方体（六面体）
3. 对比 translate 居中与 margin auto 居中的适用场景

---

### 模块 10：过渡与动画

> 面试可答："transition 是两态之间的补间、animation 用 @keyframes 支持多关键帧与循环；只动画 transform/opacity 走合成线程；scroll-driven animations 把进度绑定到滚动，零 JS 实现视差；@starting-style 让 display:none→block 也能过渡"

- 过渡（Transition）：
  - transition-property / duration / timing-function / delay
  - 缓动函数：ease 系列与 **cubic-bezier 自定义曲线**（手写回弹效果）
  - 多属性过渡与 all 的性能陷阱
  - 过渡的触发条件（计算值变化）与不可过渡属性（display）
- 动画（Animation）：
  - @keyframes 多关键帧、from/to
  - animation-iteration-count / direction（alternate）/ fill-mode（forwards/both）
  - 逐帧动画 steps() 与精灵图
  - **linear() 自定义缓动**（Baseline 2023）
- 性能模型与渲染优化：
  - 渲染流水线：JS → Style → Layout（重排）→ Paint（重绘）→ Composite（合成）
  - 为什么只动画 transform/opacity
  - **content-visibility**（Baseline 2024-09）：跳过视口外元素的布局与绘制，长列表首屏性能关键
  - **contain** 属性：layout/paint/style/size 局限，配合 content-visibility 使用
  - Chrome DevTools Performance 面板诊断掉帧、Rendering 面板查 paint flashing
- **@starting-style**（Baseline 2024-08）：
  - 为首次渲染/`display: none → block` 提供过渡起点值
  - 配合 `transition-behavior: allow-discrete` 让 display/overlay 可过渡
  - 三态模型：starting-style 状态 → 过渡目标状态 → 默认状态（进入与退出可不同）
  - 实战：dialog / popover / 抽屉的进入退出动画（零 JS 补间）
- **Scroll-Driven Animations**（Chrome 115+ / Safari 26+，Firefox 仍在 flag 后、非 Baseline，渐进增强）：
  - animation-timeline: scroll()（滚动进度）/ view()（元素可见性）
  - animation-range 控制触发区间
  - 零 JS 实现：阅读进度条、滚动显现、视差
  - IntersectionObserver 降级方案
- **View Transitions API**：
  - Level 1（同文档）：document.startViewTransition()、view-transition-name
  - Level 2（跨文档 @view-transition）：Chrome 126+ / Safari 18.2+，Firefox 仍未支持
  - 列表→详情共享元素过渡
- 无障碍：prefers-reduced-motion 降级

**练习**：

1. 用 @starting-style + transition-behavior: allow-discrete 实现 popover/dialog 的进入退出动画
2. 纯 CSS 实现阅读进度条（scroll()）+ 卡片滚动显现（view()），附 IO 降级
3. 用 View Transitions 实现列表→详情的共享元素过渡 demo
4. 用 content-visibility: auto 优化一个长列表页面，用 Performance 面板对比 top/left 动画 vs transform 动画的帧率，截图说明

---

### 模块 11：颜色体系与设计 Token

> 面试可答："oklch 是感知均匀色彩空间，色相/色度/明度分离，适合派生主题色；color-mix 做明暗混合；light-dark() 一行搞定双主题；@property 给变量加类型，让渐变和颜色可过渡"

- 颜色模型：
  - sRGB（hex/rgb/hsl）的局限：hsl 明度不均匀（黄色显亮、蓝色显暗）
  - **oklch / oklab**（Baseline 2023）：感知均匀、L/C/H 分离
  - P3 广色域与 color() 函数（了解）
- 颜色派生：
  - **color-mix()**（Baseline 2023-05）：明暗调整、透明度混合、两色插值
  - **相对颜色语法**：`oklch(from var(--primary) calc(l + 0.1) c h)`
  - 用单一主色派生 hover/active/disabled/border 全状态
- 自定义属性（CSS Variables）：
  - 声明、继承、作用域（:root vs 组件级）
  - var() 回退值、与 JS 交互（getComputedStyle / setProperty）
- **@property**（Baseline 2024-07）：
  - 类型化自定义属性（syntax: '<color>' / '<angle>' / '<length>'）
  - 让渐变角度、颜色可过渡（gradient animation）
- **light-dark()**（Baseline 2024-05）：
  - 配合 `color-scheme: light dark` 实现原生双主题切换
  - 与 color-mix 组合派生明暗语义色
- 设计 Token 体系：
  - 语义化分层：primitive（raw 值）→ semantic（用途）→ component（组件级）
  - 间距系统（4px/8px 基准）、圆角、阴影层级
- 对比度与可访问性：WCAG AA/AAA 标准；注意 `color-contrast()` 已从 CSS Color Level 5 规范移除，自动取色需用 JS 计算 WCAG 对比度

**练习**：

1. 用 oklch + color-mix + light-dark() 从单个主色派生完整主题色板（含暗色模式）
2. 用 @property 实现渐变背景色过渡动画（原生 CSS，无 JS）
3. 设计一套三层 Token 体系（primitive/semantic/component），画出映射图

---

### 模块 12：模块化、原子化与工程化

> 面试可答："CSS Modules 编译时哈希隔离、CSS-in-JS 运行时作用域但有性能代价（React 19 下 styled-components 不兼容 RSC）；零运行时方案（vanilla-extract）是趋势；原子化把样式决策收敛到 HTML，消除命名与死代码"

- 模块化 CSS 思想：
  - BEM 命名规范（Block__Element--Modifier）与适用边界
  - ITCSS / SMACSS 分层架构（了解）
- CSS Modules：
  - 编译时类名哈希隔离、composes 复用
  - 与 Vite/webpack 集成、camelCase 导出
- CSS-in-JS：
  - styled-components / Emotion：运行时方案原理（动态类名生成）与性能代价
  - 零运行时方案：vanilla-extract（类型安全、构建时提取）、Linaria
  - React 19 / RSC 对 CSS-in-JS 的冲击
- 原子化 CSS：
  - 设计哲学：样式决策收敛到 HTML、消除命名/覆盖/死代码
  - Tailwind v4：CSS-first 配置（@theme）、Rust 引擎、变体系统（hover:、group、data-*）
  - UnoCSS：即时按需生成、attributify 模式、shortcuts、纯 CSS 图标
  - @apply 的克制使用、何时抽组件 class
- PostCSS：
  - 管道模型：parser → AST → plugin → stringifier
  - 核心插件：autoprefixer / postcss-preset-env / cssnano
  - 手写一个 PostCSS 插件
- 预处理器：
  - Sass：@use vs @import（已废弃）、mixin、函数
  - 原生 CSS 能力追赶（嵌套/变量/计算已原生化）→ 预处理器的未来
- **原生 CSS 嵌套**（Baseline 2023）：& 选择器、与 Sass 嵌套的差异（隐式 vs 显式 &）
- 方案选型矩阵：项目规模 × 团队 × SSR 需求 → 推荐方案

**练习**：

1. 手写 PostCSS 插件：自动给颜色值生成暗色模式映射
2. 同一组件分别用 CSS Modules / Emotion / vanilla-extract 实现，对比产物与 DX
3. 用 Tailwind 复刻一个真实产品卡片（hover 态 + 响应式 + 暗色模式），再用 UnoCSS attributify 重写对比

---

## CSS 调试方法工具链

> 贯穿各模块的调试能力，与"能诊断任意问题"的学习目标对齐。

- **Elements 面板**：查 computed 值、级联来源（哪条规则胜出）、盒模型可视化
- **Layers 面板**：查看 @layer 分层与优先级（Chrome DevTools）
- **3D 视图**：诊断层叠上下文树、z-index 层级错乱
- **Performance 面板**：渲染流水线掉帧诊断、重排/重绘定位
- **Rendering 面板**：paint flashing（重绘高亮）、layout shift 区域、FPS meter
- **Animations 面板**：时间轴调试 transition/animation、修改缓动
- **Container 查询调试**：DevTools 显示容器查询断点与匹配状态

---

## 实践项目

| 项目 | 覆盖模块 | 说明 |
|------|----------|------|
| 响应式 Landing Page | 1-3, 8 | 纯 HTML/CSS，流式排版 + 容器查询 + light-dark() 暗色模式 |
| 视觉画廊 | 4, 9, 10 | 渐变/混合模式 + 3D 变换 + scroll-driven 动画 |
| 后台仪表盘 | 5-7 | Grid areas 布局 + subgrid 卡片 + sticky 表头 + popover 弹层 |
| 设计系统 Demo | 11, 12 | Token 体系 + Tailwind/UnoCSS + 文档站 |
| 现代交互组件库 | 7, 10 | popover + @starting-style 进入退出动画 + View Transitions 列表详情过渡 |

---

## 总时间线

| 模块 | 预计时间 |
|------|----------|
| 模块 1：层叠、优先级与继承 | 2 天 |
| 模块 2：选择器与盒模型 | 2 天 |
| 模块 3：相对单位与排版 | 2-3 天 |
| 模块 4：背景、边框、阴影与混合模式 | 2 天 |
| 模块 5：Flexbox | 2 天 |
| 模块 6：Grid 布局 | 2-3 天 |
| 模块 7：浮动、定位与层叠上下文 | 2-3 天 |
| 模块 8：响应式设计与容器查询 | 2 天 |
| 模块 9：变换（Transform） | 1-2 天 |
| 模块 10：过渡与动画 | 3 天 |
| 模块 11：颜色体系与设计 Token | 2 天 |
| 模块 12：模块化、原子化与工程化 | 3 天 |
| 实践项目 | 5-6 天 |
| **合计** | **约 5-7 周** |

---

## 完成标准

- [ ] 能手算含 :is()/:where()/:has() 的选择器优先级，能用 @layer 治理样式覆盖
- [ ] 能用 em/rem/dvh/clamp 构建流式字号与间距系统
- [ ] 能用多重背景、conic-gradient、混合模式构建复杂视觉
- [ ] 任意布局需求能在 10 分钟内用 Flex/Grid 实现
- [ ] 能画出任意场景的层叠上下文树，诊断 z-index 问题；能用 top-layer/popover 绕开 z-index
- [ ] 能用容器查询写出与放置位置无关的自适应组件
- [ ] 掌握 3D 变换与合成层动画，能用 Performance 面板证明无重排
- [ ] 能用 @starting-style 实现 display:none→block 的进入退出动画
- [ ] 掌握 scroll-driven animations 与 View Transitions 的渐进增强写法
- [ ] 能用 @property + oklch + color-mix + light-dark() 构建完整主题 Token 体系
- [ ] 能根据项目特征选择模块化/原子化/CSS-in-JS 方案并说明理由
- [ ] 完成 5 个实践项目

---

## 参考资源

- [MDN CSS](https://developer.mozilla.org/zh-CN/docs/Web/CSS) — 权威参考，所有特性以此为准
- 《深入解析 CSS》（CSS in Depth, Keith Grant）— 基础体系参考书
- [web.dev Learn CSS](https://web.dev/learn/css) — Google 官方课程
- [CSS-Tricks](https://css-tricks.com/) — 技巧与实战
- [Can I Use](https://caniuse.com/) — 兼容性查询
- [Modern CSS Solutions](https://moderncss.dev/) — 现代 CSS 实战
