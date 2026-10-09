// Fiber 数据结构与工厂函数
// 真实源码对照：packages/react-reconciler/src/ReactFiber.js 与 ReactInternalTypes.js
import type {
  ContextDependency,
  ElementType,
  Key,
  Props,
  ReactElement
} from '../jsx'
import { NoLanes } from '../scheduler/lanes'

// WorkTag 简化版：数值与真实源码对齐（ReactWorkTags.js）
// FunctionComponent=0：函数组件 / memo / Provider 共用（篇 06 启用）
export const FunctionComponent = 0
export const HostRoot = 3
export const HostComponent = 5
export const HostText = 6

export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText

// NoFlags 与 reconcile/ 中其余 flags 常量配套，数值对齐 ReactFiberFlags.js
export const NoFlags = 0

export type { Key, Props } from '../jsx'

export type FiberRoot = {
  containerInfo: Element
  current: Fiber
  // 根上待处理的 lane 集合（篇 10；真实源码 FiberRoot 同名字段）
  pendingLanes: number
}

// createRoot 返回的根容器：与 react-dom/client 的 Root 同款 API
export type ReactRoot = {
  render: (element: ReactElement) => void
}

// Fiber：链表化的工作单元。字段与真实源码 ReactInternalTypes.js 同名对齐
export type Fiber = {
  tag: WorkTag
  // 宿主标签 / 函数组件 / memo / Provider；HostText 没有标签，为 null
  type: ElementType | null
  key: Key
  // HostComponent 存 DOM 节点；HostRoot 存 FiberRoot；函数组件无 DOM
  stateNode: Node | FiberRoot | null
  return: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  index: number
  // 待提交的 props；HostText 直接存文本字符串
  pendingProps: Props | string
  memoizedProps: Props | string | null
  // 篇 06：hooks 链表的挂载点（链表头）
  memoizedState: unknown
  // 篇 08：useContext 的依赖登记（真实源码 fiber.dependencies 同名字段）
  dependencies: ContextDependency<unknown>[] | null
  flags: number
  deletions: Fiber[] | null
  // 待处理更新位（篇 10；dispatch 入队时标记，渲染消费后随克隆体清零）
  lanes: number
  alternate: Fiber | null
}

export const createFiber = (
  tag: WorkTag,
  pendingProps: Props | string,
  key: Key
): Fiber => ({
  tag,
  type: null,
  key,
  stateNode: null,
  return: null,
  child: null,
  sibling: null,
  index: 0,
  pendingProps,
  memoizedProps: null,
  memoizedState: null,
  dependencies: null,
  flags: NoFlags,
  deletions: null,
  lanes: NoLanes,
  alternate: null
})

export const createFiberFromElement = (element: {
  type: ElementType
  key: Key
  props: Props
}): Fiber => {
  // 宿主标签走 HostComponent；函数组件 / memo / Provider 共用 FunctionComponent
  // （真实源码按 type 形态分派到 createFiberFromElement / createFiberFromMemo 等）
  const tag =
    typeof element.type === 'string' ? HostComponent : FunctionComponent
  const fiber = createFiber(tag, element.props, element.key)
  fiber.type = element.type
  return fiber
}

export const createFiberFromText = (text: string): Fiber => {
  return createFiber(HostText, text, null)
}

// createWorkInProgress：双缓存的核心。复用 alternate 或克隆 current
// 真实源码同款签名：createWorkInProgress(current, pendingProps)
export const createWorkInProgress = (
  current: Fiber,
  pendingProps: Props | string
): Fiber => {
  let wip = current.alternate
  if (wip === null) {
    wip = createFiber(current.tag, pendingProps, current.key)
    wip.type = current.type
    wip.stateNode = current.stateNode
    wip.alternate = current
    current.alternate = wip
  } else {
    // 复用已有骨架：只刷新「这一次渲染」的字段
    wip.pendingProps = pendingProps
    wip.type = current.type
    wip.flags = NoFlags
    wip.deletions = null
    wip.child = null
    wip.sibling = null
    wip.index = 0
    // lane 位在渲染消费时并入 renderLanes，克隆体清零（真实源码同款）
    wip.lanes = NoLanes
    // context 依赖登记以上一次已提交的记录为基准带到本次渲染
    // （真实源码 beginWork 时同样从 current 克隆 dependencies）
    wip.dependencies = current.dependencies
  }
  return wip
}

// 容器 fiber：每个 createRoot 一个，stateNode 指向 FiberRoot
export const createHostRootFiber = (): Fiber => {
  return createFiber(HostRoot, {}, null)
}
