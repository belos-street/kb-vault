// workLoop 与渲染入口：切片循环 / 调度器接管 / Suspense 捕获 / createRoot
// 真实源码对照：packages/react-reconciler/src/ReactFiberWorkLoop.js
import type { Fiber, FiberRoot, ReactRoot } from './index'
import { createHostRootFiber, createWorkInProgress } from './index'
import { beginWork, completeWork } from './beginWork'
import { commitMutation } from '../commit'
import { flushLayoutEffects, schedulePassiveEffects } from '../hooks'
import { handleSuspenseThrow } from '../suspense'
import { scheduleCallback, shouldYield } from '../scheduler'
import {
  DefaultLane,
  NoLanes,
  getNextLanes,
  lanesToSchedulerPriority,
  mergeLanes,
  removeLanes
} from '../scheduler/lanes'
import type { Lanes } from '../scheduler/lanes'
import type { ReactElement } from '../jsx'

let workInProgress: Fiber | null = null
let workInProgressRoot: FiberRoot | null = null
// 本次渲染要处理的 lane 集（真实源码 workInProgressRootRenderLanes）
let workInProgressRootRenderLanes: Lanes = NoLanes
// 本次渲染是否因 Transition 挂起被放弃（屏幕保持旧 UI，等 resolve 重试）
let renderDidSuspend = false
// 调度排班闸门：篇 06 闸的是微任务，篇 09 起闸的是调度器任务
let isRenderScheduled = false
let scheduledRoot: FiberRoot | null = null

// hooks 消费更新队列时需要知道本次渲染的 lane 集
export const getRenderLanes = (): Lanes => workInProgressRootRenderLanes

// suspense 挂起时需要根引用（promise resolve 后的调度目标）
export const getWorkInProgressRoot = (): FiberRoot | null => workInProgressRoot

// performUnitOfWork：一个可中断的「工作单元」。
// beginWork 向下（返回 child）；到叶子后 completeWork 沿 sibling 向右、
// 向 return 向上回溯——用循环替代了 v0 递归的调用栈
export const performUnitOfWork = (fiber: Fiber): Fiber | null => {
  const next = beginWork(fiber)
  if (next !== null) {
    return next
  }
  let current: Fiber | null = fiber
  while (current !== null) {
    completeWork(current)
    if (current.sibling !== null) {
      return current.sibling
    }
    current = current.return
  }
  return null
}

// 单步执行：promise 上抛在这里被最近的 Suspense 边界接住（篇 11）。
// 返回下一个工作单元；Transition 挂起放弃渲染时返回 null 并置 renderDidSuspend
const stepUnitOfWork = (fiber: Fiber): Fiber | null => {
  try {
    return performUnitOfWork(fiber)
  } catch (thrownValue) {
    const next = handleSuspenseThrow(fiber, thrownValue)
    if (next === null) {
      // Transition 防闪：放弃本次渲染现场——旧 UI 保持，等 promise resolve
      renderDidSuspend = true
      return null
    }
    // 回到边界重新 begin：本次渲染改出 fallback
    return next
  }
}

// 同步循环：任务过期（饿死保护触发）时不再让出，一口气跑完（真实源码
// workLoopSync，performConcurrentWorkOnRoot 在 didTimeout 分支调用）
const workLoopSync = (): void => {
  while (workInProgress !== null) {
    workInProgress = stepUnitOfWork(workInProgress)
  }
}

// 切片循环：每完成一个工作单元检查一次时间片。真实源码
// workLoopConcurrentByScheduler 同款条件：
// while (workInProgress !== null && !shouldYield())
const workLoopConcurrent = (): void => {
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = stepUnitOfWork(workInProgress)
  }
}

// 更新调度入口（篇 06 排班闸门 + 篇 10 lane 标记）：dispatch 入队后从这里触发
export const scheduleRootRender = (root: FiberRoot, lane: Lanes): void => {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane)
  ensureRootIsScheduled(root)
}

// ensureRootIsScheduled：真实源码同名函数。已有排班时不重复排——
// 高优先级更新到达后，下一次切片会从 pendingLanes 重取最高 lane，
// 进行中的低优先级渲染现场被丢弃重启（插队）
const ensureRootIsScheduled = (root: FiberRoot): void => {
  if (isRenderScheduled) {
    return
  }
  isRenderScheduled = true
  scheduledRoot = root
  const priority = lanesToSchedulerPriority(getNextLanes(root))
  scheduleCallback(priority, performConcurrentWorkOnRoot)
}

// 调度器任务本体：每次被调用都取 pendingLanes 的最高优先级 lane 渲染。
// 返回 true 表示渲染未完成（时间片让出，任务留在队列下一片继续）
const performConcurrentWorkOnRoot = (didTimeout: boolean): boolean => {
  const root = scheduledRoot
  if (root === null) {
    return false
  }
  const lanes = getNextLanes(root)
  if (lanes === NoLanes) {
    isRenderScheduled = false
    scheduledRoot = null
    return false
  }
  renderRoot(root, lanes, didTimeout)
  if (renderDidSuspend) {
    // Transition 挂起：lane 出账，promise resolve 后以 RetryLane 重新排班
    renderDidSuspend = false
    root.pendingLanes = removeLanes(
      root.pendingLanes,
      workInProgressRootRenderLanes
    )
    isRenderScheduled = false
    scheduledRoot = null
    return false
  }
  if (workInProgress !== null) {
    // 时间片耗尽：任务留在队列，下一片继续
    return true
  }
  commitRoot()
  isRenderScheduled = false
  scheduledRoot = null
  if (root.pendingLanes !== NoLanes) {
    // 提交后还有低优先级 lane：续排（真实源码 markRootFinished 后的再调度）
    ensureRootIsScheduled(root)
  }
  return false
}

const renderRoot = (
  root: FiberRoot,
  lanes: Lanes,
  didTimeout: boolean
): void => {
  // 高优先级插队：渲染目标 lane 变了 → 丢弃现场重新开始
  // （真实源码 renderRootConcurrent 里 lanes 不一致走 prepareFreshStack）
  if (
    workInProgressRoot !== root ||
    workInProgressRootRenderLanes !== lanes
  ) {
    workInProgressRoot = root
    workInProgressRootRenderLanes = lanes
    workInProgress = createWorkInProgress(
      root.current,
      root.current.pendingProps
    )
  }
  renderDidSuspend = false
  if (didTimeout) {
    workLoopSync()
  } else {
    workLoopConcurrent()
  }
}

// commitRoot 入口骨架：只负责「调 mutation + 交换双缓存 + 收尾 effects」，
// 具体 DOM 操作在 src/commit。真实源码里这一层串联三大子阶段
const commitRoot = (): void => {
  const root = workInProgressRoot
  const finishedWork = root !== null ? root.current.alternate : null
  if (root === null || finishedWork === null) {
    return
  }
  commitMutation(finishedWork, root)
  // 双缓存交换：workInProgress 树转正为 current 树。
  // 真实源码这一行在 mutation 之后、layout 之前执行
  root.current = finishedWork
  // layout effects：同步执行——DOM 已更新、浏览器尚未绘制（篇 07）
  flushLayoutEffects()
  // passive effects：异步 flush（篇 09 起由调度器接管）
  schedulePassiveEffects()
  // 本次渲染消费的 lane 出账（真实源码 markRootFinished 同位置）
  root.pendingLanes = removeLanes(
    root.pendingLanes,
    workInProgressRootRenderLanes
  )
  workInProgressRoot = null
  workInProgress = null
}

// createRoot(container).render(element)：与 react-dom/client 同款 API
export const createRoot = (container: Element): ReactRoot => {
  const root: FiberRoot = {
    containerInfo: container,
    current: createHostRootFiber(),
    pendingLanes: NoLanes
  }
  root.current.stateNode = root
  return {
    render(element: ReactElement): void {
      // 要渲染的 element 挂在 HostRoot 的 pendingProps.children 上
      // （真实 React 走 updateContainer → 更新队列，简化为直接赋值）
      root.current.pendingProps = { children: element }
      // 首挂载也走调度器（DefaultLane）——篇 09 起 render 不再同步执行
      scheduleRootRender(root, DefaultLane)
    }
  }
}
