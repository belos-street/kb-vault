根据"快速上手、面试能答、写出高质量自定义 Hook"的目标，这份大纲把 React Hooks 学习拆解成 **7 个模块**，每天 1~2 小时，**约两周完成**。每个模块都对应到面试常问点，最后用一个**自定义 Hooks 工具库**串联全部知识。

---

## 学习目标
- 理解 Hooks 的设计动机：告别 Class 组件、逻辑复用更优雅
- 掌握核心 Hooks 的用法与常见陷阱（闭包、依赖、渲染）
- 能独立封装自定义 Hook，替代 HOC / Render Props 等旧模式
- 面试时能解释 Hooks 底层链表机制和调用规则

---

## 前置要求
- 熟悉 JavaScript ES6+（解构、箭头函数、Promise、模块化）
- 了解 React 基本概念（JSX、组件、Props、State）
- 无需 Class 组件经验，模块 1 会从函数组件起步

> **实现语言**：后续所有教学文档中的代码示例和练习均使用 **TypeScript** 编写。需具备基础 TS 知识（类型注解、泛型、接口）。如果尚不熟悉 TS，建议先阅读 [TypeScript 基础笔记](../typescript/)。

---

## 模块详解

### 模块 1：useState 与 useEffect 基础（1 天）
**面试可答**：`useState` 管理组件状态，`effect` 处理副作用，依赖数组控制执行时机。

- `useState` 基本用法与函数式更新
- 状态不可变原则（数组/对象更新方式）
- `useEffect` 执行时机：挂载、更新、卸载
- 依赖数组：空数组、有依赖、无依赖的区别
- 清理函数（cleanup）的作用
- **练习**：实现一个计数器 + 一个窗口尺寸监听 Hook

---

### 模块 2：useRef 与记忆化 Hooks（1 天）
**面试可答**：`useRef` 持久化引用且不触发重渲染，`useMemo` 缓存计算结果，`useCallback` 缓存函数引用。

- `useRef` 操作 DOM
- `useRef` 作为实例变量（保存定时器 ID、上一次状态等）
- `useMemo` 缓存昂贵计算
- `useCallback` 稳定函数引用，配合 `React.memo` 优化
- `React.memo` 与 `useCallback` 的配合关系
- **练习**：实现一个带防抖的搜索输入框

---

### 模块 3：useContext 与 useReducer（1 天）
**面试可答**：`useContext` 消灭层层传递的 Props，`useReducer` 用 dispatch 管理复杂状态逻辑。

- `createContext` + `useContext` 基本模式
- Context 性能问题与拆分方案
- `useReducer` 用法：action、reducer、dispatch
- `useReducer` vs `useState` 的选择时机
- Context + Reducer 模拟简易 Redux
- **练习**：实现一个主题切换（亮/暗模式）Context

---

### 模块 4：自定义 Hooks（1.5 天）
**面试可答**：自定义 Hook 是以 `use` 开头的函数，内部可组合任意 Hooks，实现逻辑复用。

- 自定义 Hook 的命名与设计原则
- 返回值设计：数组 vs 对象
- 核心自定义 Hook 模式（本模块重点实现）：
  - `useToggle` — 布尔状态切换（useState 最简应用）
  - `useDebounce` — 防抖值（useEffect + useRef 组合）
  - `useFetch` — 数据请求封装（useState + useEffect + useReducer）
- **练习**：实现 `useDebounce` + `useFetch`，组合完成搜索功能
- **扩展**：更多实用 Hook 留到模块 7 工具库中实现（useLocalStorage、useClickOutside 等）

---

### 模块 5：进阶 Hooks（1 天）
**面试可答**：`useLayoutEffect` 在 DOM 变更后同步执行（浏览器绘制前），适合读取布局；`useTransition` 标记低优先级更新避免阻塞 UI。

- `useLayoutEffect` vs `useEffect` 的执行时机差异
- `useDeferredValue` 与 `useTransition`（并发特性，React 18 重点）
- **练习**：用 `useLayoutEffect` 实现一个测量 DOM 尺寸的 Hook
- **扩展阅读**（了解即可，用到时再深入）：
  - `useImperativeHandle` + `forwardRef` 暴露组件方法
  - `useId` 生成唯一 ID（SSR 安全）
  - `useSyncExternalStore` 订阅外部数据源

---

### 模块 6：Hooks 原理与规则（1 天）
**面试可答**：Hooks 基于链表存储，每次渲染按顺序调用，所以不能在条件/循环中使用。

- Hooks 底层数据结构：链表（Fiber 节点上的 memoizedState）
- 为什么 Hooks 有调用顺序限制
- 为什么不能在条件语句/循环中调用 Hooks
- `eslint-plugin-react-hooks` 的两条规则
- 常见 Bug 排查清单：
  - 闭包陷阱：effect 中拿到过期的 state → 用函数式更新或 useRef
  - 依赖数组遗漏：effect 不响应变化 → 补全依赖或重构逻辑
  - 无限循环：effect 中 setState 且依赖是对象 → 稳定引用或移出 effect
  - StrictMode 双执行：mount → unmount → mount，非 Bug 而是设计
  - effect 中的异步：不能直接 async，需包装成内部函数
- **练习**：手写一个极简版 `useState`（模拟链表存储）

---

### 模块 7：实战整合 — 自定义 Hooks 工具库（2 天）
**面试可答**：自定义 Hooks 是 React 逻辑复用的最佳实践，替代了 HOC 和 Render Props。

- 整理前 6 个模块的自定义 Hook 为工具库
- 补充更多实用 Hook：
  - `useLocalStorage` — 同步 localStorage（useState + useEffect）
  - `useClickOutside` — 点击外部关闭（useRef + useEffect）
  - `useEventListener` — 事件监听自动清理
  - `useMediaQuery` — 响应式断点（useEffect + matchMedia）
  - `useIntersectionObserver` — 懒加载/曝光检测
- 单元测试：用 `@testing-library/react-hooks` 或 React 18 的 `renderHook`
- **完整项目**：见下方实践项目

> **注意**：React 18 要求 `useEffect` 的 cleanup 在 Strict Mode 下会执行两次（挂载→卸载→再挂载），这是设计如此而非 Bug。

---

## 实践项目：自定义 Hooks 工具库

**功能清单**（覆盖全部核心 API）：
- `useToggle` — 布尔开关（useState）
- `useDebounce` / `useThrottle` — 防抖节流（useEffect + useRef）
- `useFetch` — 数据请求（useState + useEffect + useReducer）
- `useLocalStorage` — 持久化状态（useState + useEffect）
- `useMediaQuery` — 响应式断点（useEffect + matchMedia）
- `useClickOutside` — 外部点击（useRef + useEffect）

**项目结构建议**：
```
hooks/
  index.ts           // 统一导出
  useToggle.ts
  useDebounce.ts
  useFetch.ts
  useLocalStorage.ts
  useMediaQuery.ts
  useClickOutside.ts
  __tests__/         // 单元测试
    useToggle.test.ts
    useFetch.test.ts
```

**制作时间**：3 天（每天 1-2 小时）

---

## 总时间线（每天 1-2 小时）

| 时间段 | 内容 | 积累成果 |
|--------|------|----------|
| 第 1 天 | 模块 1 | useState、useEffect、状态管理基础 |
| 第 2 天 | 模块 2 | useRef、useMemo、useCallback、性能优化 |
| 第 3 天 | 模块 3 | useContext、useReducer、全局状态 |
| 第 4-5 天 | 模块 4 | 自定义 Hook 设计与封装 |
| 第 6 天 | 模块 5+6 | 进阶 Hooks、底层原理 |
| 第 7-8 天 | 模块 7 | Hooks 工具库实战 |

---

## 完成标准
- 能独立封装 5 个以上自定义 Hook 并编写测试
- 能解释 useState/useEffect 的闭包陷阱及解决方案
- 理解 Hooks 链表机制和调用规则
- 面试时能对比 Hooks 与 Class 组件的优劣

---

## Hooks vs Class 组件面试对比

| 维度 | Hooks（函数组件） | Class 组件 |
|------|------------------|-----------|
| 状态管理 | `useState` / `useReducer` | `this.state` + `setState` |
| 副作用 | `useEffect` | 生命周期方法（componentDidMount 等） |
| 逻辑复用 | 自定义 Hook（函数组合） | HOC / Render Props（嵌套地狱） |
| `this` 绑定 | 无 `this`，无绑定问题 | 需要手动绑定或箭头函数 |
| 代码量 | 更少、更扁平 | 更多、更分散 |
| 学习曲线 | 需理解闭包与渲染关系 | 需记忆多个生命周期方法 |
| 状态逻辑组织 | 按功能组织（一个 Hook 管一件事） | 按生命周期组织（同一功能分散多处） |
