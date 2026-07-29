# 编译原理学习大纲（技术实战向）

> 以「用 Go 实现一个 JavaScript 子集的解释器 → 字节码编译器 → 虚拟机」为主线，覆盖形式语言理论、词法分析、语法分析、语义分析、运行时系统、中间表示、代码生成、虚拟机、程序分析与优化、JIT 编译十大核心模块。每章理论 + 动手编码，最终产出一个可运行的完整项目，并具备静态分析入门基础。

---

## 📌 元信息

| 项目 | 说明 |
|------|------|
| **定位** | 技术实战向编译原理学习，非纯学术/考研导向 |
| **目标读者** | 有扎实编程基础、想深入理解语言实现原理的工程师 |
| **前置知识** | 数据结构（树、栈、哈希表）、Go 基础语法、对 JS 语言特性的理解 |
| **实现语言** | Go（静态类型、无 GC 黑盒干扰、标准库够用、单文件可运行） |
| **目标语言** | JavaScript 子集（Monkey 语言风格，逐步扩展到接近 ES5 核心子集） |
| **参考书** | Thorsten Ball《Writing An Interpreter In Go》《Writing A Compiler In Go》/ Aho《编译原理》（龙书，查阅用） |
| **后续大纲** | [program-analysis-learning-outline.md](../program-analysis/program-analysis-learning-outline.md) — 本大纲第 9-10 章数据流/优化分析的深入延伸 |

---

## 🎯 学习目标

完成本模块学习后，你应该能够：

1. 理解形式语言理论（乔姆斯基层次、正则语言、上下文无关文法），知道编译器的理论边界
2. 手写 Lexer，将源代码字符串切分为 Token 流（理解 DFA/NFA、正则 → 自动机的构造过程）
3. 手写 Parser，用递归下降 + Pratt 解析构建 AST（理解优先级、结合性、FIRST/FOLLOW 集、LL/LR 分析族）
4. 理解语义分析作为独立阶段：属性文法、语法制导翻译、类型检查、符号表构建
5. 实现 Tree-walking 解释器，直接在 AST 上求值（理解环境、作用域、闭包的运行时语义）
6. 实现运行时系统：对象模型、活动记录、参数传递、存储分配、GC 机制
7. 理解中间表示（三地址码、SSA、控制流图），将 AST 编译为字节码
8. 实现基于栈的虚拟机，执行字节码（理解操作数栈、帧、常量池）
9. 理解控制流分析与数据流分析框架，能解释常量折叠、DCE、CSE 等优化的分析基础
10. 理解 JIT 分层编译、去优化、内联缓存等现代运行时编译技术
11. 理解真实编译器（V8、Babel、esbuild）的架构设计，能读懂其源码中的对应模块
12. 具备静态分析入门基础：能编写 AST 级 Lint 规则，理解类型检查和数据流分析的原理

---

## 🗺️ 学习路径

| 阶段 | 章节 | 主题 | 产出 |
|------|------|------|------|
| **基础** | 第 1 章 | 编译原理全景与项目搭建 | Go 项目骨架、REPL 交互循环 |
| **基础** | 第 2 章 | 词法分析（Lexer） | 完整的 Token 切分器 |
| **基础** | 第 3 章 | 语法分析（Parser） | 递归下降 + Pratt 解析器，输出 AST |
| **核心** | 第 4 章 | AST 设计与语义分析 | AST 节点体系 + 属性文法 + 类型检查 + 符号表 |
| **核心** | 第 5 章 | Tree-walking 解释器 | 可执行表达式、语句、函数的求值器 |
| **核心** | 第 6 章 | 运行时系统 | 对象模型、环境链、闭包、内置函数 |
| **进阶** | 第 7 章 | 字节码编译 | 将 AST 编译为栈式字节码 |
| **进阶** | 第 8 章 | 虚拟机（VM） | 基于栈的字节码执行引擎 |
| **进阶** | 第 9 章 | 程序分析与优化 | 控制流/数据流分析 + 常量折叠/DCE/CSE |
| **进阶** | 第 10 章 | JIT 编译与工程化 | JIT 原理 + 错误处理 + 测试策略 |
| **实战** | 第 11 章 | 综合实战与扩展 | 完整项目 + 对标真实编译器的架构分析 |

---

## 📚 文档目录规划

```text
src/computer-science/compiler/
├── compiler-learning-outline.md              # 本文件（学习大纲）
├── doc/
│   ├── 01-overview-and-setup.md              # 编译原理全景与项目搭建
│   ├── 02-lexical-analysis.md                # 词法分析
│   ├── 03-syntax-analysis.md                 # 语法分析
│   ├── 04-ast-and-semantic-analysis.md        # AST 设计与语义分析
│   ├── 05-tree-walking-interpreter.md        # Tree-walking 解释器
│   ├── 06-runtime-system.md                  # 运行时系统
│   ├── 07-bytecode-compilation.md            # 字节码编译
│   ├── 08-virtual-machine.md                 # 虚拟机
│   ├── 09-analysis-and-optimization.md       # 程序分析与优化
│   ├── 10-jit-and-engineering.md             # JIT 编译与工程化
│   └── 11-capstone-and-real-world.md         # 综合实战与真实编译器对标
└── assets/                                   # 流水线图、AST 示意图、字节码执行图
```

---

## 📖 各章知识点细化

### 第 1 章：编译原理全景与项目搭建（难度：⭐）

**理论部分：**

- 编译器 vs 解释器 vs JIT：执行模型对比
  - AOT 编译（C → 机器码）、Tree-walking 解释（Ruby 早期）、字节码 + VM（JVM、CPython）、JIT（V8、HotSpot）
- 编译流水线全景：
  - 源代码 → **Lexer** → Token 流 → **Parser** → AST → **Semantic Analysis** → IR → **Optimizer** → **Code Gen** → 目标代码
  - 解释器路径：AST → **Evaluator**（跳过 IR 和 Code Gen）
- 为什么要学编译原理（工程视角）：
  - Babel/esbuild/SWC 的 transform 管道
  - ESLint/Prettier 的 AST 操作
  - 模板引擎、DSL、配置语言的设计
  - V8 的 Ignition + TurboFan 架构

**动手环节：**

- 初始化 Go 项目结构：

```text
monkey/
├── main.go              # REPL 入口
├── token/               # Token 类型定义
├── lexer/               # 词法分析器
├── ast/                 # AST 节点定义
├── parser/              # 语法分析器
├── object/              # 运行时对象系统
├── evaluator/           # Tree-walking 求值器
├── compiler/            # 字节码编译器
├── vm/                  # 虚拟机
└── repl/                # REPL 交互
```

- 实现 REPL（Read-Eval-Print Loop）：读入一行 → 处理 → 打印结果
- 定义 Token 类型枚举（`IDENT`, `INT`, `ASSIGN`, `PLUS`, `EOF` 等）

**验证标准：** 运行 REPL，能读入输入并回显 Token 类型占位符

---

### 第 2 章：词法分析（Lexer）（难度：⭐⭐）

**理论部分：**

- 形式语言与乔姆斯基层次：
  - Type 3（正则文法）→ 有限自动机 → 词法分析
  - Type 2（上下文无关文法）→ 下推自动机 → 语法分析
  - Type 1（上下文相关文法）→ 线性有界自动机 → 语义约束（如"变量必须先声明"）
  - Type 0（无限制文法）→ 图灵机 → 不可判定性边界
  - 理解层次关系：正则 ⊂ 上下文无关 ⊂ 上下文相关 ⊂ 递归可枚举
- 词法分析的职责：字符流 → Token 流
- 正则表达式与有限自动机：
  - 正则表达式的形式化定义（连接、选择、Kleene 星）
  - **Thompson 构造法**：正则表达式 → NFA（每个正则操作对应一种 NFA 片段拼接）
  - **子集构造法**：NFA → DFA（ε-闭包、状态集合的确定化）
  - DFA 最小化（了解）：等价状态合并
  - 最长匹配原则、优先级规则（多个模式匹配时取最长，等长取优先级最高）
- Token 的设计：类型（Type）+ 字面值（Literal）+ 位置信息（行号/列号）
- 关键字 vs 标识符的区分策略
- 空白字符、注释、非法字符的处理
- 真实 Lexer 对比：
  - Go 标准库 `go/scanner` 的设计
  - Babel 的 `@babel/parser` tokenizer
  - V8 的 Scanner（含预解析 preparse）
  - RE2/Go `regexp`：正则 → NFA → DFA 的工业实现

**动手环节：**

- 实现 `lexer.Lexer` 结构体：

```go
type Lexer struct {
    input        string
    position     int  // 当前字符位置
    readPosition int  // 下一个字符位置
    ch           byte // 当前字符
}
```

- 逐步扩展支持的 Token：
  1. 基础：`let`, `=`, `+`, `-`, `*`, `/`, `(`, `)`, `{`, `}`, `;`, `,`, 整数, 标识符
  2. 扩展：`==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`
  3. 高级：字符串字面量 `"hello"`, 数组 `[1, 2]`, 哈希 `{"key": "value"}`
- 关键字表：`let`, `fn`, `if`, `else`, `return`, `true`, `false`
- 为每个 Token 编写单元测试（表驱动测试）

**验证标准：** 输入 `let x = 5 + 10;` 输出正确的 Token 序列，所有测试通过

---

### 第 3 章：语法分析（Parser）（难度：⭐⭐⭐）

**理论部分：**

- 上下文无关文法（CFG）与 BNF/EBNF 表示
- 文法设计：
  - 语句（Statement）vs 表达式（Expression）
  - 表达式优先级与结合性
  - **文法二义性**：同一句子有多棵语法树
    - 经典 dangling else 问题：`if E1 then if E2 then S1 else S2` 的 else 归属
    - 消除方法：优先级规则、文法改写（引入匹配/非匹配语句）
- 解析算法谱系：
  - **自顶向下**：
    - 递归下降（Recursive Descent）：手写解析器的主流选择
    - Pratt 解析（Top-Down Operator Precedence）：处理表达式优先级的优雅方案
    - LL(k) 分析：从左到右扫描、最左推导、k 步前瞻
    - **FIRST 集与 FOLLOW 集**：LL(1) 分析表的构造基础
      - FIRST(α)：α 能推导出的第一个终结符集合
      - FOLLOW(A)：A 后面能出现的终结符集合
      - LL(1) 分析表构造与冲突检测（FIRST-FIRST 冲突、FIRST-FOLLOW 冲突）
  - **自底向上**：
    - 移进-归约（Shift-Reduce）分析的基本思想
    - LR 分析族递进：LR(0) → SLR(1) → LALR(1) → LR(1)
      - LR(0) 项目集与闭包
      - SLR 用 FOLLOW 集解决归约冲突
      - LALR 合并同心项目集（yacc/bison 使用）
      - LR(1) 最强但表最大
    - 理解为什么 LR 比 LL 更强（能处理更多文法）
  - 其他：Earley 解析（O(n³) 通用 CFG）、GLR（tree-sitter）、PEG（无二义性但非 CFG）
- 左递归问题与消除（LL 分析必须消除，LR 不需要）
- 错误恢复策略（panic mode、phrase level、error productions）
- 真实 Parser 对比：
  - Go `go/parser`：递归下降
  - Babel parser：递归下降 + 插件系统
  - esbuild：手写递归下降，极致性能
  - tree-sitter：GLR 解析，增量解析
  - yacc/bison：LALR(1) parser generator
  - ANTLR：LL(*) 自适应分析

**动手环节：**

- 实现 Pratt Parser 核心机制：

```go
type (
    prefixParseFn func() ast.Expression   // 前缀解析函数
    infixParseFn  func(ast.Expression) ast.Expression  // 中缀解析函数
)

type Parser struct {
    l      *lexer.Lexer
    curToken  token.Token
    peekToken token.Token
    prefixParseFns map[token.TokenType]prefixParseFn
    infixParseFns  map[token.TokenType]infixParseFn
}
```

- 优先级定义（从低到高）：

```go
const (
    LOWEST = iota
    EQUALS      // ==
    LESSGREATER // > 或 <
    SUM         // +
    PRODUCT     // *
    PREFIX      // -X 或 !X
    CALL        // myFunction(X)
    INDEX       // array[index]
)
```

- 逐步扩展语法支持：
  1. 基础：`let` 语句、`return` 语句、表达式语句、整数/标识符/布尔值
  2. 运算：前缀（`-`, `!`）、中缀（`+`, `-`, `*`, `/`, `==`, `!=`, `<`, `>`）
  3. 控制流：`if/else` 表达式、块语句 `{}`
  4. 函数：`fn(x, y) { x + y }` 函数字面量、调用表达式 `add(1, 2)`
  5. 数据结构：数组字面量 `[1, 2, 3]`、索引表达式 `arr[0]`、哈希字面量 `{"a": 1}`
- 每个语法特性配套测试：输入字符串 → 解析 → 断言 AST 结构

**验证标准：** `let add = fn(a, b) { a + b }; add(1, 2) * 3;` 解析为正确的嵌套 AST

---

### 第 4 章：AST 设计与语义分析（难度：⭐⭐⭐）

**理论部分：**

- AST 的设计原则：
  - 节点接口设计（Go 的 interface 多态 vs tagged union）
  - 语句节点 vs 表达式节点的区分
  - 位置信息（Source Location）的附加
- AST 遍历模式：
  - Visitor 模式（双分派）
  - Walker / 递归遍历
  - Transform（Babel 的 `@babel/traverse` 模式：enter/exit + path 对象）
- AST 在工程中的应用：
  - Babel 插件：`Program > FunctionDeclaration > ...` 路径遍历
  - ESLint 规则：监听特定节点类型
  - codemod / jscodeshift：AST 变换
- 序列化与反序列化：AST → JSON（用于调试、跨进程通信）
- **语义分析概述**（Parser 之后、Code Gen 之前的独立阶段）：
  - 为什么需要语义分析：CFG 能描述语法结构，但无法表达"变量必须先声明""类型必须匹配"等约束
  - 上下文相关约束 vs 上下文无关文法的边界
- **属性文法（Attribute Grammar）**：
  - 综合属性（Synthesized）：自底向上传播（如表达式的类型、值）
  - 继承属性（Inherited）：自顶向下传播（如声明的类型信息传给子节点）
  - S-属性文法（仅综合属性）→ 可在归约时计算
  - L-属性文法（继承属性受限）→ 可在预测时计算
  - 语法制导定义（SDD）vs 语法制导翻译方案（SDT）
- **符号表（Symbol Table）**：
  - 符号表作为独立 pass 的职责：声明收集、作用域构建、引用解析
  - 作用域规则：词法作用域、块作用域、函数作用域
  - 名字解析（Name Resolution）：从内层向外层查找
  - 变量遮蔽（Shadowing）与重复声明检测
  - 符号表数据结构：栈式作用域链、哈希表嵌套
- **类型检查（Type Checking）**：
  - 静态类型 vs 动态类型：编译期检查 vs 运行时检查
  - 类型规则（Type Rules）：用推理规则描述（如 `e1: int, e2: int → e1 + e2: int`）
  - 类型环境（Type Environment）：变量 → 类型的映射
  - 隐式类型转换（Coercion）与显式转换（Cast）
  - 子类型（Subtyping）与多态（Polymorphism）
  - **类型推断**：Hindley-Milner 类型系统、Algorithm W（了解）
    - 类型变量、统一（Unification）、泛化（Generalization）、实例化（Instantiation）
  - 真实类型系统对比：
    - TypeScript：结构化类型（Structural Typing）、类型擦除
    - Go：名义类型（Nominal Typing）、接口隐式实现
    - Rust：trait 系统、生命周期

> **与程序分析大纲的分工**：本章覆盖类型系统的**基础概念**（类型规则、类型环境、HM 推断、子类型分类），侧重编译器语义分析视角。程序分析大纲第 3 章假设已掌握这些概念，聚焦 **TypeScript checker 的工程架构**（Binder → Checker → CFA 管道、结构化子类型的实现、控制流敏感类型收窄）。

- 真实语义分析对比：
  - TypeScript `checker.ts`：类型检查 + 类型推断 + 控制流分析（~5 万行）
  - Go `go/types`：类型检查器
  - Babel `@babel/traverse` + scope：作用域分析

**动手环节：**

- 设计 AST 节点体系：

```go
// 所有节点的基础接口
type Node interface {
    TokenLiteral() string
    String() string
}

type Statement interface {
    Node
    statementNode()
}

type Expression interface {
    Node
    expressionNode()
}
```

- 实现核心节点：
  - `Program`, `LetStatement`, `ReturnStatement`, `ExpressionStatement`, `BlockStatement`
  - `Identifier`, `IntegerLiteral`, `StringLiteral`, `BooleanLiteral`
  - `PrefixExpression`, `InfixExpression`, `IfExpression`
  - `FunctionLiteral`, `CallExpression`
  - `ArrayLiteral`, `IndexExpression`, `HashLiteral`
- 实现 `String()` 方法用于调试输出
- 实现语义分析 pass（可选但推荐）：
  - 符号表构建：遍历 AST，收集声明、检测重复定义、解析引用
  - 简单类型检查：为 Monkey 语言实现基础类型规则（整数运算、布尔运算、函数调用参数数量）
  - 未定义变量检测：在求值前报告错误，而非运行时崩溃

**验证标准：** 任意合法输入能生成 AST 并通过 `String()` 还原；`let x = 1; x + y;` 能在语义分析阶段报告 `y` 未定义

---

### 第 5 章：Tree-walking 解释器（难度：⭐⭐⭐）

**理论部分：**

- 解释器的执行模型：
  - Tree-walking：直接在 AST 上递归求值（简单、慢）
  - 字节码 + VM：先编译再执行（快、复杂）
  - JIT：运行时编译热点代码（V8、HotSpot）
- 求值策略：
  - 自求值（self-evaluating）：整数、布尔值、字符串
  - 变量查找：环境链（Environment Chain）
  - 运算求值：先求值操作数，再应用运算符
- 环境（Environment）与作用域：
  - 全局环境 vs 局部环境
  - 词法作用域（Lexical Scoping）：函数定义时的环境，而非调用时
  - 闭包的实现：函数 + 捕获的环境引用
- 错误处理：运行时错误的传播与报告
- 真实解释器对比：
  - CPython 的 ceval.c（字节码解释器，非 tree-walking）
  - Ruby MRI 的 AST 解释器（早期）
  - QuickJS 的字节码解释器

**动手环节：**

- 实现 `evaluator.Eval()` 核心函数：

```go
func Eval(node ast.Node, env *object.Environment) object.Object {
    switch node := node.(type) {
    case *ast.Program:
        return evalProgram(node, env)
    case *ast.IntegerLiteral:
        return &object.Integer{Value: node.Value}
    case *ast.PrefixExpression:
        right := Eval(node.Right, env)
        return evalPrefixExpression(node.Operator, right)
    case *ast.InfixExpression:
        left := Eval(node.Left, env)
        right := Eval(node.Right, env)
        return evalInfixExpression(node.Operator, left, right)
    // ...
    }
}
```

- 逐步扩展求值能力：
  1. 基础：整数运算、布尔运算、比较运算、`!` 取反
  2. 变量：`let` 绑定、标识符查找、环境读写
  3. 控制流：`if/else` 求值、`return` 语句
  4. 函数：`fn` 字面量求值 → 闭包对象、函数调用 → 新环境 + 参数绑定
  5. 错误：类型不匹配、未定义变量、参数数量不匹配
- 每个特性配套端到端测试：输入源码字符串 → Lex → Parse → Eval → 断言结果

**验证标准：**

```text
>> let x = 10;
>> let add = fn(a, b) { a + b };
>> add(x, 5) * 2;
30
```

---

### 第 6 章：运行时系统（难度：⭐⭐⭐）

**理论部分：**

- 对象模型设计：
  - 一切皆对象 vs 原始值 + 对象（JS 的区分）
  - 类型标签（Type Tag）：用枚举标记对象类型
  - 接口多态：Go interface 实现运行时类型分派
- **运行时存储组织**：
  - **活动记录（Activation Record）/ 栈帧的正式结构**：
    - 返回地址、保存的寄存器/帧指针、参数区、局部变量区、返回值区
    - 静态链（Static Link）/ 显示链（Display）：非局部变量访问
    - 栈帧布局与调用约定（Calling Convention）
  - **参数传递机制**：
    - 传值（Call by Value）：C、Go、Java（基本类型）
    - 传引用（Call by Reference）：C++ 引用参数
    - 传共享（Call by Sharing）：Java/JS/Python 的对象参数（传引用的值）
    - 传名（Call by Name）：Algol 60、Scala by-name 参数
    - 传需求（Call by Need）：Haskell 惰性求值
  - **存储分配策略**：
    - 静态分配：全局变量、编译期确定大小（Fortran 传统）
    - 栈分配：局部变量、函数调用自动管理（C、Go）
    - 堆分配：动态对象、生命周期超出调用（malloc/new）
    - 各策略的适用条件与限制
- 内存管理与垃圾回收：
  - 栈分配 vs 堆分配
  - **引用计数**：原理、循环引用问题、Python/ObjC 的使用
  - **追踪式 GC**：
    - Mark-Sweep：标记可达对象、清除不可达对象（碎片问题）
    - Mark-Compact：标记后压缩整理（解决碎片）
    - Copying：半空间复制（Young 代常用）
  - **分代假说与分代 GC**：
    - 弱分代假说：大多数对象朝生夕灭
    - Young 代（Copying）→ Old 代（Mark-Sweep/Compact）
    - V8 的 Orinoco：Scavenger（Young）+ Mark-Sweep-Compact（Old）+ 并发/增量标记
  - **增量 GC 与并发 GC**：
    - 三色标记（白/灰/黑）与写屏障（Write Barrier）
    - Go 的并发三色标记-清除 GC
  - Go 的 GC 对解释器实现的影响（对象生命周期由 Go runtime 管理）
- 内置函数与标准库：
  - `len()`, `first()`, `last()`, `rest()`, `push()`, `puts()`
  - 高阶函数：`map()`, `filter()`, `reduce()`
- 数据结构实现：
  - 数组：动态数组（Go slice 封装）
  - 哈希表：键的哈希与相等性（`HashKey` 设计）
  - 字符串：不可变字符串 + 拼接
- 调用栈与帧（Call Frame）：
  - 函数调用 → 创建新环境 → 参数绑定 → 执行函数体 → 返回值
  - 递归与栈溢出
- 真实运行时对比：
  - V8 的 Object 模型（Hidden Class / Map、Inline Cache）
  - Lua 的 Table（数组 + 哈希混合）
  - CPython 的 PyObject（引用计数 + 类型指针）
  - JVM 的栈帧结构（局部变量表 + 操作数栈 + 帧数据）

**动手环节：**

- 实现对象系统：

```go
type ObjectType string

const (
    INTEGER_OBJ      ObjectType = "INTEGER"
    BOOLEAN_OBJ      ObjectType = "BOOLEAN"
    STRING_OBJ       ObjectType = "STRING"
    NULL_OBJ         ObjectType = "NULL"
    RETURN_VALUE_OBJ ObjectType = "RETURN_VALUE"
    ERROR_OBJ        ObjectType = "ERROR"
    FUNCTION_OBJ     ObjectType = "FUNCTION"
    BUILTIN_OBJ      ObjectType = "BUILTIN"
    ARRAY_OBJ        ObjectType = "ARRAY"
    HASH_OBJ         ObjectType = "HASH"
)

type Object interface {
    Type() ObjectType
    Inspect() string
}
```

- 实现 Environment（作用域链）：

```go
type Environment struct {
    store map[string]Object
    outer *Environment  // 外层环境（词法作用域）
}
```

- 实现闭包：函数对象持有定义时的环境引用
- 实现内置函数注册表
- 实现数组操作（索引、切片、push）和哈希操作（键值对、索引）
- 实现字符串拼接与 `len()` 对字符串的支持

**验证标准：**

```text
>> let map = fn(arr, f) {
     let iter = fn(arr, accumulated) {
       if (len(arr) == 0) { accumulated }
       else { iter(rest(arr), push(accumulated, f(first(arr)))) }
     };
     iter(arr, []);
   };
>> map([1, 2, 3], fn(x) { x * 2 });
[2, 4, 6]
```

---

### 第 7 章：字节码编译（难度：⭐⭐⭐⭐）

**理论部分：**

- **中间表示（IR）的概念与设计**：
  - 为什么需要 IR：解耦前端（语言相关）和后端（目标相关）、多趟优化、平台无关
  - IR 的层次：高层 IR（接近 AST）→ 中层 IR（三地址码/SSA）→ 低层 IR（接近机器码）
  - **三地址码（Three-Address Code）**：
    - 四元式（op, arg1, arg2, result）：`t1 = a + b`, `t2 = t1 * c`
    - 为什么限制为三地址：简化指令选择、便于优化
    - 临时变量（Temporaries）的引入
  - **控制流图（CFG, Control Flow Graph）**：
    - 基本块（Basic Block）：单入口单出口的指令序列
    - 块间边：跳转、条件分支、fall-through
    - CFG 是数据流分析和优化的基础结构
  - **SSA（Static Single Assignment）**：
    - 核心思想：每个变量只被赋值一次
    - φ 函数（Phi Function）：在控制流汇合点合并不同路径的值
    - SSA 的构造：支配树 + φ 函数插入
    - SSA 的优势：简化数据流分析、常量传播、死代码消除
    - 真实使用：LLVM IR、Go 编译器、V8 TurboFan 都基于 SSA
  - IR 设计对比：
    - LLVM IR：类型化 SSA、接近机器码
    - V8 Sea of Nodes：控制流和数据流统一在一张图中
    - Go 编译器 SSA：从 AST 直接构建
    - 本项目的字节码：栈式 IR（三地址码的栈化特例）
- 为什么需要字节码：
  - Tree-walking 的性能瓶颈（AST 遍历开销、类型分派）
  - 字节码的紧凑性与执行效率
  - 分离编译与执行：编译一次、执行多次
- 栈式指令集 vs 寄存器式指令集：
  - 栈式：JVM、CPython、CLR（实现简单、代码紧凑）
  - 寄存器式：Lua 5.0+、Dalvik/ART（指令少、性能好）
  - 栈式 → 寄存器式的转换（了解）
- 字节码设计：
  - 操作码（Opcode）：`OpConstant`, `OpAdd`, `OpPop`, `OpGetLocal`, `OpSetLocal`, `OpCall`, `OpReturnValue`, `OpJump`, `OpJumpNotTruthy` 等
  - 操作数：常量池索引、局部变量索引、跳转地址
  - 指令编码：opcode（1 字节）+ 操作数（定长/变长）
- 常量池（Constant Pool）：
  - 编译期收集所有常量（整数、字符串、函数对象）
  - 运行时通过索引访问
- 编译过程：
  - 遍历 AST → 发射（emit）字节码指令
  - 作用域管理：全局变量 vs 局部变量（符号表 Symbol Table）
  - 跳转地址回填（backpatching）：`if/else` 的条件跳转
- 真实编译器对比：
  - V8 Ignition：AST → Bytecode（寄存器式）
  - CPython：AST → 字节码（栈式）
  - Go 编译器：AST → SSA → 机器码
  - LLVM：Clang AST → LLVM IR（SSA）→ 后端优化 → 机器码

**动手环节：**

- 定义指令集：

```go
type Opcode byte

const (
    OpConstant Opcode = iota  // 加载常量
    OpAdd                     // 加法
    OpSub                     // 减法
    OpMul                     // 乘法
    OpDiv                     // 除法
    OpPop                     // 弹出栈顶
    OpTrue                    // 压入 true
    OpFalse                   // 压入 false
    OpEqual                   // ==
    OpNotEqual                // !=
    OpGreaterThan             // >
    OpMinus                   // 一元负号
    OpBang                    // 逻辑非
    OpJumpNotTruthy           // 条件跳转
    OpJump                    // 无条件跳转
    OpNull                    // 压入 null
    OpGetGlobal               // 读取全局变量
    OpSetGlobal               // 写入全局变量
    OpGetLocal                // 读取局部变量
    OpSetLocal                // 写入局部变量
    OpArray                   // 构建数组
    OpHash                    // 构建哈希
    OpIndex                   // 索引访问
    OpCall                    // 函数调用
    OpReturnValue             // 返回值
    OpReturn                  // 无返回值
    OpClosure                 // 创建闭包
    OpGetFree                 // 读取自由变量
    OpCurrentClosure          // 当前闭包（递归）
)
```

- 实现编译器 `compiler.Compiler`：
  - `Compile(node ast.Node) error`：遍历 AST，发射字节码
  - `Bytecode() *Bytecode`：输出指令序列 + 常量池
- 实现符号表 `compiler.SymbolTable`：
  - 全局/局部/自由变量的作用域管理
  - `Define(name)`, `Resolve(name)` 接口
- 实现指令的可读输出（disassembler）：用于调试

```text
0000 OpConstant 0    // 加载常量池[0] = 1
0003 OpConstant 1    // 加载常量池[1] = 2
0006 OpAdd
0007 OpPop
```

**验证标准：** `let x = 1 + 2;` 编译为正确的字节码序列，disassembler 输出可读

---

### 第 8 章：虚拟机（VM）（难度：⭐⭐⭐⭐）

**理论部分：**

- 虚拟机执行模型：
  - 取指（Fetch）→ 译码（Decode）→ 执行（Execute）循环
  - 操作数栈（Operand Stack）：所有运算在栈上进行
  - 帧栈（Call Stack / Frame Stack）：函数调用管理
- 帧（Frame）设计：
  - 指令指针（IP）：当前执行位置
  - 基指针（BP）：局部变量在栈中的起始位置
  - 闭包引用：当前执行的函数对象
- 变量存储：
  - 全局变量：固定大小的全局存储数组
  - 局部变量：操作数栈上的槽位（通过 BP + 偏移访问）
  - 自由变量：闭包捕获的外部变量（独立数组）
- 函数调用协议：
  - 调用方：压入闭包 → 压入参数 → `OpCall`
  - 被调方：创建帧 → 执行 → `OpReturnValue` → 调用方取结果
  - 尾调用优化（TCO）的概念（了解）
- 真实 VM 对比：
  - JVM：栈式、JIT（HotSpot C1/C2）
  - CPython VM：栈式、GIL、帧对象
  - V8 Ignition：寄存器式字节码 + TurboFan JIT
  - Lua VM：寄存器式、C 实现、协程

**动手环节：**

- 实现虚拟机 `vm.VM`：

```go
type VM struct {
    constants []object.Object
    globals   []object.Object
    frames    []*Frame
    frameIndex int
    stack     []object.Object  // 操作数栈
    sp        int              // 栈指针（始终指向下一个空闲位置）
}
```

- 实现执行循环：

```go
func (vm *VM) Run() error {
    for vm.currentFrame().ip < len(bytecode)-1 {
        vm.currentFrame().ip++
        op := bytecode[vm.currentFrame().ip]
        switch op {
        case code.OpConstant:
            // 读取操作数 → 压栈
        case code.OpAdd:
            // 弹出两个操作数 → 计算 → 压栈
        case code.OpCall:
            // 创建帧 → 压入帧栈
        // ...
        }
    }
}
```

- 逐步扩展 VM 能力：
  1. 基础：算术运算、比较运算、布尔运算
  2. 变量：全局变量读写、局部变量读写
  3. 控制流：条件跳转（`if/else`）、无条件跳转
  4. 函数：闭包创建、函数调用、返回值
  5. 数据结构：数组构建/索引、哈希构建/索引
  6. 内置函数：在 VM 中调用内置函数
- 端到端测试：源码 → Compile → VM.Run → 断言栈顶结果

**验证标准：**

```text
源码: let fibonacci = fn(x) { if (x == 0) { 0 } else { if (x == 1) { 1 } else { fibonacci(x - 1) + fibonacci(x - 2) } } }; fibonacci(15);
VM 输出: 610
```

---

### 第 9 章：程序分析与优化（难度：⭐⭐⭐⭐）

**理论部分：**

> **前置要求**：本章的数据流分析需要循环结构才能体现不动点迭代的意义。建议在开始本章前，先为 Monkey 语言添加 `while` 循环支持（Parser + Evaluator + 字节码 + VM），这也是第 11 章扩展方向的推荐选项。

- **控制流分析（Control Flow Analysis）**：
  - 控制流图（CFG）的构造：从字节码/三地址码划分基本块、建立块间边
  - **支配关系（Dominance）**：
    - 支配（Dominate）：从入口到 B 的每条路径都经过 A，则 A 支配 B
    - 支配树（Dominator Tree）：直接支配关系构成的树
    - 支配边界（Dominance Frontier）：SSA 构造中 φ 函数的插入位置
  - **循环检测**：
    - 回边（Back Edge）：指向支配自己的节点的边
    - 自然循环（Natural Loop）：回边 + 循环体
    - 循环嵌套与循环不变量
  - 控制流分析的应用：循环优化、不可达代码检测、SSA 构造
- **数据流分析（Data Flow Analysis）**：
  - 数据流分析的通用框架：
    - 方向：前向（Forward）vs 后向（Backward）
    - 汇合操作（Meet）：交集（∩）vs 并集（∪）
    - **不动点迭代（Fixed-Point Iteration）**：反复传播直到不再变化
    - 格（Lattice）理论：保证终止性（了解）
  - 经典数据流问题：
    - **到达定义（Reaching Definitions）**：前向 + 并集 → 哪些赋值能到达某个程序点
    - **活跃变量（Live Variables）**：后向 + 并集 → 某个程序点后哪些变量还会被使用（寄存器分配的基础）
    - **可用表达式（Available Expressions）**：前向 + 交集 → 哪些表达式不需要重新计算（CSE 的基础）
    - **非常忙表达式（Very Busy Expressions）**：后向 + 交集 → 代码移动（Code Motion）
  - 数据流方程的写法：$in[B] = \bigcup_{P \in pred(B)} out[P]$，$out[B] = gen[B] \cup (in[B] - kill[B])$
  - 真实应用：
    - LLVM 的 Pass 体系：每个优化 Pass 依赖特定的数据流分析
    - Go 编译器的 SSA 优化 pass
    - 静态分析工具（ESLint 的 no-unused-vars 本质是活跃变量分析）

> **与程序分析大纲的分工**：本章覆盖数据流分析的**概念与框架**（理解"是什么"和"为什么"），侧重编译器优化视角。程序分析大纲第 5 章在此基础上实现**通用 Worklist 引擎**并深入格论设计，侧重静态分析工具视角。

- **编译器优化分类**：
  - 局部优化（基本块内）：常量折叠（Constant Folding）、常量传播（Constant Propagation）、局部 CSE
  - 全局优化（跨基本块）：死代码消除（DCE）、全局 CSE、循环不变量外提（LICM）
  - 循环优化：循环展开（Unrolling）、循环不变量外提、强度削减
  - 内联（Inlining）：函数内联消除调用开销（JIT 的核心优化）
  - **代码生成理论**（了解）：
    - 指令选择（Instruction Selection）：树模式匹配、最优覆盖
    - 寄存器分配（Register Allocation）：图着色算法、溢出（Spill）
    - 指令调度（Instruction Scheduling）：流水线冒险、关键路径
    - 即使目标是字节码 VM，局部变量槽分配 ≈ 寄存器分配
- 真实编译器的优化管道：
  - V8 TurboFan：Sea of Nodes IR → 类型推断 → 内联 → 逃逸分析 → 寄存器分配
  - LLVM：IR → Pass Manager → 数百个优化 Pass
  - esbuild：AST 级优化（常量折叠、DCE、minify）
  - Go 编译器：SSA passes（nil check 消除、边界检查消除、内联）

**动手环节：**

- 实现常量折叠：

```go
// 编译期：1 + 2 → 直接发射 OpConstant 3，而非 OpConstant 1, OpConstant 2, OpAdd
```

- 实现死代码消除：

```go
// if (true) { a } else { b } → 只编译 a 分支
```

- 实现简单的循环不变量外提（LICM）：
  - 识别自然循环中的不变量（引用了循环外变量的表达式）
  - 将不变量移动到循环前

**验证标准：** 常量折叠和 DCE 生效；能手动推导一个含 `while` 循环的 CFG 的到达定义不动点

---

### 第 10 章：JIT 编译与工程化（难度：⭐⭐⭐）

**理论部分：**

- **JIT 编译（Just-In-Time Compilation）**：
  - 为什么 JIT：运行时信息（类型分布、热点路径）是 AOT 无法获取的
  - **分层编译（Tiered Compilation）**：
    - V8：Ignition（解释器）→ Sparkplug（非优化编译）→ Maglev（中度优化）→ TurboFan（激进优化）
    - HotSpot：解释器 → C1（Client）→ C2（Server）
  - **类型反馈与投机优化（Speculative Optimization）**：
    - 收集运行时类型信息 → 假设类型不变 → 生成特化代码
    - 假设失败时 → **去优化（Deoptimization）**：回退到解释器
  - **内联缓存（Inline Cache, IC）**：
    - 属性访问加速：缓存最近的对象形状（Hidden Class）
    - 单态 → 多态 → 超态（megamorphic）
  - **OSR（On-Stack Replacement）**：在循环执行中替换栈帧为优化版本
  - Tracing JIT vs Method JIT：
    - Tracing：录制热点路径（trace）→ 编译（TraceMonkey，已废弃）
    - Method：以函数为单位编译（主流方案）
- 错误处理工程化：
  - 编译错误：语法错误、未定义变量、类型不匹配
  - 运行时错误：除零、栈溢出、索引越界
  - 错误位置信息：行号、列号、源码片段
  - 错误报告 UX：Rust 编译器（rustc）的 diagnostic 是工业标杆
- 测试策略：
  - 单元测试：每个模块独立测试
  - 端到端测试：源码 → 最终结果
  - 快照测试：AST / 字节码输出快照
  - Fuzzing：随机输入测试鲁棒性

**动手环节：**

- 实现错误报告系统：

```text
Error: undefined variable 'foo'
  --> line 3, column 5
   |
 3 |   foo + 1;
   |   ^^^
```

- 实现栈溢出检测（递归深度限制）
- 编写完整的测试套件：覆盖所有语言特性的端到端测试
- 为 VM 添加简单的执行计数（每个函数被调用次数），体验"热点检测"的基本思想

**验证标准：** 错误信息包含行列位置和源码片段；所有测试通过；能解释 V8 四级分层编译中每级的触发条件和优化策略

---

### 第 11 章：综合实战与真实编译器对标（难度：⭐⭐⭐⭐⭐）

**理论部分：**

- 完整项目回顾：从源码到执行的全链路
  - 解释器路径：Source → Lexer → Parser → AST → Evaluator → Result
  - 编译器路径：Source → Lexer → Parser → AST → Compiler → Bytecode → VM → Result
- 对标真实编译器/解释器架构：

| 模块 | 本项目 | V8 | Babel | esbuild | Go 编译器 |
|------|--------|-----|-------|---------|----------|
| 词法分析 | `lexer/` | Scanner | tokenizer | lexer | scanner |
| 语法分析 | `parser/` | Parser | parser | parser | parser |
| AST | `ast/` | AST | @babel/types | AST | syntax |
| 语义分析 | 符号表 | ScopeAnalyzer | scope | binder | typecheck |
| 中间表示 | 字节码 | Bytecode/Sea of Nodes | AST (IR) | AST | SSA |
| 优化 | 常量折叠/DCE | TurboFan Passes | plugin transforms | AST transforms | SSA passes |
| 代码生成 | VM 执行 | JIT → 机器码 | code generator | printer | assembler |

- 扩展方向（选做）：
  - 添加更多 JS 特性：`for`/`while` 循环、`this`、原型链、`class`
  - 实现 REPL 增强：多行输入、自动补全、历史记录
  - 实现模块系统：`import`/`export`、文件加载
  - 实现 Source Map：字节码位置 → 源码位置的映射（VLQ 编码）
  - 性能基准测试：与 Node.js / QuickJS 对比执行速度
  - 用 WASM 编译 VM：在浏览器中运行
- **静态分析进阶路线**（本大纲覆盖的能力 → 进阶方向）：
  - 已覆盖 → 可直接上手：
    - AST 级 Lint 规则（ESLint 自定义规则、ts-morph 脚本）
    - 类型检查器原理（TypeScript checker 的架构）
    - 作用域分析（Babel scope、no-shadow 规则）
  - 已覆盖基础 → 需补充学习：
    - 数据流分析应用：ESLint no-unused-vars（活跃变量）、no-unreachable（CFG 可达性）
    - 控制流敏感分析：TypeScript 的 narrowing（`if (x !== null)` 后类型收窄）
    - SSA 上的分析：LLVM opt 的 pass 编写
  - 未覆盖 → 进阶方向：
    - **抽象解释（Abstract Interpretation）**：在抽象域上计算程序所有可能行为的过近似，需要格论（Lattice）数学基础。参考：Astrée（空客安全关键软件验证）
    - **符号执行（Symbolic Execution）**：用符号值代替具体值执行，探索所有路径。参考：KLEE、Z3 SMT Solver
    - **污点分析（Taint Analysis）**：追踪不可信数据的传播路径，安全漏洞检测的基础。参考：Snyk、CodeQL
    - **模型检验（Model Checking）**：穷举验证有限状态系统是否满足规约。参考：SPIN、TLA+
    - **程序验证（Program Verification）**：Hoare 逻辑、分离逻辑、Dafny/F* 等验证语言
  - 推荐进阶路径：本大纲 → CodeQL（GitHub 的语义代码分析引擎）→ 抽象解释/符号执行

**动手环节：**

- 整合所有模块，确保解释器路径和编译器路径都能完整运行
- 编写项目 README：架构说明、运行方式、语言特性列表
- 选择一个扩展方向实现（推荐：`for`/`while` 循环 或 模块系统）
- 用本项目代码对照 V8/Babel 源码，写一篇架构对标笔记

**验证标准：** 项目可独立运行，支持完整的语言特性，有清晰的文档和测试

---

## 📐 核心概念速查

| 概念 | 一句话解释 | 对应章节 |
|------|-----------|---------|
| 乔姆斯基层次 | 文法/语言的四层分类：正则 ⊂ 上下文无关 ⊂ 上下文相关 ⊂ 递归可枚举 | 第 2 章 |
| Thompson 构造法 | 正则表达式 → NFA 的系统化构造算法 | 第 2 章 |
| 子集构造法 | NFA → DFA 的确定化算法（ε-闭包 + 状态集合） | 第 2 章 |
| Token | 词法分析的最小输出单元（类型 + 字面值） | 第 2 章 |
| FIRST/FOLLOW 集 | LL(1) 分析表构造的基础：FIRST 看能推出什么，FOLLOW 看后面跟什么 | 第 3 章 |
| LR 分析族 | 自底向上分析的递进：LR(0) → SLR → LALR → LR(1)，能力递增 | 第 3 章 |
| AST | 源代码语法结构的树形表示 | 第 3-4 章 |
| Pratt 解析 | 用优先级表驱动的递归下降，优雅处理表达式优先级 | 第 3 章 |
| 属性文法 | 在文法规则上附加属性（综合/继承），实现语法制导翻译 | 第 4 章 |
| 符号表 | 记录声明信息的数据结构，语义分析的核心产物 | 第 4 章 |
| 类型推断 | 无需显式标注即可推导类型（Hindley-Milner / Algorithm W） | 第 4 章 |
| 环境（Environment） | 变量名 → 值的映射，链式结构实现作用域嵌套 | 第 5 章 |
| 闭包 | 函数 + 其定义时的词法环境引用 | 第 5-6 章 |
| 活动记录 | 函数调用时在栈上创建的帧：返回地址 + 参数 + 局部变量 + 静态链 | 第 6 章 |
| 分代 GC | 基于"多数对象朝生夕灭"假说，Young 代用 Copying、Old 代用 Mark-Compact | 第 6 章 |
| 三地址码 | 每条指令最多三个操作数的 IR 形式（四元式） | 第 7 章 |
| SSA | 每个变量只赋值一次的 IR 形式，用 φ 函数合并控制流 | 第 7 章 |
| 控制流图（CFG） | 基本块 + 块间跳转边构成的程序结构图 | 第 7 章 |
| 字节码 | 介于 AST 和机器码之间的紧凑指令序列 | 第 7 章 |
| 常量池 | 编译期收集的不可变数据（整数、字符串、函数）的存储区 | 第 7 章 |
| 操作数栈 | VM 中所有运算的数据来源和结果存放处 | 第 8 章 |
| 帧（Frame） | 一次函数调用的执行上下文（IP + BP + 闭包） | 第 8 章 |
| 支配关系 | 从入口到 B 的每条路径都经过 A，则 A 支配 B（SSA 构造的基础） | 第 9 章 |
| 数据流分析 | 在 CFG 上用不动点迭代计算程序属性的通用框架 | 第 9 章 |
| 活跃变量 | 某程序点之后还会被使用的变量（寄存器分配 / no-unused-vars 的基础） | 第 9 章 |
| 常量折叠 | 编译期计算常量表达式，减少运行时开销 | 第 9 章 |
| JIT 分层编译 | 解释 → 轻度优化 → 激进优化的多级编译策略（V8 四级） | 第 10 章 |
| 去优化 | JIT 投机假设失败时回退到解释器执行 | 第 10 章 |
| 内联缓存（IC） | 缓存属性访问的对象形状，加速动态语言的对象操作 | 第 10 章 |
| 回填（Backpatching） | 先发射占位跳转地址，后续确定目标后回填 | 第 7 章 |

---

## ✅ 完成标准

- [ ] 能解释乔姆斯基层次，说明正则语言、上下文无关语言、上下文相关语言的边界与对应自动机
- [ ] 能描述 Thompson 构造法和子集构造法的过程（正则 → NFA → DFA）
- [ ] 能手写 Lexer，将 JS 子集源码切分为完整 Token 流
- [ ] 能手写 Pratt Parser，输出正确的 AST（含优先级和结合性）
- [ ] 能计算简单文法的 FIRST/FOLLOW 集，解释 LL(1) 与 LR 分析的区别
- [ ] 能解释属性文法（综合属性/继承属性）和语法制导翻译的概念
- [ ] 能实现符号表构建和基础类型检查（未定义变量检测、类型规则）
- [ ] 能实现 Tree-walking 解释器，支持变量、函数、闭包、递归
- [ ] 能实现运行时对象系统（整数、布尔、字符串、数组、哈希、函数、内置函数）
- [ ] 能画出活动记录（栈帧）的结构，区分传值/传引用/传共享的语义差异
- [ ] 能解释分代 GC 的原理（Young/Old 代、三色标记、写屏障）
- [ ] 能解释三地址码、SSA（φ 函数）、控制流图的概念与用途
- [ ] 能设计栈式字节码指令集，将 AST 编译为字节码
- [ ] 能实现基于栈的 VM，正确执行所有字节码指令
- [ ] 能解释支配关系、数据流分析框架（不动点迭代），说明活跃变量/到达定义的分析过程
- [ ] 能实现至少 2 种编译优化（常量折叠 + 死代码消除），并解释其分析基础
- [ ] 能解释 JIT 分层编译、去优化、内联缓存的工作原理
- [ ] 能画出本项目与 V8/Babel 的架构对标图
- [ ] 能编写简单的 AST 级 Lint 规则，理解 ESLint no-unused-vars 背后的活跃变量分析
- [ ] 所有模块有完整的单元测试和端到端测试
- [ ] 项目可独立运行，有 README 和清晰的目录结构

---

## 🔗 关联模块

- 数据结构：[data-structures/](../data-structures/) — AST（树）、操作数栈（栈）、符号表/环境（哈希表）、调用栈
- 计算机组成原理：[computer-organization/](../computer-organization/) — 第 5 章 CPU 指令执行过程（取指→译码→执行）与 VM 执行循环的类比；流水线与 JIT 优化
- 操作系统：[operating-system/](../operating-system/) — 进程/线程与 VM 执行环境；内存管理与 GC；系统调用与内置函数
- 计算机网络：[networking/](../networking/) — 协议解析（HTTP/JSON parser）与编译原理的 Parser 技术同源
- 实操互补：[front/react/](../../front/react/) — JSX 编译（Babel/SWC transform）是编译原理的直接应用
- 实操互补：[artificial-intelligence/](../../artificial-intelligence/) — Prompt 模板引擎、DSL 设计涉及 Lexer/Parser 技术

---

## 📝 学习建议

1. **先跑通再优化**：每章先实现最简版本，确保端到端跑通，再逐步扩展语言特性。不要一开始就追求完整的 JS 语义
2. **测试驱动**：每个语言特性先写测试（输入源码 → 期望输出），再实现功能。Go 的表驱动测试非常适合这个场景
3. **解释器先行，编译器后置**：Tree-walking 解释器是理解语义的最快路径。字节码编译器是在你完全理解语义之后的「性能升级」
4. **多画数据流图**：Token 流 → AST → 字节码 → 栈状态，每个阶段画出数据变换过程，比看代码有效 10 倍
5. **对照真实项目**：学完每章后，去 V8/Babel/esbuild 源码中找对应模块看一遍，理解工业级实现的差异
6. **不要跳过错误处理**：错误处理不是「附加功能」，它是理解语言语义的重要部分（作用域、类型系统、运行时状态）
7. **Go 的 interface 是关键工具**：AST 节点、Object 系统都依赖 interface 多态。如果对 Go interface 不熟，先花半天补一下
8. **龙书当字典用**：不需要从头读龙书，遇到概念（FIRST/FOLLOW 集、LR 解析、数据流方程）时查阅对应章节即可
9. **形式语言理论不要跳过**：乔姆斯基层次、FIRST/FOLLOW、LR 分析族看起来"学术"，但它们解释了"为什么 Parser 要这样写"。不理解这些，写 Parser 就是照猫画虎
10. **语义分析是连接语法和执行的桥梁**：属性文法和类型检查的概念在写 Babel 插件、ESLint 规则、TypeScript 类型体操时都会用到，不是纯理论
11. **数据流分析是静态分析的入口**：学完活跃变量和到达定义后，试着用 ESLint 的视角重新理解 no-unused-vars、no-unreachable 这些规则，会发现它们就是数据流分析的工程应用
12. **JIT 部分重理解不重实现**：第 10 章的分层编译、去优化、IC 这些概念理解原理即可，不需要在本项目中实现。但理解它们能让你真正看懂 V8 的性能优化博客
