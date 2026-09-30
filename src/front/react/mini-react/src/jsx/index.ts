// JSX 运行时：createElement（经典形态）与 jsx/jsxs（automatic runtime 形态）
// 真实源码对照：packages/react/src/jsx/ReactJSXElement.js
export const REACT_ELEMENT_TYPE = Symbol.for('react.element')

// 元素协议符号：memo / context / provider / suspense 的身份标识（篇 06~11 接入）。
// 符号值与真实源码 ReactSymbols.js 同款
export const REACT_MEMO_TYPE = Symbol.for('react.memo')
export const REACT_CONTEXT_TYPE = Symbol.for('react.context')
export const REACT_PROVIDER_TYPE = Symbol.for('react.provider')
export const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense')

export type Key = string | number | null

export type Props = Record<string, unknown>

// 虚拟 DOM 节点：用普通对象描述「这一次渲染的 UI」
export type ReactElement = {
  $$typeof: symbol
  type: ElementType
  key: Key
  props: Props
}

// 节点子项的原语形态（单行声明：保证 .ts 与文档 md 内嵌块的 oxfmt 结果一致）
export type ChildPrimitive = string | number | boolean | null | undefined

// 组件可以返回的渲染结果（false / undefined 渲染为空，由 reconcile 消化）
export type ReactNode = ReactElement | ChildPrimitive

// 函数组件：接收 props 返回渲染结果（篇 06）
export type ComponentType = (props: Props) => ReactNode

// memo 包裹的组件壳（篇 08）：beginWork 按 $$typeof 识别后剥壳渲染
export type MemoType = {
  $$typeof: typeof REACT_MEMO_TYPE
  type: ComponentType
}

// Context 与 Provider（篇 08）：<Ctx.Provider value={…}> 编译产物的 type
// 就是 Provider 对象，Provider.context 反查 context 本体（真实源码
// createContext 的 Provider 也是独立对象，字段名做了教学化简化）
export type Context<T> = {
  $$typeof: typeof REACT_CONTEXT_TYPE
  defaultValue: T
  currentValue: T
  Provider: ProviderType<T>
}

export type ProviderType<T> = {
  $$typeof: typeof REACT_PROVIDER_TYPE
  context: Context<T>
}

// useContext 的依赖登记条目：真实源码是 fiber.dependencies 上的单链表节点
// （ReactInternalTypes.js 的 ContextDependency），教学版用数组同构
export type ContextDependency<T> = {
  context: Context<T>
  memoizedValue: T
}

// Suspense 边界元素的 type 形态（篇 11）：<Suspense> 的编译产物 type 就是
// 这个对象，beginWork 按 $$typeof 识别后进入边界渲染逻辑
export type SuspenseType = {
  $$typeof: typeof REACT_SUSPENSE_TYPE
}

// 非宿主元素形态合集（单行声明：保证 .ts 与文档 md 内嵌块的 oxfmt 结果一致）
export type NonHostElement =
  | ComponentType
  | MemoType
  | ProviderType<unknown>
  | SuspenseType

// 元素 type 的完整形态：宿主标签 / 函数组件 / memo / Provider（篇 06 起扩展）
export type ElementType = string | NonHostElement

// jsx(type, config, maybeKey)：automatic runtime 的编译产物入口
// 真实源码同款行为：key 优先取第三个参数，其次取 config.key；
// config 里没有 key 时直接把 config 当 props 复用（编译器每次传新对象，安全）
export const jsx = (
  type: ElementType,
  config: Props,
  maybeKey?: Key
): ReactElement => {
  let key: Key = null
  if (maybeKey !== undefined) {
    key = String(maybeKey)
  } else if (config.key !== undefined) {
    key = String(config.key)
  }
  let props: Props
  if (!('key' in config)) {
    props = config
  } else {
    // 把 key 从 props 里剔除（key 是定位符，不是属性）
    props = {}
    for (const propName of Object.keys(config)) {
      if (propName !== 'key') {
        props[propName] = config[propName]
      }
    }
  }
  return { $$typeof: REACT_ELEMENT_TYPE, type, key, props }
}

// jsxs：children 为静态数组的形态（编译器按 children 数量选 jsx 或 jsxs）
export const jsxs = (
  type: ElementType,
  config: Props,
  maybeKey?: Key
): ReactElement => {
  return jsx(type, config, maybeKey)
}

// createElement(type, config, ...children)：经典 runtime 手写形态
// 与 jsx 的差异：children 以 rest 参数传入、props 必须新建（config 可能被复用）
export const createElement = (
  type: ElementType,
  config: Props | null,
  ...children: unknown[]
): ReactElement => {
  const props: Props = {}
  let key: Key = null
  if (config !== null) {
    for (const propName of Object.keys(config)) {
      if (propName !== 'key' && propName !== 'ref') {
        props[propName] = config[propName]
      }
    }
    if (config.key !== undefined) {
      key = String(config.key)
    }
  }
  // 单个 child 直接挂值，多个 child 收成数组——这就是 children 形态的来源
  props.children = children.length === 1 ? children[0] : children
  return { $$typeof: REACT_ELEMENT_TYPE, type, key, props }
}
