// commit 阶段：把 render 阶段算好的 flags 落成真实 DOM 操作（mutation）
// 真实源码对照：packages/react-reconciler/src/ReactFiberCommitWork.js
// 与 ReactFiberWorkLoop.js 的 commitMutationEffects
import type { Fiber, FiberRoot } from '../fiber'
import { FunctionComponent, HostComponent, HostRoot, HostText } from '../fiber'
import type { Props } from '../jsx'
import { ChildDeletion, Placement, Update } from '../reconcile'
import { collectFiberEffects, runUnmountEffects } from '../hooks'
import { isSuspenseType, releaseSuspenseHold } from '../suspense'
import { updateProps } from '../fiber/beginWork'

// commitMutation：遍历 finishedWork 树，按 flags 分派 DOM 操作。
// 显式栈迭代而非递归：兄弟链的深度 = 兄弟数量（篇 09 练习渲染 5000 节点
// 列表，递归会栈溢出）。真实源码遍历 + subtreeFlags 剪枝（flags 都没有的
// 子树整棵跳过）
export const commitMutation = (finishedWork: Fiber, root: FiberRoot): void => {
  const stack: Fiber[] = [finishedWork]
  while (stack.length > 0) {
    const fiber = stack.pop()
    if (fiber === undefined) {
      break
    }
    if ((fiber.flags & ChildDeletion) !== 0 && fiber.deletions !== null) {
      for (const deleted of fiber.deletions) {
        commitDeletion(deleted)
      }
      fiber.deletions = null
    }
    if ((fiber.flags & Placement) !== 0) {
      commitPlacement(fiber, root)
    }
    if ((fiber.flags & Update) !== 0) {
      commitUpdate(fiber)
    }
    // 函数组件：把本次渲染待执行的 effect 分拣进 layout / passive 两个队列
    // （layout 由 commitRoot 同步 flush，passive 由调度器异步 flush——篇 07/09）
    if (fiber.tag === FunctionComponent) {
      collectFiberEffects(fiber)
      // Suspense 边界提交成功：解除 Transition 挂起的防闪保持（篇 11）
      if (isSuspenseType(fiber.type) && fiber.alternate !== null) {
        releaseSuspenseHold(fiber.alternate)
      }
    }
    // 先压 sibling 后压 child：下一轮先处理 child（保持先子后弟的顺序）
    if (fiber.sibling !== null) {
      stack.push(fiber.sibling)
    }
    if (fiber.child !== null) {
      stack.push(fiber.child)
    }
  }
}

// 自宿主向上找第一个有 DOM 的父级：HostComponent 用自己的 DOM，
// HostRoot 用容器。函数组件 fiber 没有 stateNode，会被自然跳过（篇 06 接入）
const getHostParentFiber = (fiber: Fiber): Fiber => {
  let parent = fiber.return
  while (parent !== null) {
    if (parent.tag === HostComponent || parent.tag === HostRoot) {
      return parent
    }
    parent = parent.return
  }
  throw new Error('commitPlacement: 找不到宿主父节点')
}

const toNode = (fiber: Fiber): Node | null => {
  const stateNode = fiber.stateNode
  return stateNode instanceof Node ? stateNode : null
}

const commitPlacement = (fiber: Fiber, root: FiberRoot): void => {
  const parentFiber = getHostParentFiber(fiber)
  const parentDOM =
    parentFiber.tag === HostComponent ? toNode(parentFiber) : root.containerInfo
  if (parentDOM === null) {
    return
  }
  // 锚点：右侧第一个「已在容器里」的宿主兄弟；没有就 append 到末尾。
  // 带 Placement 的兄弟自己也在等插入、还不在容器里，必须跳过——
  // 对它 insertBefore 会抛 NotFoundError（真实源码 getHostSibling 同款规则）
  let anchor: Node | null = null
  let sibling = fiber.sibling
  while (sibling !== null) {
    if ((sibling.flags & Placement) === 0) {
      const dom = toNode(sibling)
      if (dom !== null) {
        anchor = dom
        break
      }
    }
    sibling = sibling.sibling
  }
  // 函数组件 fiber 自己没有 DOM：向下找第一层宿主节点再挂
  // （真实源码同款：insertOrAppendPlacementNode 递归穿透函数组件）
  insertOrAppendPlacementNode(fiber, anchor, parentDOM)
}

// 真实源码 insertOrAppendPlacementNode 同款：宿主 fiber 直接挂 DOM；
// 函数组件 fiber 沿 child / sibling 下钻，把子树的宿主 DOM 逐个挂进父级
const insertOrAppendPlacementNode = (
  fiber: Fiber,
  before: Node | null,
  parentDOM: Node
): void => {
  const dom = toNode(fiber)
  if (dom !== null) {
    if (before !== null) {
      parentDOM.insertBefore(dom, before)
    } else {
      parentDOM.appendChild(dom)
    }
    return
  }
  const child = fiber.child
  if (child !== null) {
    insertOrAppendPlacementNode(child, before, parentDOM)
    let sibling = child.sibling
    while (sibling !== null) {
      insertOrAppendPlacementNode(sibling, before, parentDOM)
      sibling = sibling.sibling
    }
  }
}

const commitUpdate = (fiber: Fiber): void => {
  if (fiber.tag === HostText) {
    const dom = fiber.stateNode
    if (dom instanceof Text) {
      dom.nodeValue = fiber.pendingProps as string
    }
    return
  }
  if (fiber.tag === HostComponent) {
    const dom = fiber.stateNode
    if (dom instanceof HTMLElement) {
      const newProps = fiber.pendingProps as Props
      // 旧 props 必须取 alternate（current 树）：completeWork 在 render 阶段
      // 已把新 props 写进 workInProgress.memoizedProps，commit 时再读它拿
      // 到的必然是「新值」——旧值的唯一来源是双缓存的另一侧 current 树
      const oldProps = fiber.alternate?.memoizedProps
      updateProps(
        dom,
        typeof oldProps === 'object' && oldProps !== null
          ? (oldProps as Props)
          : {},
        newProps
      )
    }
  }
  // 其他 tag（函数组件等）：输出走 fiber 链上的子树，无需在此提交 DOM
}

// 删除：先跑被删子树的 unmount effect 清理（篇 07），再从被删 fiber 向下
// 找第一层有 DOM 的节点摘除。函数组件 fiber 没有 stateNode——不能停也不能删，
// 向下穿透；真实 React 会在删除前先跑完子树的 cleanup（组件卸载语义）
const commitDeletion = (fiber: Fiber): void => {
  runUnmountEffects(fiber)
  let node: Fiber | null = fiber
  while (node !== null) {
    const dom = toNode(node)
    if (dom !== null) {
      dom.parentNode?.removeChild(dom)
      return
    }
    node = node.child
  }
}
