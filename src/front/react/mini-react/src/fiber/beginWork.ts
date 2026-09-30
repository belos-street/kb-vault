// render 阶段的工作单元：beginWork 向下，completeWork 向上
// 真实源码对照：ReactFiberBeginWork.js / ReactFiberCompleteWork.js
import type { Fiber, Props } from './index'
import {
  createWorkInProgress,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './index'
import type {
  ComponentType,
  Context,
  ElementType,
  MemoType,
  ProviderType
} from '../jsx'
import { REACT_MEMO_TYPE, REACT_PROVIDER_TYPE } from '../jsx'
import { reconcileChildren, Update } from '../reconcile'
import { propagateContextChange, renderWithHooks } from '../hooks'
import { DidCapture, isSuspenseType } from '../suspense'
import { NoLanes } from '../scheduler/lanes'

// beginWork：处理「进入」一个 fiber——比较 children，返回下一个工作单元
export const beginWork = (workInProgress: Fiber): Fiber | null => {
  switch (workInProgress.tag) {
    case HostRoot:
      return beginHostRoot(workInProgress)
    case HostComponent:
      return beginHostComponent(workInProgress)
    case FunctionComponent:
      return beginFunctionComponent(workInProgress)
    case HostText:
    default:
      // 文本节点是叶子：没有 children 可比较
      return null
  }
}

const beginHostRoot = (workInProgress: Fiber): Fiber | null => {
  const props = workInProgress.pendingProps as Props
  reconcileChildren(workInProgress, props.children)
  return workInProgress.child
}

const beginHostComponent = (workInProgress: Fiber): Fiber | null => {
  const props = workInProgress.pendingProps as Props
  reconcileChildren(workInProgress, props.children)
  return workInProgress.child
}

// 类型守卫：memo / Provider 都是「对象形态」的元素 type（符号见 jsx/index.ts）
const isMemoType = (type: ElementType | null): type is MemoType => {
  return (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_MEMO_TYPE
  )
}

const isProviderType = (
  type: ElementType | null
): type is ProviderType<unknown> => {
  return (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_PROVIDER_TYPE
  )
}

// 函数组件 fiber 没有 stateNode：beginWork 直接调用组件函数取 children
// （真实源码走 renderWithHooks → finishRenderingHooks 的完整管线）
const beginFunctionComponent = (workInProgress: Fiber): Fiber | null => {
  const type = workInProgress.type
  if (isProviderType(type)) {
    return beginProvider(workInProgress, type.context)
  }
  if (isSuspenseType(type)) {
    return beginSuspense(workInProgress)
  }
  const props = workInProgress.pendingProps as Props
  // memo 是组件的「浅比较壳」：props 未变且 context 未变就 bailout，
  // 组件函数一次都不调用（篇 08）
  if (isMemoType(type) && workInProgress.alternate !== null) {
    const current = workInProgress.alternate
    const prevProps = current.memoizedProps
    if (
      typeof prevProps === 'object' &&
      prevProps !== null &&
      !hasScheduledUpdate(current) &&
      !hasPropsChanged(prevProps as Props, props) &&
      !hasContextChanged(workInProgress)
    ) {
      return bailoutOnAlreadyFinishedWork(workInProgress)
    }
  }
  const Component = (isMemoType(type) ? type.type : type) as ComponentType
  const children = renderWithHooks(workInProgress, Component, props)
  reconcileChildren(workInProgress, children)
  // memo 的浅比较基准：记录本次渲染的 props（真实源码同款回写位置）
  workInProgress.memoizedProps = workInProgress.pendingProps
  return workInProgress.child
}

// Suspense 边界（篇 11）：<Suspense> 的 type 是 Suspense 对象，fiber 复用
// FunctionComponent 标签。DidCapture 表示本次渲染捕获了 promise——
// 改出 fallback；正常路径渲染 children（真实源码 updateSuspenseComponent）
const beginSuspense = (workInProgress: Fiber): Fiber | null => {
  const props = workInProgress.pendingProps as Props
  if ((workInProgress.flags & DidCapture) !== 0) {
    workInProgress.flags &= ~DidCapture
    reconcileChildren(workInProgress, props.fallback)
  } else {
    reconcileChildren(workInProgress, props.children)
  }
  workInProgress.memoizedProps = workInProgress.pendingProps
  return workInProgress.child
}

// Provider（篇 08）：先把 value 写进 context（children 随后渲染即可读到新值），
// 变更时沿旧树标记依赖 fiber——context 更新的「树上标记」
const beginProvider = (
  workInProgress: Fiber,
  context: Context<unknown>
): Fiber | null => {
  const props = workInProgress.pendingProps as Props
  const newValue = props.value
  if (!Object.is(context.currentValue, newValue)) {
    context.currentValue = newValue
    const current = workInProgress.alternate
    propagateContextChange(current !== null ? current.child : null, context)
  }
  reconcileChildren(workInProgress, props.children)
  workInProgress.memoizedProps = workInProgress.pendingProps
  return workInProgress.child
}

// memo 放行检查之一：本 fiber 登记过的 context 是否有值变更
// （变更标记由 Provider 的 propagateContextChange 写入 memoizedValue）
const hasContextChanged = (fiber: Fiber): boolean => {
  const deps = fiber.dependencies
  if (deps === null) {
    return false
  }
  return deps.some((dep) => dep.context.currentValue !== dep.memoizedValue)
}

// memo 放行检查之二（篇 10）：本 fiber 有无待处理更新（lane 位）。
// 真实源码按 renderLanes 精确匹配（checkScheduledUpdateOrContext）；
// 教学版保守处理：有任何待处理 lane 就放行重渲
const hasScheduledUpdate = (current: Fiber): boolean => {
  return current.lanes !== NoLanes
}

// bailout：props 浅比较相等且 context 未变 → 跳过重渲。
// 真实 React 按 childLanes/subtreeFlags 惰性逐层克隆；教学版二选一：
// 子树干净就整棵克隆（零重渲），子树里有 context 变更标记或待处理
// 更新（篇 10 lane 位）就只克隆一层、让循环继续深入走到被标记的 fiber
const bailoutOnAlreadyFinishedWork = (workInProgress: Fiber): Fiber | null => {
  workInProgress.memoizedProps = workInProgress.pendingProps
  const current = workInProgress.alternate
  if (current === null || current.child === null) {
    return null
  }
  if (subtreeHasContextChange(current.child) || subtreeHasLanes(current.child)) {
    const child = createWorkInProgress(
      current.child,
      current.child.pendingProps
    )
    child.return = workInProgress
    workInProgress.child = child
    return child
  }
  workInProgress.child = cloneFinishedSubtree(current.child, workInProgress)
  return null
}

const subtreeHasContextChange = (start: Fiber): boolean => {
  if (hasContextChanged(start)) {
    return true
  }
  if (start.child !== null && subtreeHasContextChange(start.child)) {
    return true
  }
  return start.sibling !== null && subtreeHasContextChange(start.sibling)
}

// 子树有无待处理更新（篇 10）：dispatch 时 lane 记在触发更新的 fiber 上
// （current.lanes），渲染消费后随克隆体清零——检查是精确的
const subtreeHasLanes = (start: Fiber): boolean => {
  if (start.lanes !== NoLanes) {
    return true
  }
  if (start.child !== null && subtreeHasLanes(start.child)) {
    return true
  }
  return start.sibling !== null && subtreeHasLanes(start.sibling)
}

// 整棵克隆已完成的子树：fiber 骨架复用（alternate 互指），flags 已由
// createWorkInProgress 清空——commit 对它不做任何 DOM 操作
const cloneFinishedSubtree = (current: Fiber, returnFiber: Fiber): Fiber => {
  const wip = createWorkInProgress(current, current.pendingProps)
  wip.return = returnFiber
  wip.index = current.index
  wip.memoizedProps = current.memoizedProps
  wip.sibling =
    current.sibling !== null
      ? cloneFinishedSubtree(current.sibling, returnFiber)
      : null
  wip.child =
    current.child !== null ? cloneFinishedSubtree(current.child, wip) : null
  return wip
}

// completeWork：处理「完成」一个 fiber——只负责宿主节点：
// 挂载时创建 DOM 并自底向上拼装子树；更新时只 diff props、标记 Update，
// 真正动手改 DOM 留给 commit 阶段（渲染阶段保持可中断的纯计算）。
// 函数组件 fiber 没有 DOM 输出，走 default 分支直接跳过
export const completeWork = (workInProgress: Fiber): void => {
  const current = workInProgress.alternate
  switch (workInProgress.tag) {
    case HostComponent: {
      const props = workInProgress.pendingProps as Props
      if (current !== null && workInProgress.stateNode !== null) {
        const oldProps = current.memoizedProps
        if (
          typeof oldProps === 'object' &&
          oldProps !== null &&
          hasPropsChanged(oldProps as Props, props)
        ) {
          workInProgress.flags |= Update
        }
      } else {
        // 首挂载：创建实例，并把已完成的子节点 DOM 拼进自己
        // （HostComponent 的 type 一定是标签名字符串）
        const type = workInProgress.type
        if (typeof type === 'string') {
          const instance = document.createElement(type)
          updateProps(instance, {}, props)
          appendAllChildren(instance, workInProgress)
          workInProgress.stateNode = instance
        }
      }
      workInProgress.memoizedProps = props
      break
    }
    case HostText: {
      const text = workInProgress.pendingProps as string
      if (current !== null && current.memoizedProps !== text) {
        workInProgress.flags |= Update
      }
      if (workInProgress.stateNode === null) {
        workInProgress.stateNode = document.createTextNode(text)
      }
      workInProgress.memoizedProps = text
      break
    }
    default:
      break
  }
}

const hasPropsChanged = (oldProps: Props, newProps: Props): boolean => {
  for (const key of Object.keys(newProps)) {
    if (oldProps[key] !== newProps[key]) {
      return true
    }
  }
  for (const key of Object.keys(oldProps)) {
    if (!(key in newProps)) {
      return true
    }
  }
  return false
}

// 真实源码同款：appendAllChildren 把已完成子树的 DOM 摘下来挂进父实例。
// 所以首挂载时只有最顶层的节点需要 Placement（见 reconcile 的 mountChildFibers）。
// 注意 else-if：宿主 fiber 的 DOM 内部已在各自的 completeWork 拼装完毕，
// 追加后不再下钻（appendChild 是移动语义，重复下钻会把子孙 DOM 拽出来）；
// 只有函数组件这类「没有自己 DOM」的 fiber 才向下找宿主节点
const appendAllChildren = (parent: Node, workInProgress: Fiber): void => {
  let node = workInProgress.child
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      const dom = node.stateNode
      if (dom instanceof Node) {
        parent.appendChild(dom)
      }
    } else if (node.child !== null) {
      // 函数组件 / Provider / memo：向下穿透找第一层宿主 DOM
      node = node.child
      continue
    }
    if (node === workInProgress) {
      return
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return
      }
      node = node.return
    }
    node = node.sibling
  }
}

// props 写入（含原生事件简化绑定）。export 供 commit 阶段复用
export const updateProps = (
  dom: HTMLElement,
  oldProps: Props,
  newProps: Props
): void => {
  for (const key of Object.keys(oldProps)) {
    if (key === 'children' || key === 'key' || key === 'ref') {
      continue
    }
    if (key in newProps && oldProps[key] === newProps[key]) {
      continue
    }
    removeProp(dom, key, oldProps[key])
  }
  for (const key of Object.keys(newProps)) {
    if (key === 'children' || key === 'key' || key === 'ref') {
      continue
    }
    if (key in oldProps && oldProps[key] === newProps[key]) {
      continue
    }
    setProp(dom, key, newProps[key])
  }
}

const setProp = (dom: HTMLElement, key: string, value: unknown): void => {
  if (key.startsWith('on') && typeof value === 'function') {
    // 原生事件简化：onClick → addEventListener('click')（合成事件不在本系列范围）
    dom.addEventListener(key.slice(2).toLowerCase(), value as EventListener)
    return
  }
  if (key === 'style' && typeof value === 'object' && value !== null) {
    Object.assign(dom.style, value)
    return
  }
  if (typeof value === 'boolean') {
    const target = dom as unknown as Record<string, unknown>
    target[key] = value
    return
  }
  dom.setAttribute(key, String(value))
}

const removeProp = (dom: HTMLElement, key: string, oldValue: unknown): void => {
  if (key.startsWith('on') && typeof oldValue === 'function') {
    dom.removeEventListener(
      key.slice(2).toLowerCase(),
      oldValue as EventListener
    )
    return
  }
  if (key === 'style') {
    dom.removeAttribute('style')
    return
  }
  if (typeof oldValue === 'boolean') {
    const target = dom as unknown as Record<string, unknown>
    target[key] = false
    return
  }
  dom.removeAttribute(key)
}
