# JavaScript Core 大纲

> 定位：**ECMAScript 语言本体**的系统化深挖——不是入门教程，而是面向资深前端的"源码级"知识重整：规范依据、引擎行为、面试高频深挖点。
> 边界：浏览器宿主 API（DOM/BOM/Fetch/WebSocket）归 [front/javascript](../../../front/javascript)，Node/Bun 运行时 API 归同级的 `node/`、`bun/` 目录。

---

## 🎯 学习目标

- 每个语言机制都能回答三层问题：**是什么 → 规范怎么定义 → 引擎怎么实现**
- 类型转换、作用域闭包、原型链、事件循环、Promise 五大核心机制达到"白板手写 + 源码级解释"水平
- 掌握 ES2015→ES2026 的演进脉络，能说出每个新特性解决的痛点与兼容策略
- 建立"规范（ECMA-262）→ MDN → 引擎实现（V8）"的三层知识索引，遇到模糊问题知道去哪查证

---

## 🧭 内容边界（写文档前先对齐）

| 内容 | 归属 | 说明 |
|------|------|------|
| ECMAScript 语法、类型、内置对象（RegExp/Date/JSON/Math） | ✅ 本模块 | ECMA-262 规范定义的都是 core |
| 事件循环模型（通用机制） | ✅ 本模块 | 规范 + 通用模型为主 |
| Node/Bun 事件循环差异（process.nextTick、I/O 阶段） | `../node/`、`../bun/` | 本模块只留交叉链接 |
| DOM/BOM/Fetch/WebSocket/SSE/Worker | [front/javascript](../../../front/javascript) | 宿主 API，非语言本体 |
| setTimeout/setInterval/console | front/javascript/web-apis | 属 HTML 规范而非 ECMA-262 |
| 模块化打包、Polyfill 工程（Babel/browserslist） | front/javascript/engineering | 本模块只讲 ESM 语言机制 |

---

## 🗺️ 学习路径（十篇递进）

```mermaid
flowchart LR
    A[01 语言与规范演进] --> B[02 类型与转换]
    B --> C[03 内置对象]
    C --> D[04 作用域与闭包]
    D --> E[05 函数与 this]
    E --> F[06 对象与原型]
    F --> G[07 事件循环与异步]
    G --> H[08 迭代器与元编程]
    H --> I[09 模块系统]
    I --> J[10 内存与 GC]
```

| # | 文档 | 内容 | 面试权重 |
|---|------|------|:---:|
| 01 | `doc/01-language-and-spec-evolution.md` | 语言全景与 ES 新规范演进（TC39、ES2015→ES2026 特性地图、提案前瞻） | ⭐⭐ |
| 02 | `doc/02-types-and-coercion.md` | 8 种类型、装箱拆箱、类型转换规则、`==` 算法、Symbol/BigInt | ⭐⭐⭐ |
| 03 | `doc/03-builtin-objects.md` | RegExp / Date / JSON / Math / Error / TypedArray 的机制与坑 | ⭐⭐ |
| 04 | `doc/04-scope-and-closure.md` | 词法环境、作用域链、TDZ、闭包本质与经典陷阱 | ⭐⭐⭐ |
| 05 | `doc/05-functions-and-this.md` | 函数对象、this 绑定规则、call/apply/bind、new 的执行流程 | ⭐⭐⭐ |
| 06 | `doc/06-objects-and-prototype.md` | 内部方法、原型链查找、class 语法糖、私有成员、继承模式 | ⭐⭐⭐ |
| 07 | `doc/07-event-loop-and-async.md` | 事件循环、Promise 状态机与手写实现、async/await、并发模式 | ⭐⭐⭐ |
| 08 | `doc/08-iterators-and-metaprogramming.md` | 迭代协议、Generator、Iterator Helpers、Proxy/Reflect、Symbol 元钩子 | ⭐⭐ |
| 09 | `doc/09-module-system.md` | ESM vs CJS、加载机制、循环依赖、顶层 await、Import Attributes | ⭐⭐ |
| 10 | `doc/10-memory-and-gc.md` | V8 堆结构、分代 GC、内存泄漏识别、WeakRef/FinalizationRegistry | ⭐⭐ |

> 文档写完后把本表文件名升级为 `[[doc/0x-xxx|标题]]` wiki 链接（写之前先保持纯文本，避免死链）。

---

## 各篇要点与 MDN 对照

### 01 语言与规范演进 ★ ES 新规范专篇

- ECMAScript vs JavaScript：规范与实现的关系；引擎格局（V8 / JavaScriptCore / SpiderMonkey）
- TC39 提案流程：Stage 0~4 各阶段含义；每年 6 月发布新版本的节奏
- **ES2015→ES2026 特性地图**（每年挑 3~5 个代表性特性讲"解决什么问题"）：
  - ES2015（ES6）：let/const、class、Promise、Generator、ESM、Proxy、Symbol——现代 JS 的起点
  - ES2016~ES2022 精选：async/await（ES2017）、可选链/空值合并（ES2020）、top-level await 之外的 `at()`/Error.cause（ES2022）
  - ES2023：`findLast`、不可变数组四件套（`toReversed/toSorted/toSpliced/with`）、Hashbang
  - ES2024：`Object.groupBy/Map.groupBy`、`Promise.withResolvers`、`String.prototype.isWellFormed`、Atomics.waitAsync
  - **ES2025**：Set 集合运算（union/intersection 等 7 个方法）、Iterator Helpers、`Promise.try`、`RegExp.escape`、Import Attributes（`with { type: 'json' }`）、Float16Array + `Math.f16round`、正则内联标志 `(?i:...)`、重复命名捕获组
  - **ES2026**（2026-06-30 批准）：Temporal、`Math.sumPrecise`、Uint8Array 原生 base64/hex、`Error.isError`、`Iterator.concat`、`Map.getOrInsert/getOrInsertComputed`、`Array.fromAsync`、JSON.parse source text access、`using`/`await using`（显式资源管理）
- 前瞻与警示：`import defer`、Decorators（Stage 3）、Pattern Matching（Stage 1）；Record & Tuple 已撤回（教训：Stage 3 不等于稳了）
- 兼容策略：Baseline、特性检测 vs UA、polyfill 与转译的分工（细节交叉链接 engineering）
- MDN：[JavaScript 语言概述](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)、[Temporal](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Temporal)

### 02 类型与转换

- 7 原始类型 + Object；`typeof` 的历史性 bug（`typeof null`）
- 装箱拆箱：原始值如何调用方法；`ToPrimitive`（hint: number/string/default）
- 转换规则矩阵：ToBoolean / ToNumber / ToString 逐一过（`[] + {}` 全家桶）
- `==` 抽象相等算法流程图 vs `===` vs `Object.is`（`NaN`、`+0/-0`）
- Symbol（含全局注册表 `Symbol.for`）、BigInt 与 Number 互操作边界
- MDN：[数据类型与结构](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures)、[等值比较与相等判断](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Equality_comparisons_and_sameness)、[类型转换](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Type_conversion)

### 03 内置对象

- RegExp：执行上下文与 `lastIndex`（g 标志的坑）、具名捕获组、v 标志与 Unicode 属性、性能（回溯与 ReDoS 概念）
- Date：可变性原罪、月份 0 起、时区行为；Temporal 替代路线（对照 01 篇）
- JSON：`stringify` 的 toJSON/replacer/undefined 丢失、`parse` reviver；ES2026 source text access
- Math / Error（cause、自定义错误类、ES2026 `Error.isError`）/ TypedArray 与 ArrayBuffer 视图模型（ES2026 base64/hex）
- MDN：[内置对象参考](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects)

### 04 作用域与闭包

- 词法环境（Lexical Environment）与环境记录；作用域链查找
- var/let/const 差异的本质（提升 + TDZ）；块级作用域
- 闭包 = 函数 + 其词法环境：内存视角（被捕获变量存活在堆上）
- 经典陷阱：循环中的 var/let、闭包引用可变变量、面试官最爱的 `for + setTimeout`
- 闭包应用：私有状态、模块模式 → 与 09 篇 ESM 呼应
- MDN：[闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures)

### 05 函数与 this

- 函数是一等对象：length/name 属性、剩余参数、默认参数的作用域细节
- this 绑定优先级：显式（call/apply/bind）> 隐式（obj.fn()）> 默认；箭头函数的词法 this
- 手写 bind（含 new 场景的边界行为）
- new 的完整执行流程（四步）→ 为 06 篇原型链铺垫
- 尾调用优化：规范要求与引擎现实（V8 不实现、JSC 实现）
- MDN：[this](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/this)、[函数指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Functions)

### 06 对象与原型

- 对象的本质：内部方法（`[[Get]]/[[Set]]/[[DefineOwnProperty]]`）与属性描述符
- 原型链：`[[Prototype]]`、`__proto__` vs `prototype` 的关系图；查找算法与遮蔽
- `instanceof` 原理（含 `Symbol.hasInstance` 自定义）、`Object.create`、`getPrototypeOf`
- class 是语法糖：constructor/methods/static/私有字段（#x）/static 块/`extends` 的 [[Construct]] 差异
- 继承模式演进：原型链 → 寄生组合 → class；为什么组合优于继承（举例）
- 拷贝语义：浅拷贝（assign/spread）vs `structuredClone`（宿主 API，交叉链接）
- MDN：[继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)、[对象详解](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Working_with_objects)

### 07 事件循环与异步 ★ 面试最重

- 调用栈 + 任务队列模型：微任务（Promise/mutation 之外的语言级队列）vs 宏任务（宿主层）的归属澄清
- Promise 状态机：pending/fulfilled/rejected 不可逆；then 的规范要求（Promise/A+ 要点）
- **手写 mini Promise**（then 链、值穿透、微任务调度）——本篇核心练习
- async/await 本质：generator + 自动执行器的语法糖；错误传播路径
- 并发模式：all/race/allSettled/any 语义差异；`withResolvers`、`Promise.try`（ES2024/2025）
- 异步迭代：`for await...of`、async generator；`Array.fromAsync`（ES2026）
- 交叉链接：Node/Bun 事件循环差异 → `../node/`；AbortSignal → front/javascript/web-apis
- MDN：[事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop)、[Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)、[异步编程](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Asynchronous)

### 08 迭代器与元编程

- 迭代协议：iterable vs iterator；`Symbol.iterator`；for...of / 展开 / 解构的依赖关系
- Generator：执行上下文暂停/恢复、yield* 委托、协程式通信（next 传值）
- Iterator Helpers（ES2025）：惰性求值 vs 数组方法的中间数组开销；`take` + 无限生成器
- Proxy/Reflect：13 个陷阱与 Reflect 配对原因；应用（观察器、负索引数组、校验）
- Symbol 元钩子：toPrimitive（回扣 02 篇）、hasInstance、isConcatSpreadable、species
- MDN：[迭代器与生成器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_generators)、[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)、[Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)

### 09 模块系统

- ESM vs CJS：值拷贝 vs 绑定引用、静态 vs 动态、双份缓存
- 加载三阶段：解析（构建模块图）→ 实例化（建绑定）→ 求值；为什么 ESM 循环依赖能拿到"活的绑定"
- 循环依赖实战：ESM 的 TDZ 式崩溃案例与 CJS 的半加载对象
- 顶层 await 的传播语义；`import.meta`
- Import Attributes 与 JSON 模块（ES2025）；`import defer` 前瞻
- 交叉链接：打包器的模块解析（Vite/webpack）→ front/javascript/engineering
- MDN：[JavaScript 模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)

### 10 内存与 GC

- 内存生命周期；V8 堆结构：新生代（Scavenge/复制）vs 老生代（Mark-Sweep/Mark-Compact）
- 四种经典泄漏模式：全局引用、未清理的定时器/监听器（宿主侧，交叉链接）、闭包持有大对象、分离 DOM（前端侧，交叉链接）
- 弱引用家族：WeakMap/WeakSet 的键为何必须是对象；WeakRef + FinalizationRegistry 的适用场景（缓存）与不保证语义
- 排查工具：DevTools Memory 面板三种快照（Heap snapshot / Allocation sampling / Allocation timeline）
- MDN：[内存管理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_management)、[WeakRef](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)

---

## 🕹️ 综合练习：语言机制实验室

采用 Bun + TypeScript（strict）+ bun test，练习随各篇文档落地。核心题目：

| 练习 | 配套篇目 | 考察点 |
|------|---------|--------|
| 手写 mini Promise（then 链 + 微任务） | 07 | 状态机、then 规范 |
| 手写 new / bind / instanceof | 05 / 06 | 构造流程、原型查找 |
| 并发限制调度器（maxConcurrency） | 07 | async/await、队列 |
| Proxy 实现响应式对象（get 追踪） | 08 | 元编程 |
| 无限 Generator + Iterator Helpers 取前 N 项 | 08 | 惰性求值 |
| 循环依赖最小复现（ESM vs CJS） | 09 | 加载机制 |
| WeakMap 缓存 + FinalizationRegistry 日志 | 10 | 弱引用语义 |

---

## 🗓️ 建议时间线（系统化复习节奏，每天 1~2 小时）

| 阶段 | 篇目 | 备注 |
|------|------|------|
| 第 1 天 | 01 规范演进 | 建立版本地图，后续每篇遇到的新特性回扣此篇 |
| 第 2-3 天 | 02 类型 + 03 内置对象 | 类型转换矩阵动手过一遍 |
| 第 4-5 天 | 04 闭包 + 05 this | 手写 bind，画出词法环境链 |
| 第 6-7 天 | 06 原型 + 07 异步 | **最重两块**，手写 mini Promise |
| 第 8 天 | 08 迭代器与元编程 | 用 Bun 跑 Iterator Helpers |
| 第 9 天 | 09 模块 + 10 GC | 模块写循环依赖复现 |
| 第 10 天 | 综合练习收尾 + 面试题库自测 | 每篇的"面试回答模板"过一遍 |

---

## ✅ 完成标准

- [ ] 能画出 `[] + {}`、`{} + []` 的求值路径并解释结果差异
- [ ] 能用词法环境解释任意闭包题，包括循环场景
- [ ] 能口述 this 四条绑定规则及优先级，手写 bind 通过 new 场景测试
- [ ] 能画出任意对象的原型链，解释 `instanceof` 与私有字段的存在意义
- [ ] **能白板手写 mini Promise**，解释微任务调度时机
- [ ] 能说清 async/await 与 generator 的关系、`Promise.all/race/allSettled/any` 差异
- [ ] 能用 Proxy 实现一个有实际用途的元编程案例
- [ ] 能解释 ESM 循环依赖为什么能拿到活绑定，CJS 为什么不行
- [ ] 能列举 V8 分代 GC 流程与四种泄漏模式，会用 Memory 面板验证
- [ ] 能按版本说出 ES2023/2024/2025/2026 各 3 个以上特性及其解决的痛点

---

## 📝 单篇文档格式

遵循仓库统一结构：

```markdown
# XX - 标题

> 对应大纲篇目 XX | 面试可答：一句话总结

## 学习目标
## 核心概念（含完整可运行代码）
## 常见踩坑点
## 面试高频问题
## 面试回答模板（> **问：** 格式）
## 练习（要求 + 提示 + 预期效果）
## 本模块完成标准
```

---

## 🔗 推荐资源

- [MDN JavaScript 指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide) / [参考索引](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference) — 每篇文档的第一参照
- [ECMA-262 规范（Living Standard）](https://tc39.es/ecma262/) — 模糊问题的最终裁判
- [TC39 提案列表](https://github.com/tc39/proposals) / [tc39.es](https://tc39.es/) — 跟踪新特性进度
- [V8 官方博客](https://v8.dev/blog) — 引擎实现细节（GC、性能、新特性落地）
- [Exploring ES6](https://exploringjs.com/es6/)（Axel Rauschmayer）— ES6 机制深挖经典
- [You Don't Know JS Yet](https://github.com/getify/You-Dont-Know-JS) — 作用域/闭包/this 的深挖参照
- [compat-table](https://kangax.github.io/compat-table/esnext/) / [Baseline](https://web-platform-dx.github.io/web-features/) — 新特性兼容性查询

---

*最后更新：2026年8月*
