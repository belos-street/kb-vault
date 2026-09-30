// Suspense 边界：throw promise 捕获 → fallback → resolve 后低优先级重试
// 真实源码对照：packages/react-reconciler/src/ReactFiberThrow.js（throwException）
import type { Fiber, FiberRoot } from '../fiber'
import type { ElementType, SuspenseType } from '../jsx'
import { REACT_SUSPENSE_TYPE } from '../jsx'
import {
  RetryLane,
  TransitionLanes,
  includesSomeLane
} from '../scheduler/lanes'
import {
  getRenderLanes,
  getWorkInProgressRoot,
  scheduleRootRender
} from '../fiber/workLoop'

// <Suspense> 的元素 type：beginWork 按 $$typeof 识别（与 memo/Provider 同款）
export const Suspense: SuspenseType = { $$typeof: REACT_SUSPENSE_TYPE }

// 「本次渲染捕获了 promise」标记：数值对齐 ReactFiberFlags.js 的 DidCapture。
// 真实源码还有 ShouldCapture（边界自身 beginWork 期间挂起），教学版只走
// 子树挂起路径，统一用 DidCapture
export const DidCapture = 0b10000000

const isThenable = (value: unknown): value is Promise<unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<unknown>).then === 'function'
  )
}

export const isSuspenseType = (
  type: ElementType | null
): type is SuspenseType => {
  return (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_SUSPENSE_TYPE
  )
}

// Transition 挂起的边界集合：resolve 前保持旧 UI（防闪 fallback）。
// 挂在「current 树的边界 fiber」上——它跨渲染稳定；渲染提交成功后解除
const transitionHolds = new WeakSet<Fiber>()

// Suspense 边界提交成功：解除防闪保持（commitMutation 遍历时调用）
export const releaseSuspenseHold = (currentBoundary: Fiber): void => {
  transitionHolds.delete(currentBoundary)
}

// 从抛出点沿 return 向上找最近的 Suspense 边界
// （真实源码 throwException 内的 do-while 向上遍历同款）
export const findNearestSuspenseBoundary = (fiber: Fiber): Fiber | null => {
  let node: Fiber | null = fiber.return
  while (node !== null) {
    if (isSuspenseType(node.type)) {
      return node
    }
    node = node.return
  }
  return null
}

// promise 落定后以 RetryLane 重新调度渲染（篇 10 优先级系统的 Retry 档）。
// 真实源码把 retryLane 标到边界 fiber 的 lanes 上再 ensureRootIsScheduled；
// 教学版从根重渲，简化但闭环等价
const retryWhenResolved = (
  promise: Promise<unknown>,
  root: FiberRoot
): void => {
  const retry = (): FiberRoot => {
    scheduleRootRender(root, RetryLane)
    return root
  }
  promise.then(retry)
}

// 挂起处理：决定「切 fallback 继续渲染」还是「放弃渲染保持旧 UI」。
// 返回下一个工作单元（边界 fiber，重新 begin 后改出 fallback）；
// 返回 null 表示放弃整个渲染现场（workLoop 据此中止本次渲染）
export const suspendBoundary = (
  boundary: Fiber,
  promise: Promise<unknown>
): Fiber | null => {
  const root = getWorkInProgressRoot()
  if (root === null) {
    // 渲染不在进行中（理论不可达：挂起只发生在渲染阶段）
    return null
  }
  const lanes = getRenderLanes()
  const current = boundary.alternate
  if (current !== null && transitionHolds.has(current)) {
    // 重试仍挂起（多资源链式加载）：继续 hold，等最后一个 resolve
    retryWhenResolved(promise, root)
    return null
  }
  if (current !== null && includesSomeLane(lanes, TransitionLanes)) {
    // Transition 防闪 fallback：更新的是「已有内容」——保持旧 UI，
    // 丢弃本次渲染现场（不提交任何东西），resolve 后重试
    transitionHolds.add(current)
    retryWhenResolved(promise, root)
    return null
  }
  // 挂载中的边界（或非 Transition 更新）：立即切 fallback，
  // promise resolve 后以 RetryLane 重试 children
  boundary.flags |= DidCapture
  retryWhenResolved(promise, root)
  return boundary
}

// workLoop 的 catch 入口：非 promise 的异常原样上抛；
// 没有边界可接也原样上抛（真实源码 throwException 同款分流）
export const handleSuspenseThrow = (
  sourceFiber: Fiber,
  thrownValue: unknown
): Fiber | null => {
  if (!isThenable(thrownValue)) {
    throw thrownValue
  }
  const boundary = findNearestSuspenseBoundary(sourceFiber)
  if (boundary === null) {
    throw thrownValue
  }
  return suspendBoundary(boundary, thrownValue)
}
