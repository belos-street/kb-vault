# 设计模式学习大纲（TypeScript 实现 · 逐模式精讲）

> 以「每个模式一篇笔记 + 一份 TS 实现」为粒度，覆盖 GoF 23 种经典模式 + 现代工程模式。每个模式聚焦：意图、结构、适用场景、TS 实现、真实框架/库中的实例。本目录是模式的"字典"，架构层面的模式组合与选型决策见 [software-engineering/](../software-engineering/software-engineering-learning-outline.md) 第 8 章。

---

## 📌 元信息

| 项目 | 说明 |
|------|------|
| **定位** | 逐模式精讲 + 代码实现，作为模式参考手册 |
| **目标读者** | 有 OOP 基础、想系统掌握设计模式的前端/全栈工程师 |
| **前置知识** | TypeScript、面向对象基础（继承/多态/接口）、UML 类图基本读法 |
| **实现语言** | TypeScript（严格模式，利用 interface/generics/decorator 等语言特性） |
| **参考书** | Gamma《Design Patterns》/ Freeman《Head First Design Patterns》/ Refactoring.Guru |
| **关联** | [software-engineering/](../software-engineering/) 第 8 章：模式如何服务于架构决策 |

---

## 🎯 学习目标

完成本模块学习后，你应该能够：

1. 说出每个模式的意图、解决的问题、典型结构（类图）
2. 用 TypeScript 实现每个模式，理解语言特性如何简化经典实现
3. 在真实代码中识别模式的应用（Node.js/React/Express/NestJS 等）
4. 区分易混淆模式对（策略 vs 状态、装饰器 vs 代理、工厂方法 vs 抽象工厂）
5. 判断何时该用模式、何时不该用（避免过度设计）
6. 从 code smell 出发反向定位适用模式（问题驱动，而非模式驱动）

---

## 🗺️ 学习路径

### Part I：创建型模式（5 种）

| 章节 | 模式 | 核心意图 | 真实实例 |
|------|------|---------|---------|
| 第 1 章 | Singleton | 确保唯一实例 + 全局访问点 | NestJS Provider、Redux Store |
| 第 2 章 | Factory Method | 将实例化延迟到子类 | `document.createElement`、Logger 工厂 |
| 第 3 章 | Abstract Factory | 创建一族相关对象 | UI 主题工厂（Light/Dark 组件族） |
| 第 4 章 | Builder | 分步构建复杂对象 | SQL Query Builder、`fetch` Request 配置 |
| 第 5 章 | Prototype | 通过克隆创建新对象 | `Object.create`、`structuredClone` |

### Part II：结构型模式（7 种）

| 章节 | 模式 | 核心意图 | 真实实例 |
|------|------|---------|---------|
| 第 6 章 | Adapter | 接口转换，使不兼容类协作 | Axios adapter、Express 中间件适配 |
| 第 7 章 | Bridge | 抽象与实现分离，独立变化 | React 组件（抽象）+ 渲染器（DOM/Native） |
| 第 8 章 | Composite | 树形结构，统一叶子与容器 | DOM 树、文件系统、React 组件树 |
| 第 9 章 | Decorator | 动态添加职责 | Java I/O 流、TS `@decorator`、Express 中间件 |
| 第 10 章 | Facade | 简化复杂子系统接口 | `jQuery.$()`、Bundler 高层 API |
| 第 11 章 | Flyweight | 共享细粒度对象，减少内存 | 字符串池、Canvas 文字渲染缓存 |
| 第 12 章 | Proxy | 控制对象访问 | `Proxy`/`Reflect`、Vue 3 响应式、RPC stub |

### Part III：行为型模式（11 种）

| 章节 | 模式 | 核心意图 | 真实实例 |
|------|------|---------|---------|
| 第 13 章 | Chain of Responsibility | 将请求沿处理者链传递 | Express/Koa 中间件、DOM 事件冒泡 |
| 第 14 章 | Command | 将请求封装为对象 | Redux Action、撤销/重做栈 |
| 第 15 章 | Interpreter | 定义文法并解释执行 | 正则引擎、模板表达式解析 |
| 第 16 章 | Iterator | 顺序访问集合元素 | `Symbol.iterator`、Generator |
| 第 17 章 | Mediator | 对象间解耦通信 | EventEmitter、聊天室、MVC 中 Controller |
| 第 18 章 | Memento | 捕获/恢复对象状态 | 编辑器 Undo、Git commit |
| 第 19 章 | Observer | 一对多依赖通知 | `addEventListener`、RxJS、Vue 响应式 |
| 第 20 章 | State | 状态驱动行为切换 | TCP 连接状态机、订单状态流转 |
| 第 21 章 | Strategy | 可互换的算法族 | 排序策略、压缩算法选择、表单验证 |
| 第 22 章 | Template Method | 固定骨架，子类填充步骤 | React 生命周期、Test fixture |
| 第 23 章 | Visitor | 分离数据结构与操作 | AST 遍历（Babel/eslint visitor） |

### Part IV：现代工程模式

> **边界说明**：本 Part 聚焦「代码级」模式（类/模块粒度）。系统级架构模式（CQRS 的部署拓扑、Event Sourcing 的存储选型、微服务拆分）属于架构决策范畴，详见 [software-engineering/](../software-engineering/software-engineering-learning-outline.md) 第 9、14 章。此处仅从模式结构与实现角度切入。

| 章节 | 模式 | 核心意图 | 真实实例 |
|------|------|---------|---------|
| 第 24 章 | Dependency Injection | 控制反转，解耦依赖 | NestJS DI、tsyringe、InversifyJS |
| 第 25 章 | Repository | 封装数据访问，领域层不依赖存储细节 | TypeORM Repository、Prisma Client |
| 第 26 章 | CQRS | 读写模型分离 | 事件驱动架构、搜索与写入分离 |
| 第 27 章 | Event Sourcing | 以事件序列重建状态 | Redux、Git、银行流水 |
| 第 28 章 | Middleware / Pipeline | 可组合的请求处理管道 | Koa 洋葱模型、Webpack loader |

### 附录：Code Smell → 模式速查

| Code Smell | 候选模式 |
|------------|---------|
| 大量 if/else 或 switch 分支 | Strategy、State、Command |
| 对象创建散落在各处 | Factory Method、Abstract Factory |
| 构造函数参数爆炸 | Builder |
| 需要动态组合功能，继承爆炸 | Decorator、Composite |
| 第三方接口与内部抽象不匹配 | Adapter、Facade |
| 对象间多对多耦合 | Mediator、Observer |
| 操作逻辑与数据结构频繁一起改 | Visitor |
| 需要撤销/重做/审计 | Command、Memento |

---

## 📝 每篇笔记结构

```markdown
# 模式名（英文名）

## 意图
一句话说清楚解决什么问题

## 结构（UML 类图）
Mermaid classDiagram

## 适用场景
- 什么时候用
- 什么时候不该用

## 代价与权衡
- 引入的复杂度（类数量、间接层）
- 对可读性/调试的影响
- 不用此模式的替代方案

## TypeScript 实现
完整可运行代码

## 真实世界实例
在框架/库源码中的对应

## 易混淆对比
与相似模式的区分（如适用）

## 关联
- 常配合使用的模式
- 在 software-engineering/ 架构中的位置
```

---

## 🔗 关联模块

| 关联 | 说明 |
|------|------|
| [software-engineering/](../software-engineering/) | 第 8 章：模式选型决策 + 架构场景下的模式组合 |
| [algorithms/](../algorithms/) | 策略模式封装的算法实现 |
| [compiler/](../compiler/) | Visitor 模式在 AST 遍历中的核心应用 |
