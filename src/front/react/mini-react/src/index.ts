// mini-react 统一出口
// 批次 A（篇 02~05）：JSX + 宿主元素渲染 + 双缓存 Diff + Commit 闭环
// 批次 B（篇 06~08）：函数组件 + Hooks 全家桶（state / effect / memo / Context）
// 批次 C（篇 09~11）：调度器 + lane 优先级 + Transition/DeferredValue + Suspense
export { REACT_ELEMENT_TYPE, createElement, jsx, jsxs } from './jsx'
export type {
  ComponentType,
  Context,
  ContextDependency,
  Key,
  Props,
  ReactElement,
  ReactNode
} from './jsx'
export { createRoot } from './fiber/workLoop'
export type { Fiber, FiberRoot } from './fiber'
export { ChildDeletion, Placement, Update } from './reconcile'
export {
  createContext,
  memo,
  useDeferredValue,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  startTransition,
  useTransition
} from './hooks'
export type { Dispatch, SetStateAction } from './hooks'
export { Suspense } from './suspense'
