# 程序分析学习大纲（静态分析方向 · 技术实战向）

> 以「用 TypeScript 实现一个 JS/TS 迷你静态分析器」为实战主线，覆盖 AST 分析、类型系统、控制流分析、数据流分析、抽象解释、过程间分析、污点分析七大核心模块。侧重分析框架的理解与工程应用，最终能独立编写 ESLint 规则、理解 TypeScript checker 架构、实现基础安全扫描。

---

## 📌 元信息

| 项目 | 说明 |
|------|------|
| **定位** | 静态分析 / 程序分析方向，技术实战向，非纯形式化验证 |
| **目标读者** | 有编译原理基础（Lexer/Parser/AST/CFG/数据流概念）、想深入静态分析方向的工程师 |
| **前置知识** | 编译原理大纲第 1-10 章（尤其是 AST、类型检查、CFG、数据流分析、SSA、JIT 分层编译） |
| **实现语言** | TypeScript（利用 TS Compiler API 做分析对象，同时用 TS 实现分析器） |
| **分析对象** | JavaScript / TypeScript 源码 |
| **参考书** | Nielson《Principles of Program Analysis》/ Aho《编译原理》第 9-10 章 / TypeScript 源码 |
| **关联大纲** | [compiler-learning-outline.md](../compiler/compiler-learning-outline.md) — 共享 CFG、数据流、类型系统基础 |

---

## 🎯 学习目标

完成本模块学习后，你应该能够：

1. 理解程序分析的核心权衡：可靠性（Soundness）vs 完备性（Completeness）、过近似 vs 欠近似
2. 熟练使用 AST 遍历/变换技术开发 Lint 规则和 Codemod 工具
3. 深入理解 TypeScript 类型检查器的架构（checker.ts 的 5 万行在做什么）
4. 掌握数据流分析的通用框架（格、不动点、gen/kill），能手动推导经典分析问题的解
5. 理解抽象解释的核心思想：在抽象域上计算程序所有可能行为的近似
6. 理解过程间分析（调用图、上下文敏感性）的基本方法
7. 实现基础污点分析：追踪不可信数据从 source 到 sink 的传播
8. 能使用 CodeQL / Semgrep 编写自定义安全查询规则
9. 产出一个可运行的迷你静态分析器项目

---

## 🗺️ 学习路径

| 阶段 | 章节 | 主题 | 产出 |
|------|------|------|------|
| **基础** | 第 1 章 | 程序分析导论与数学基础 | 理解分析框架的理论边界 |
| **基础** | 第 2 章 | AST 级分析实战 | ESLint 自定义规则 + ts-morph 脚本 |
| **核心** | 第 3 章 | 类型系统与类型检查 | 理解 TS checker 架构，实现迷你类型检查器 |
| **核心** | 第 4 章 | 控制流分析深入 | CFG 构造器 + 支配树 + 可达性分析 |
| **核心** | 第 5 章 | 数据流分析框架 | Worklist 算法实现 + 四个经典分析 |
| **进阶** | 第 6 章 | 抽象解释 | 符号分析（Sign Analysis）实现 |
| **进阶** | 第 7 章 | 过程间分析与调用图 | 调用图构造 + 上下文敏感分析 |
| **进阶** | 第 8 章 | 污点分析与安全应用 | 迷你污点分析器 + CodeQL/Semgrep 实战 |
| **实战** | 第 9 章 | 综合项目：迷你静态分析器 | 完整项目（规则引擎 + 多分析器 + CLI） |
| **实战** | 第 10 章 | 工业级工具对标与进阶路线 | 架构对标 + 进阶方向规划 |

---

## 📚 文档目录规划

```text
src/computer-science/program-analysis/
├── program-analysis-learning-outline.md      # 本文件（学习大纲）
├── doc/
│   ├── 01-introduction-and-foundations.md    # 程序分析导论与数学基础
│   ├── 02-ast-based-analysis.md              # AST 级分析实战
│   ├── 03-type-systems.md                    # 类型系统与类型检查
│   ├── 04-control-flow-analysis.md           # 控制流分析深入
│   ├── 05-data-flow-analysis.md              # 数据流分析框架
│   ├── 06-abstract-interpretation.md         # 抽象解释
│   ├── 07-interprocedural-analysis.md        # 过程间分析与调用图
│   ├── 08-taint-analysis-and-security.md     # 污点分析与安全应用
│   ├── 09-capstone-mini-analyzer.md          # 综合项目：迷你静态分析器
│   └── 10-industrial-tools-and-beyond.md     # 工业级工具对标与进阶路线
└── assets/                                   # 格图、CFG 示例、分析结果截图
```

---

## 📖 各章知识点细化

### 第 1 章：程序分析导论与数学基础（难度：⭐⭐）

**理论部分：**

- 什么是程序分析：
  - 在不执行程序的情况下，推导程序的行为性质
  - 静态分析 vs 动态分析 vs 混合分析（Hybrid）
  - 应用场景：编译器优化、Bug 检测、安全扫描、代码质量、IDE 智能提示
- **核心权衡**：
  - 可靠性（Soundness）：分析结果不会漏报（可能有误报）
  - 完备性（Completeness）：分析结果不会误报（可能有漏报）
  - Rice 定理：非平凡的程序性质不可判定 → 必须做近似
  - 过近似（Over-approximation）：安全分析（宁可误报，不可漏报）
  - 欠近似（Under-approximation）：Bug 复现（找到一个真实 Bug）
- **数学基础**：
  - 偏序集（Poset）与格（Lattice）：
    - 偏序关系 ⊑、上确界（⊔）、下确界（⊓）
    - 完全格（Complete Lattice）：任意子集有上确界和下确界
    - 升链条件（ACC）：保证不动点迭代终止
  - 不动点定理（Tarski / Knaster-Tarski）：
    - 单调函数在完全格上必有最小不动点
    - 不动点迭代：从 ⊥ 开始，反复应用 F 直到收敛
  - 单调性（Monotonicity）：分析函数必须单调，否则不收敛
- 程序分析的层次：
  - 语法级（AST pattern matching）→ 语义级（类型/作用域）→ 流敏感（CFG/数据流）→ 路径敏感 → 上下文敏感
  - 精度与成本的递增关系
- 真实工具谱系：
  - Pattern matching：ESLint、Semgrep、ast-grep
  - 类型检查：TypeScript、Flow、mypy
  - 数据流分析：ESLint（部分规则）、SonarQube
  - 抽象解释：Astrée、Infer（Facebook）
  - 符号执行：KLEE、Z3
  - 综合平台：CodeQL、Snyk、Coverity

**动手环节：**

- 用格图画出布尔格（{⊥, true, false, ⊤}）和符号格（Sign Lattice）
- 手动验证：给定一个简单函数，用不动点迭代计算到达定义的不动点
- 安装并运行 ESLint、Semgrep，体验不同层次的分析工具

**验证标准：** 能解释"为什么静态分析必须做近似"，能画出 Sign Lattice 的格图

---

### 第 2 章：AST 级分析实战（难度：⭐⭐）

**理论部分：**

- AST 分析的定位：
  - 最轻量级的分析：不需要 CFG、不需要类型信息
  - 适用场景：代码风格、简单模式匹配、结构约束
  - 局限：无法处理跨语句/跨函数的数据流
- ESLint 架构：
  - 解析器（espree / @typescript-eslint/parser）→ AST
  - 规则（Rule）：监听节点类型（Visitor 模式）
  - `context.report()`：报告问题
  - Fixer：自动修复（AST 变换）
- ts-morph（TypeScript Compiler API 封装）：
  - 比 ESLint 更强的类型信息访问
  - `Node.getType()`、`Symbol.getDeclarations()`
  - 适用场景：需要类型信息的 Codemod
- AST 变换模式：
  - Babel `@babel/traverse`：enter/exit + path.replaceWith()
  - jscodeshift：jQuery 风格的 AST 查询/变换
  - ts-morph：TypeScript AST 的类型安全操作
- 作用域分析（Scope Analysis）：
  - 变量声明 vs 引用的区分
  - 块作用域（let/const）vs 函数作用域（var）
  - 变量遮蔽（Shadowing）检测
  - ESLint `scope-manager` 的实现
- 真实案例：
  - `no-unused-vars`：作用域分析 + 引用计数
  - `no-shadow`：作用域链遍历
  - `prefer-const`：赋值分析（AST 级近似）
  - React `rules-of-hooks`：调用位置约束（AST 模式匹配）

**动手环节：**

- 编写 3 个 ESLint 自定义规则：
  1. `no-console-in-production`：禁止 `console.*` 调用（纯 AST 匹配）
  2. `no-nested-ternary`：禁止嵌套三元表达式（AST 结构检查）
  3. `enforce-api-error-handling`：自定义 API 调用必须有 `.catch()`（AST + 简单作用域）
- 用 ts-morph 编写一个 Codemod：
  - 将所有 `function` 声明转为箭头函数（需要判断 `this` 使用）
- 用 ast-grep 或 Semgrep 编写等价规则，对比表达力

**验证标准：** 3 个 ESLint 规则通过测试，Codemod 正确转换且处理边界情况

---

### 第 3 章：类型系统与类型检查（难度：⭐⭐⭐⭐）

**理论部分：**

> **与编译原理大纲的分工**：编译原理大纲第 4 章已覆盖类型系统的基础概念（类型规则、类型环境、HM 推断、子类型分类、符号表）。本章**不再重复这些基础**，聚焦三个工程重点：① TypeScript checker 的完整架构（Binder → Checker → CFA）；② 结构化子类型的实现细节；③ 控制流敏感类型收窄（Narrowing）机制。如果尚未学完 compiler 第 4 章，请先补充类型规则和类型环境的基础知识。

- 类型系统的形式化：
  - 类型规则（Type Rules）：推理规则表示法
  - 类型环境（Type Environment / Context）：Γ ⊢ e : τ
  - 健全性（Soundness）：Progress + Preservation
    - Progress：良类型程序不会 stuck
    - Preservation：求值保持类型不变
- 类型检查 vs 类型推断：
  - 类型检查（Type Checking）：给定标注，验证一致性（TypeScript、Go）
  - 类型推断（Type Inference）：无标注，推导类型（Haskell、Rust 局部）
  - **Hindley-Milner 类型系统**：
    - 类型变量（α）、类型构造器（→, ×, List）
    - 统一（Unification）：求解类型方程
    - Algorithm W：实例化 → 推断 → 统一 → 泛化
    - let-多态（Let-polymorphism）vs 一阶多态
- 子类型（Subtyping）：
  - 名义子类型（Nominal）：Java、C#（extends/implements）
  - 结构子类型（Structural）：TypeScript（形状匹配）
  - 宽度子类型、深度子类型、排列子类型
  - 子类型与多态的交互
- **TypeScript 类型检查器架构**（重点）：
  - 整体管道：Scanner → Parser → Binder → Checker → Emitter
  - Binder：构建 Symbol Table、建立 AST 节点间的引用关系
  - Checker 核心机制：
    - `getTypeAtLocation(node)`：获取节点类型
    - `checkExpression(node)`：检查表达式类型
    - `isTypeAssignableTo(source, target)`：可赋值性检查（结构化子类型）
    - 控制流分析（CFA）：`if (x !== null)` 后的类型收窄（Narrowing）
    - 上下文类型（Contextual Typing）：从使用位置反推类型
  - 类型守卫（Type Guards）与判别联合（Discriminated Unions）
  - 条件类型（Conditional Types）与模板字面量类型
- 真实类型系统对比：
  - TypeScript：结构化、渐进类型（Gradual Typing）、类型擦除
  - Flow：结构化、存在类型（Existential Types）
  - Rust：名义 + trait、生命周期、所有权
  - Haskell：HM 推断、类型类（Type Class）、GADT

**动手环节：**

- 阅读 TypeScript 源码关键路径：
  - `src/compiler/binder.ts`：理解 Symbol 和 Declaration 的绑定
  - `src/compiler/checker.ts`：搜索 `checkExpression`、`isTypeAssignableTo`
- 实现迷你类型检查器（针对 Monkey 语言或简单 λ 演算）：
  - 支持：`int`, `bool`, `int → int`（函数类型）
  - 类型规则：`+` 要求两个 `int`，`if` 要求条件为 `bool`
  - 类型环境：`Map<string, Type>`，支持嵌套作用域
  - 错误报告：类型不匹配时给出期望类型和实际类型
- 用 TS Compiler API 编写一个类型级分析脚本：
  - 找出项目中所有 `any` 类型的使用位置
  - 检测函数返回类型是否显式标注

**验证标准：** 迷你类型检查器能正确推断 `let f = fn(x: int) -> int { x + 1 }; f(5)` 的类型；能解释 TS checker 的 CFA narrowing 机制

---

### 第 4 章：控制流分析深入（难度：⭐⭐⭐）

**理论部分：**

- CFG 构造（从源码到图）：
  - 从 AST 构造 CFG：语句 → 基本块、分支 → 边
  - 从字节码构造 CFG：跳转指令 → 块边界
  - 特殊结构：`try/catch/finally`、`switch`、短路求值（`&&`/`||`）
  - 不可达代码检测：从入口 BFS/DFS，未到达的块即为死代码
- 支配关系（Dominance）深入：
  - 支配（Dominate）的形式化定义
  - 直接支配（Immediate Dominator, idom）
  - 支配树（Dominator Tree）的构造算法（Lengauer-Tarjan，了解）
  - 支配边界（Dominance Frontier）：SSA 构造的关键
  - 后支配（Post-dominance）：用于控制依赖分析
- 控制依赖（Control Dependence）：
  - 节点 B 控制依赖于节点 A：A 的分支决定 B 是否执行
  - 控制依赖图（CDG）的构造
  - 应用：代码移动（Code Motion）的合法性判断
- 循环分析：
  - 回边（Back Edge）与自然循环（Natural Loop）
  - 循环不变量（Loop Invariant）识别
  - 循环嵌套与 reducible/irreducible 控制流
- 控制流敏感分析（Flow-Sensitive Analysis）：
  - 为什么需要：`x = 1; x = 2; use(x)` 中 x 的值取决于位置
  - TypeScript 的 CFA：类型收窄就是控制流敏感分析
  - 路径敏感（Path-Sensitive）vs 流敏感（Flow-Sensitive）：
    - 流敏感：区分程序点，但不区分路径
    - 路径敏感：区分不同执行路径（更精确，指数级开销）

**动手环节：**

- 实现 CFG 构造器：
  - 输入：TS/JS 函数的 AST（使用 @typescript-eslint/parser）
  - 输出：基本块列表 + 边列表（JSON 可序列化）
  - 支持：`if/else`、`while`、`for`、`return`、`try/catch`
- 实现支配树构造（迭代算法）：
  - 输入：CFG
  - 输出：每个节点的 idom
- 实现不可达代码检测：
  - 基于 CFG 可达性
  - 编写为 ESLint 规则或独立 CLI 工具
- 可视化：用 Mermaid 或 D3 输出 CFG 图

**验证标准：** 给定含 `if/while/return` 的函数，能正确构造 CFG 并检测不可达代码

---

### 第 5 章：数据流分析框架（难度：⭐⭐⭐⭐）

**理论部分：**

> **与编译原理大纲的分工**：编译原理大纲第 9 章已覆盖数据流分析的概念框架（四个经典问题的定义、不动点迭代思想、优化应用）。本章在此基础上**深入工程实现**：通用 Worklist 引擎设计、格的可插拔抽象、精度与收敛性的权衡。

- 数据流分析的通用框架（回顾 + 深入）：
  - 四元组：(L, ⊑, F, ι)
    - L：格的元素集合（分析域）
    - ⊑：偏序关系
    - F：传递函数族（Transfer Functions）
    - ι：初始值（⊥ 或 ⊤）
  - 方向：前向（Forward）vs 后向（Backward）
  - 汇合（Meet / Join）：⊔（并）或 ⊓（交）
  - **Worklist 算法**：
    - 比朴素迭代更高效：只重新处理受影响的块
    - 复杂度：O(|E| × |L| × cost_of_transfer)
  - 终止性保证：格满足 ACC + 传递函数单调
- 四个经典问题（手动推导 + 代码实现）：
  - **到达定义（Reaching Definitions）**：
    - 前向 + 并集
    - gen[B]：B 中定义且未被后续杀死的变量
    - kill[B]：B 中重新定义的变量（杀死其他块的定义）
    - 应用：use-def 链、常量传播
  - **活跃变量（Live Variables）**：
    - 后向 + 并集
    - gen[B]：B 中使用且之前未定义的变量
    - kill[B]：B 中定义的变量
    - 应用：寄存器分配、`no-unused-vars`
  - **可用表达式（Available Expressions）**：
    - 前向 + 交集
    - gen[B]：B 中计算且未被后续修改的表达式
    - kill[B]：B 中修改了操作数的表达式
    - 应用：公共子表达式消除（CSE）
  - **非常忙表达式（Very Busy Expressions）**：
    - 后向 + 交集
    - 应用：代码移动（Code Motion）
- 格的设计：
  - 幂集格（Powerset Lattice）：变量集合，⊑ = ⊆，⊔ = ∪
  - 平坦格（Flat Lattice）：⊥ < 具体值 < ⊤
  - 乘积格（Product Lattice）：多个分析的组合
  - 格的高度与收敛速度
- 数据流分析 vs 类型系统：
  - 类型系统：前向、流敏感、路径不敏感
  - 数据流分析：可以是前向/后向、流敏感/不敏感
  - TypeScript 的 CFA 本质是前向数据流分析（类型作为格元素）

**动手环节：**

- 实现通用 Worklist 数据流分析引擎：

```typescript
interface DataflowAnalysis<T> {
  direction: 'forward' | 'backward';
  initialValue: T;
  meet(a: T, b: T): T;
  transfer(block: BasicBlock, input: T): T;
}

function worklistSolve<T>(cfg: CFG, analysis: DataflowAnalysis<T>): Map<BlockId, T> {
  // ...
}
```

- 在引擎上实现四个经典分析
- 用到达定义实现简单的常量传播
- 用活跃变量实现 `no-unused-vars` 的精确版本（对比 ESLint 的 AST 级近似）
- 测试：给定 CFG，手动计算期望结果，与引擎输出对比

**验证标准：** Worklist 引擎能正确求解四个经典问题；`no-unused-vars` 精确版能处理 `if` 分支中的条件使用

---

### 第 6 章：抽象解释（难度：⭐⭐⭐⭐⭐）

**理论部分：**

- 抽象解释的核心思想：
  - 具体语义（Collecting Semantics）：程序所有可能执行状态的集合（不可计算）
  - 抽象语义：在抽象域上近似计算（可计算）
  - 伽罗瓦连接（Galois Connection）：具体域 ↔ 抽象域
    - 抽象化（α）：具体 → 抽象（丢失信息）
    - 具体化（γ）：抽象 → 具体（恢复信息）
    - 性质：α(c) ⊑ a ⟺ c ⊑ γ(a)
- **符号分析（Sign Analysis）**（经典入门案例）：
  - 抽象域：{⊥, -, 0, +, ⊤}（符号格）
  - 抽象运算：`+ ⊕ + = +`，`+ ⊕ - = ⊤`，`0 ⊕ x = x`
  - 传递函数：在符号格上模拟算术运算
  - 应用：检测除零错误（`x / y` 中 y 可能为 0）
- 区间分析（Interval Analysis）：
  - 抽象域：[l, u]（整数区间）
  - 运算：[1,3] + [2,4] = [3,7]
  - 越界检测：数组索引是否在 [0, len-1] 内
- ** widening（加宽）与 narrowing（缩窄）**：
  - 问题：循环可能导致不动点迭代不终止（值无限增长）
  - Widening（∇）：强制收敛，牺牲精度（如 [0,1] ∇ [0,2] = [0,+∞]）
  - Narrowing（△）：在 widening 后精化结果
  - 策略：每 N 次迭代做一次 widening
- 抽象解释 vs 数据流分析：
  - 数据流分析是抽象解释的特例（格元素是变量集合/表达式集合）
  - 抽象解释更通用：格元素可以是值域（符号、区间、多面体）
  - 抽象解释强调"近似具体语义"，数据流分析强调"计算程序属性"
- 真实应用：
  - Astrée（ENS/空客）：多面体分析，验证飞行控制软件无数组越界/除零
  - Facebook Infer：分离逻辑 + 抽象解释，检测内存泄漏/空指针
  - LLVM 的 ValueTracking：区间分析判断条件是否恒真/恒假

**动手环节：**

- **过渡练习**：用第 5 章的 Worklist 引擎实现常量传播（Constant Propagation）：
  - 抽象域：平坦格（Flat Lattice）：⊥ < 具体整数值 < ⊤
  - 传递函数：`x = 5` → x 映射到 5；`x = y + 1` → 若 y 是常量则计算，否则 ⊤
  - 体会：格元素从"变量集合"（第 5 章）变为"值域"（本章），分析框架不变，只是格的设计不同
  - 这一步是从数据流分析到抽象解释的自然桥梁

- 实现符号分析器（Sign Analysis）：
  - 抽象域：`type Sign = 'bottom' | 'negative' | 'zero' | 'positive' | 'top'`
  - 实现符号格的 ⊔（join）和算术运算（⊕, ⊖, ⊗, ⊘）
  - 在 CFG 上用 Worklist 算法计算每个程序点的符号信息
  - 检测：除零风险（除数可能为 0）、负数数组索引
- 实现简单区间分析（可选）：
  - 区间格：[l, u]，⊥ = [1, 0]（空区间），⊤ = [-∞, +∞]
  - 检测：数组越界（索引区间 ⊄ [0, len-1]）
- 实现 widening 操作符，验证循环程序的终止性

**验证标准：** 符号分析器能检测 `let x = 0; let y = 10 / x;` 中的除零风险；能解释 widening 为什么必要

---

### 第 7 章：过程间分析与调用图

**理论部分：**

- 过程内分析的局限：
  - 函数调用是"黑盒"：不知道 callee 对参数的修改
  - 全局变量跨函数修改
  - 需要过程间分析（Interprocedural Analysis）
- **调用图（Call Graph）构造**：
  - 静态调用图：CHA（Class Hierarchy Analysis）、RTA（Rapid Type Analysis）
  - 动态语言挑战：高阶函数、回调、`eval`、动态属性访问
  - JS/TS 的调用图难点：`obj[method]()`、回调传递、`this` 绑定
  - 近似策略：可能调用（May-Call）vs 必须调用（Must-Call）
- **过程间数据流分析**：
  - 内联法（Inlining）：将 callee 的 CFG 内联到 caller（简单但爆炸）
  - 摘要法（Summary-based）：为每个函数计算传递函数摘要，组合使用
  - 上下文敏感（Context-Sensitive）：
    - 调用点敏感（Call-site sensitive）：同一函数在不同调用点有不同摘要
    - k-CFA：k 层调用上下文（精度 vs 成本）
    - 对象敏感（Object-sensitive）：按接收者对象区分
  - 上下文不敏感（Context-Insensitive）：所有调用共享一个摘要（快但不精确）
- 指针分析 / 别名分析（Pointer / Alias Analysis）：
  - 问题：两个变量是否指向同一对象？
  - 包含约束（Inclusion-based）：Andersen 风格（精确，O(n³)）
  - 统一约束（Unification-based）：Steensgaard 风格（快，不精确）
  - JS 的别名分析难点：原型链、动态属性、闭包
- 真实工具的过程间分析：
  - TypeScript：调用图（基于类型）+ 上下文敏感类型推断
  - Flow：更激进的过程间推断
  - Infer：过程间分离逻辑
  - CodeQL：基于数据库的声明式过程间查询

**动手环节：**

- 实现简单调用图构造器：
  - 基于 AST 的函数调用收集（上下文不敏感）
  - 处理：直接调用 `f(x)`、方法调用 `obj.f(x)`、高阶函数 `map(arr, f)`
  - 输出：调用图（caller → callee 边列表）
- 实现上下文不敏感的过程间活跃变量分析：
  - 为每个函数计算摘要（哪些参数被使用、哪些全局变量被修改）
  - 在调用点应用摘要
- 用 TS Compiler API 获取调用关系：
  - `checker.getResolvedSignature(callExpr)`
  - `symbol.getDeclarations()`

**验证标准：** 能构造含高阶函数的调用图；过程间分析能检测到跨函数的未使用参数

---

### 第 8 章：污点分析与安全应用（难度：⭐⭐⭐⭐）

**理论部分：**

- 污点分析（Taint Analysis）：
  - 核心思想：标记不可信数据（source），追踪其传播，检测是否到达敏感操作（sink）
  - Source：用户输入（`req.body`、`location.search`、`document.cookie`）
  - Sink：危险操作（`eval()`、`innerHTML`、`exec()`、SQL 拼接）
  - Sanitizer：净化操作（`escapeHtml()`、参数化查询）
  - 传播规则：赋值传播、运算传播、函数参数传播、返回值传播
- 污点分析的数据流建模：
  - 格：{untainted, tainted}（最简单的二值格）
  - 传递函数：source → tainted，sanitizer → untainted，其他 → 传播
  - 前向分析：从 source 向 sink 传播
  - 过程间：跨函数的污点传播（调用图 + 摘要）
- 安全漏洞类型与对应分析：
  - XSS（跨站脚本）：用户输入 → `innerHTML` / `document.write`
  - SQL 注入：用户输入 → SQL 字符串拼接
  - 命令注入：用户输入 → `child_process.exec()`
  - 路径遍历：用户输入 → `fs.readFile(path)`
  - 原型污染：用户输入 → `obj[userKey] = value`
- 真实安全分析工具：
  - **CodeQL**（GitHub）：
    - 将代码库建模为关系数据库
    - 用 QL 语言编写声明式查询
    - 内置污点追踪框架（`TaintTracking::Configuration`）
  - **Semgrep**：
    - 模式匹配 + 数据流分析
    - 规则语法接近代码模式，易写
    - 支持跨文件/跨函数分析（Pro 版）
  - **Snyk / SonarQube / Coverity**：商业 SAST 工具
- 前端安全分析的特殊性：
  - DOM-based XSS：污点在浏览器端传播（不经过服务器）
  - 第三方依赖：npm 包的漏洞（`npm audit` 本质是已知漏洞匹配，非分析）
  - CSP（Content Security Policy）作为运行时缓解

**动手环节：**

- 实现迷你污点分析器：
  - 分析对象：简单的 JS 函数（含 `req.body`、`eval`、`innerHTML`）
  - 实现：
    1. Source/Sink/Sanitizer 配置表
    2. 基于 AST 的赋值/调用传播
    3. 基于 CFG 的前向污点传播（用第 5 章的 Worklist 引擎）
    4. 报告：source → ... → sink 的传播路径
  - 检测场景：
    - `eval(req.body.code)` → 报告命令注入
    - `el.innerHTML = sanitize(req.body.html)` → 不报告（有 sanitizer）
    - `let x = req.body.name; let y = x; eval(y)` → 报告（跨变量传播）
- 编写 3 条 Semgrep 规则：
  - 检测 `innerHTML` 赋值非常量字符串
  - 检测 `eval()` 调用
  - 检测 `child_process.exec()` 参数含模板字符串
- 编写 1 条 CodeQL 查询（推荐）：
  - 用 `DataFlow::Configuration` 检测从 `req.query` 到 `res.send()` 的未净化数据流
  - 体验声明式分析与命令式分析（mini-analyzer）的表达力差异

**验证标准：** 污点分析器能检测 3 种场景（直接/跨变量/有 sanitizer）；Semgrep 规则在示例代码上正确触发

---

### 第 9 章：综合项目：迷你静态分析器

**项目设计：**

- 项目名称：`mini-analyzer`（用 TypeScript 实现）
- 目标：一个可扩展的 JS/TS 静态分析 CLI 工具

**架构：**

```text
mini-analyzer/
├── src/
│   ├── core/
│   │   ├── parser.ts          # 源码 → AST（使用 @typescript-eslint/parser）
│   │   ├── cfg.ts             # AST → CFG
│   │   ├── worklist.ts        # 通用 Worklist 数据流引擎
│   │   └── lattice.ts         # 格操作接口
│   ├── analyses/
│   │   ├── unused-vars.ts     # 活跃变量分析 → 未使用变量
│   │   ├── unreachable.ts     # CFG 可达性 → 不可达代码
│   │   ├── sign-analysis.ts   # 符号分析 → 除零/溢出检测
│   │   └── taint.ts           # 污点分析 → 安全漏洞
│   ├── rules/
│   │   ├── rule-engine.ts     # 规则注册/执行引擎
│   │   └── builtin-rules.ts   # 内置 AST 级规则
│   ├── report/
│   │   └── reporter.ts        # 诊断报告（位置、严重度、修复建议）
│   └── cli.ts                 # CLI 入口
├── tests/
├── package.json
└── README.md
```

**功能要求：**

1. 核心引擎：
   - 解析 JS/TS 源码为 AST
   - 构造函数级 CFG
   - Worklist 数据流分析引擎（可插拔分析）
2. 内置分析器（至少 4 个）：
   - 未使用变量（活跃变量分析）
   - 不可达代码（CFG 可达性）
   - 除零风险（符号分析）
   - 污点传播（source → sink）
3. 规则引擎：
   - 支持 AST 级规则（Visitor 模式）
   - 支持数据流规则（注册分析器 + 判断条件）
4. CLI：
   - `mini-analyzer check <file>` → 输出诊断报告
   - 支持 `--rule` 指定规则、`--format json|text` 输出格式
5. 测试：
   - 每个分析器有正例/反例测试
   - 端到端测试：源码文件 → 期望诊断

**动手环节：**

- 按模块逐步实现，每完成一个分析器就集成到 CLI
- 编写测试用例集（含安全漏洞示例代码）
- 编写 README：架构说明、分析方法列表、使用方式

**验证标准：** `mini-analyzer check examples/vuln.js` 能输出未使用变量、不可达代码、除零风险、XSS 污点四类诊断

---

### 第 10 章：工业级工具对标与进阶路线（难度：⭐⭐⭐）

**理论部分：**

- 本项目与工业工具的对标：

| 模块 | mini-analyzer | ESLint | TypeScript | CodeQL | Infer |
|------|--------------|--------|------------|--------|-------|
| 解析 | @ts-eslint/parser | espree | 自有 parser | 各语言 extractor | 各语言前端 |
| 作用域 | 简单环境链 | scope-manager | binder | 数据库关系 | SIL |
| 类型 | 无 | 可选（TS 插件） | checker（5 万行） | 类型推断 | 类型推断 |
| CFG | 函数级 | 无 | 函数级（CFA） | 函数级 + 过程间 | 过程间 |
| 数据流 | Worklist 引擎 | 无（AST 近似） | CFA（类型收窄） | SSA + 数据流 | 分离逻辑 |
| 过程间 | 无 | 无 | 有限（调用签名） | 完整（Datalog） | 完整（摘要） |
| 报告 | 简单文本 | 丰富（fix、suggestion） | 丰富（quick fix） | SARIF | 丰富（trace） |

- **分析精度与性能的量级直觉**：

| 工具 | 分析精度 | 典型耗时（中型项目 ~10 万行） | 适用场景 |
|------|---------|--------------------------|---------|
| ESLint | AST 模式匹配 | ~10ms/文件 | 编码时实时反馈 |
| TypeScript | 流敏感类型检查 | ~30s 全量 | 编译时类型安全 |
| Semgrep | AST + 局部数据流 | ~秒级 | CI 安全门禁 |
| CodeQL | 过程间数据流 | ~分钟级（含建库） | 深度安全审计 |
| Infer | 过程间分离逻辑 | ~小时级 | 大规模代码库 Bug 检测 |

> 理解这个量级差异，才能理解为什么不同工具选择不同的分析精度——这不是技术优劣，而是工程权衡。

- 工业级静态分析的工程挑战：
  - 性能：大代码库（百万行）的增量分析
  - 精度 vs 速度的工程权衡
  - 误报管理：置信度、白名单、反馈循环
  - 多语言支持：统一 IR（CodeQL 的数据库方案）
  - 增量分析：只分析变更部分（tree-sitter 增量解析 + 增量数据流）
- 进阶方向：
  - **抽象解释深入**：多面体分析（Polyhedra）、约简积（Reduced Product）
  - **符号执行**：Z3 SMT Solver、KLEE、路径爆炸问题
  - **模型检验**：TLA+、SPIN、CTL/LTL 时序逻辑
  - **程序验证**：Hoare 逻辑、分离逻辑、Dafny、F*、Lean
  - **机器学习 + 程序分析**：用 ML 减少误报、学习代码模式
  - **Rust 编译器**：borrow checker 是所有权系统的静态分析（生命周期分析）
- 推荐学习资源：
  - 书：Nielson《Principles of Program Analysis》（抽象解释圣经）
  - 书：Appel《Modern Compiler Implementation》第 17-21 章
  - 课：CMU 15-819（Program Analysis）/ ETH 的 Program Analysis 课程
  - 实践：CodeQL 官方教程、Semgrep 规则编写、ESLint 插件开发
  - 源码：TypeScript checker、ESLint scope-manager、LLVM Analysis passes

**动手环节：**

- 用 CodeQL 分析一个开源项目（如 express）：
  - 完成官方教程的 "Getting started" 和 "Analyzing data flow" 两节
  - 编写自定义查询：检测 path traversal（`req.params` → `fs.readFile`）
  - 对比 CodeQL 的声明式污点追踪与第 8 章 mini-analyzer 的命令式实现
- 对比 mini-analyzer 与 ESLint + Semgrep 在同一代码上的检测结果
- 选择一个进阶方向写一篇调研笔记（推荐：Rust borrow checker 或 CodeQL 架构）

**验证标准：** 能独立编写 CodeQL 查询；能清晰描述 mini-analyzer 与工业工具的差距及原因

---

## 📐 核心概念速查

| 概念 | 一句话解释 | 对应章节 |
|------|-----------|---------|
| 可靠性（Soundness） | 分析不漏报（可能有误报），安全分析的基本要求 | 第 1 章 |
| Rice 定理 | 非平凡程序性质不可判定 → 静态分析必须做近似 | 第 1 章 |
| 格（Lattice） | 偏序集 + 任意子集有上/下确界，数据流分析的值域 | 第 1 章 |
| 不动点迭代 | 从 ⊥ 开始反复应用传递函数直到收敛，数据流分析的求解方法 | 第 1/5 章 |
| Worklist 算法 | 只重新处理受影响的块，比朴素迭代高效的数据流求解 | 第 5 章 |
| gen/kill | 传递函数的标准形式：out = gen ∪ (in - kill) | 第 5 章 |
| 到达定义 | 前向分析：哪些赋值能到达某程序点（use-def 链的基础） | 第 5 章 |
| 活跃变量 | 后向分析：某程序点后还会被使用的变量（寄存器分配的基础） | 第 5 章 |
| 抽象解释 | 在抽象域上近似计算程序所有可能行为的集合 | 第 6 章 |
| 伽罗瓦连接 | 具体域与抽象域之间的单调映射对（α, γ），保证近似的正确性 | 第 6 章 |
| Widening | 强制不动点迭代收敛的操作，牺牲精度换取终止性 | 第 6 章 |
| 符号分析 | 用 {⊥, -, 0, +, ⊤} 格追踪变量符号，检测除零/溢出 | 第 6 章 |
| 调用图 | 函数间调用关系的图，过程间分析的基础 | 第 7 章 |
| 上下文敏感 | 区分同一函数在不同调用上下文中的行为（k-CFA） | 第 7 章 |
| 污点分析 | 追踪不可信数据从 source 到 sink 的传播，检测安全漏洞 | 第 8 章 |
| Source/Sink/Sanitizer | 污点分析三要素：数据来源 / 危险操作 / 净化操作 | 第 8 章 |
| 控制流敏感 | 分析结果随程序点变化（区分赋值前后） | 第 4 章 |
| 路径敏感 | 分析结果区分不同执行路径（更精确，更昂贵） | 第 4 章 |
| 类型收窄（Narrowing） | TypeScript CFA：`if (x !== null)` 后类型从 `T | null` 收窄为 `T` | 第 3 章 |
| Algorithm W | Hindley-Milner 类型推断算法：实例化→推断→统一→泛化 | 第 3 章 |

---

## ✅ 完成标准

- [ ] 能解释 Soundness/Completeness 权衡和 Rice 定理的含义
- [ ] 能画出 Sign Lattice 和 Powerset Lattice 的格图，解释 ⊔ 操作
- [ ] 能编写 3 个以上 ESLint 自定义规则（含作用域分析）
- [ ] 能解释 TypeScript checker 的 Binder → Checker → CFA 管道
- [ ] 能实现迷你类型检查器（支持基础类型规则和作用域）
- [ ] 能从 AST 构造 CFG，实现支配树和不可达代码检测
- [ ] 能实现 Worklist 数据流引擎，正确求解四个经典分析问题
- [ ] 能实现符号分析器（Sign Analysis），检测除零风险
- [ ] 能解释 Widening 的必要性并实现简单版本
- [ ] 能构造简单调用图，解释上下文敏感 vs 不敏感的权衡
- [ ] 能实现迷你污点分析器，检测 source → sink 的传播路径
- [ ] 能编写 Semgrep 规则和 CodeQL 查询
- [ ] 完成 mini-analyzer 项目：4 个分析器 + 规则引擎 + CLI + 测试
- [ ] 能对标 mini-analyzer 与 ESLint/TypeScript/CodeQL 的架构差异

---

## 🔗 关联模块

- 编译原理：[compiler/](../compiler/) — 第 4 章语义分析（类型检查）→ 本大纲第 3 章；第 7 章 IR（CFG/SSA）→ 本大纲第 4-5 章；第 9 章数据流分析与优化 → 本大纲第 5 章深入；第 10 章 JIT → 本大纲第 6 章抽象解释的"精度 vs 性能"权衡
- 数据结构：[data-structures/](../data-structures/) — 图算法（CFG 遍历、支配树）、并查集（别名分析）、Worklist（队列）
- 操作系统：[operating-system/](../operating-system/) — 进程/线程分析与并发 Bug 检测
- 实操互补：[deploy/](../../deploy/) — CI 中集成 SAST 工具（Semgrep/CodeQL 作为 CI gate）
- 实操互补：[front/react/](../../front/react/) — React 组件的静态分析（hooks 规则、props 类型检查）
- 实操互补：[artificial-intelligence/](../../artificial-intelligence/) — LLM + 静态分析的结合（AI 辅助代码审查）

---

## 📝 学习建议

1. **先修编译原理大纲**：本大纲假设你已理解 AST、CFG、数据流分析的基本概念。如果没学过，先完成 compiler 大纲的第 1-10 章（尤其是第 4 章语义分析和第 9 章数据流分析）
2. **格论不要死磕数学**：理解"偏序 + 上确界 + 不动点"的直觉即可，不需要证明 Tarski 定理。重点是理解"为什么分析能终止""为什么结果是可靠的"
3. **ESLint 规则是最好的入门实践**：第 2 章的 ESLint 规则编写是最快出成果的部分，写完 3 个规则后你对 AST 分析的理解会质变
4. **TypeScript 源码是最好的教材**：checker.ts 虽然 5 万行，但搜索 `checkExpression`、`isTypeAssignableTo`、`narrowType` 这几个函数就能理解核心架构
5. **数据流分析要手动推导**：先在纸上用 gen/kill 集合手动算 2-3 个 CFG 的不动点，再写代码。直接写代码容易迷失在实现细节中
6. **抽象解释从 Sign Analysis 入手**：不要一上来就看多面体分析。Sign Analysis 的格只有 5 个元素，手动就能算，是理解抽象解释的最佳入口
7. **污点分析是最有工程价值的部分**：学完第 8 章后，你就能理解 Snyk/CodeQL 的安全扫描在做什么，也能自己写安全规则
8. **mini-analyzer 项目增量构建**：不要试图一次写完。先做 AST 规则 → 再加 CFG → 再加数据流 → 最后加污点分析。每一步都是可运行的
9. **CodeQL 值得深入**：它是目前工业界最强大的声明式程序分析平台，GitHub 免费。学完本大纲后花一周跟官方教程，能把理论串起来
10. **不要追求覆盖所有分析技术**：程序分析是一个巨大的领域。本大纲覆盖的是"工程师需要知道的核心 80%"，剩下的（模型检验、程序验证、高阶抽象解释）是学术研究方向
