// Reconciliation：children 的 diff 与副作用标记
// 真实源码对照：packages/react-reconciler/src/ReactChildFiber.js
// （真实源码把所有逻辑包在 createChildReconciler 工厂里，这里保持同构）
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
  HostText
} from '../fiber'
import type { Fiber } from '../fiber'
import { REACT_ELEMENT_TYPE } from '../jsx'
import type { Key, ReactElement } from '../jsx'

// flags 常量：数值与真实源码对齐（ReactFiberFlags.js）
// 注意：真实源码已用 flags 取代旧名 effectTag；删除标记叫 ChildDeletion，
// 标在父节点上，具体待删节点收进父节点的 deletions 数组
export const Placement = 0b0010
export const Update = 0b0100
export const ChildDeletion = 0b10000

const isReactElement = (value: unknown): value is ReactElement => {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { $$typeof?: symbol }).$$typeof === REACT_ELEMENT_TYPE
  )
}

type Reconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: unknown
) => Fiber | null

// 真实源码同款：mountChildFibers（首挂载）不追踪副作用，reconcileChildFibers
// （更新）才标记 Placement / ChildDeletion。差异只是 shouldTrackSideEffects
export const createChildReconciler = (
  shouldTrackSideEffects: boolean
): Reconciler => {
  const deleteChild = (returnFiber: Fiber, childToDelete: Fiber): void => {
    if (!shouldTrackSideEffects) {
      // 首挂载没有旧节点可删
      return
    }
    if (returnFiber.deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      returnFiber.deletions.push(childToDelete)
    }
  }

  const deleteRemainingChildren = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | null
  ): null => {
    let child = currentFirstChild
    while (child !== null) {
      deleteChild(returnFiber, child)
      child = child.sibling
    }
    return null
  }

  // 复用旧 fiber 的统一入口是 createWorkInProgress：
  // 双缓存骨架（alternate 互指）在那里建立，这里只负责接回 return 指针

  // 单元素路径：key 对上就复用，type 变了整棵旧子树重建
  const reconcileSingleElement = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement
  ): Fiber => {
    let child = currentFirstChild
    while (child !== null) {
      if (child.key === element.key) {
        if (child.type === element.type) {
          // 复用：右侧剩余旧节点全部删除
          deleteRemainingChildren(returnFiber, child.sibling)
          const existing = createWorkInProgress(child, element.props)
          existing.return = returnFiber
          return existing
        }
        // key 相同但 type 不同：整棵旧子树作废
        deleteRemainingChildren(returnFiber, child)
        break
      }
      // key 不同：删掉当前，继续向右找
      deleteChild(returnFiber, child)
      child = child.sibling
    }
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  // 文本路径：旧节点是文本就复用（内容比对留到 completeWork），否则新建
  const updateTextNode = (
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    text: string
  ): Fiber => {
    if (oldFiber === null || oldFiber.tag !== HostText) {
      const created = createFiberFromText(text)
      created.return = returnFiber
      return created
    }
    const existing = createWorkInProgress(oldFiber, text)
    existing.return = returnFiber
    return existing
  }

  // 元素更新：type 相同复用，type 不同新建（旧的留给删除路径处理）
  const updateElement = (
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    element: ReactElement
  ): Fiber => {
    if (oldFiber !== null && oldFiber.type === element.type) {
      const existing = createWorkInProgress(oldFiber, element.props)
      existing.return = returnFiber
      return existing
    }
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  // 第一轮按位置对齐：key 匹配才更新，否则返回 null 让位给第二轮
  const updateSlot = (
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: unknown
  ): Fiber | null => {
    const key = oldFiber !== null ? oldFiber.key : null
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // 文本节点隐式 key 为 null：旧位置有 key 就对不上
      if (key !== null) {
        return null
      }
      return updateTextNode(returnFiber, oldFiber, String(newChild))
    }
    if (isReactElement(newChild)) {
      if (newChild.key === key) {
        return updateElement(returnFiber, oldFiber, newChild)
      }
      return null
    }
    return null
  }

  // 第二轮按 Map 匹配：剩余新子项按 key 找复用。
  // 无 key 节点（文本 / 条件渲染的 null 之外的默认元素）以 index 作为
  // Map 键——真实源码 mapRemainingChildren / updateFromMap 同款兜底，
  // 否则同级多个 null key 节点会在 Map 里互相覆盖、待删节点丢失
  const updateFromMap = (
    returnFiber: Fiber,
    existingChildren: Map<Key, Fiber>,
    newIdx: number,
    newChild: unknown
  ): Fiber | null => {
    if (isReactElement(newChild)) {
      const keyToUse = newChild.key !== null ? newChild.key : newIdx
      const matched = existingChildren.get(keyToUse) ?? null
      if (matched !== null) {
        existingChildren.delete(keyToUse)
      }
      return updateElement(returnFiber, matched, newChild)
    }
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      const matched = existingChildren.get(newIdx) ?? null
      if (matched !== null) {
        existingChildren.delete(newIdx)
      }
      return updateTextNode(returnFiber, matched, String(newChild))
    }
    return null
  }

  // 移动判定核心：lastPlacedIndex 记录「最后一个不需要动的旧节点位置」，
  // 复用节点的旧 index 比它小 → 要从后面挪到前面 → 标 Placement
  const placeChild = (
    newFiber: Fiber,
    lastPlacedIndex: number,
    newIndex: number
  ): number => {
    newFiber.index = newIndex
    if (!shouldTrackSideEffects) {
      // 首挂载：DOM 树由 completeWork 自底向上拼装，不需要 Placement
      return lastPlacedIndex
    }
    if (newFiber.alternate !== null) {
      const oldIndex = newFiber.alternate.index
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement
        return lastPlacedIndex
      }
      return oldIndex
    }
    // 全新节点：插入
    newFiber.flags |= Placement
    return lastPlacedIndex
  }

  // 数组 diff：两轮循环（真实源码同款结构）
  const reconcileChildrenArray = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: unknown[]
  ): Fiber | null => {
    let resultingFirstChild: Fiber | null = null
    let previousNewFiber: Fiber | null = null
    let oldFiber = currentFirstChild
    let lastPlacedIndex = 0
    let newIdx = 0

    // 第一轮：按位置对齐，key 对得上就更新，对不上立即停下
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      const newChild = newChildren[newIdx]
      const newFiber = updateSlot(returnFiber, oldFiber, newChild)
      if (newFiber === null) {
        break
      }
      if (newFiber.alternate === null) {
        // 这个位置没法复用旧节点：旧的被替换，删除
        deleteChild(returnFiber, oldFiber)
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = oldFiber.sibling
    }

    if (newIdx < newChildren.length) {
      // 第二轮：剩余旧节点收进 Map，剩余新子项按 key 找复用
      // （无 key 节点以 index 入表，见 updateFromMap 注释）
      const existingChildren = new Map<Key, Fiber>()
      for (let scan = oldFiber; scan !== null; scan = scan.sibling) {
        existingChildren.set(scan.key !== null ? scan.key : scan.index, scan)
      }
      for (; newIdx < newChildren.length; newIdx++) {
        const newChild = newChildren[newIdx]
        const newFiber = updateFromMap(
          returnFiber,
          existingChildren,
          newIdx,
          newChild
        )
        if (newFiber !== null) {
          lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
          if (previousNewFiber === null) {
            resultingFirstChild = newFiber
          } else {
            previousNewFiber.sibling = newFiber
          }
          previousNewFiber = newFiber
        }
      }
      // 剩余没被复用的旧节点统一删除
      for (const leftover of existingChildren.values()) {
        deleteChild(returnFiber, leftover)
      }
    } else {
      // 新子项先耗尽：剩余旧子树整体删除
      deleteRemainingChildren(returnFiber, oldFiber)
    }

    if (previousNewFiber === null) {
      return null
    }
    // 复用节点可能带着上一轮的旧 sibling 链，切干净
    previousNewFiber.sibling = null
    return resultingFirstChild
  }

  const reconcileChildFibersImpl = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: unknown
  ): Fiber | null => {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      const fiber = updateTextNode(
        returnFiber,
        currentFirstChild,
        String(newChild)
      )
      if (shouldTrackSideEffects && fiber.alternate === null) {
        fiber.flags |= Placement
      }
      return fiber
    }
    if (isReactElement(newChild)) {
      const fiber = reconcileSingleElement(
        returnFiber,
        currentFirstChild,
        newChild
      )
      if (shouldTrackSideEffects && fiber.alternate === null) {
        fiber.flags |= Placement
      }
      return fiber
    }
    if (Array.isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
    }
    // undefined / false / true 等渲染为空
    return null
  }

  return reconcileChildFibersImpl
}

export const reconcileChildFibers = createChildReconciler(true)
export const mountChildFibers = createChildReconciler(false)

// beginWork 的统一入口：有 alternate（更新）走副作用追踪，首挂载不标 flags。
// 与真实源码一致：区分点在 returnFiber 是否有 alternate，而非全局开关
export const reconcileChildren = (
  workInProgress: Fiber,
  newChild: unknown
): void => {
  const current = workInProgress.alternate
  const currentFirstChild = current !== null ? current.child : null
  const reconciler = current === null ? mountChildFibers : reconcileChildFibers
  workInProgress.child = reconciler(workInProgress, currentFirstChild, newChild)
}
