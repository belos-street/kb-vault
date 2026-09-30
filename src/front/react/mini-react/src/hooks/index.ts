// Hooks 全家桶：链表基建 + state 系 / effect 系 / memo 系 / Context
// 真实源码对照：packages/react-reconciler/src/ReactFiberHooks.js
// （真实源码用 mount/update 两张 dispatcher 表分派；教学版用 isUpdatingHooks
//   分支同构实现，函数名与真实源码对齐）
import type { Fiber, FiberRoot } from '../fiber'
import { FunctionComponent, HostRoot } from '../fiber'
import type {
  ComponentType,
  Context,
  ContextDependency,
  MemoType,
  Props,
  ProviderType
} from '../jsx'
import {
  REACT_CONTEXT_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROVIDER_TYPE
} from '../jsx'
import { getRenderLanes, scheduleRootRender } from '../fiber/workLoop'
import { NormalPriority, scheduleCallback } from '../scheduler'
import type { Task } from '../scheduler'
import {
  NoLanes,
  SyncLane,
  claimNextTransitionLane,
  isSubsetOfLanes,
  type Lanes
} from '../scheduler/lanes'

// ─── 公共类型 ───────────────────────────────────────────────
export type SetStateAction<S> = S | ((prev: S) => S)
export type Dispatch<A> = (action: A) => void

// ─── hooks 链表基建（篇 06） ────────────────────────────────
// Hook：链表节点。真实源码 Hook 类型还有 baseState/baseQueue（跳过的更新
// 的恢复基线，篇 10 升级到 UpdateQueue 上）；queue 为 null 表示非 state 类 hook
type Hook = {
  memoizedState: unknown
  queue: UpdateQueue | null
  next: Hook | null
}

// update 的循环链表节点：last 指向队尾，last.next 即队首（真实源码同款结构）。
// lane（篇 10）：更新优先级，dispatch 入队时必带档位
type Update = {
  action: unknown
  lane: Lanes
  next: Update | null
}

// 更新队列（篇 10 升级）：last 是 dispatch 入队的 pending 环；
// baseState 是消费基线，baseQueue 是已消费未提交 / 等待重放的环。
// 三者都挂在共享 queue 上（真实源码的 baseState/baseQueue 挂在 hook 上随
// 克隆携带，教学版收拢进 queue——中断恢复语义等价且更简单）
type UpdateQueue = {
  last: Update | null
  baseState: unknown
  baseQueue: Update | null
}

type InternalDispatch = (action: unknown) => void

// 当前正在渲染的函数组件 fiber：hook 的挂载目标（renderWithHooks 置位/清空）
let currentlyRenderingFiber: Fiber | null = null
// 正在装配的 hook 游标：mount 时指向链尾，update 时指向新克隆的链尾
let workInProgressHook: Hook | null = null
// update 路径在 current 旧链上的游标（与 workInProgressHook 同步前进）
let currentHook: Hook | null = null
// 本次渲染走 mount 还是 update 路径
// （真实源码按 current.memoizedState 是否有旧链来换 dispatcher 表）
let isUpdatingHooks = false

// mountWorkInProgressHook：新建节点接到链尾；首个 hook 挂上 fiber.memoizedState
// （链表头——真实源码同款挂载点，这就是「hooks 存在 fiber 上」的字面落点）
const mountWorkInProgressHook = (): Hook => {
  const hook: Hook = { memoizedState: null, queue: null, next: null }
  const fiber = currentlyRenderingFiber
  if (workInProgressHook === null) {
    if (fiber !== null) {
      fiber.memoizedState = hook
    }
  } else {
    workInProgressHook.next = hook
  }
  workInProgressHook = hook
  return hook
}

// updateWorkInProgressHook：沿 current fiber 的旧链游走，把节点浅克隆到
// 本次渲染的链上。queue 按引用共享——旧渲染创建的 dispatch 入队依然有效。
// 真实源码同款：current 树只读、workInProgress 树重建，双缓存哲学的延续
const updateWorkInProgressHook = (): Hook => {
  const fiber = currentlyRenderingFiber
  let nextCurrentHook: Hook | null
  if (currentHook === null) {
    nextCurrentHook =
      fiber !== null ? (fiber.alternate?.memoizedState as Hook | null) : null
  } else {
    nextCurrentHook = currentHook.next
  }
  if (nextCurrentHook === null) {
    // 典型成因：本次渲染比上次多调用了一个 hook（条件/循环里调用 hook）
    throw new Error(
      '本次渲染的 hook 数量多于上一次：检查是否在条件/循环中调用了 hook'
    )
  }
  currentHook = nextCurrentHook
  const hook: Hook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null
  }
  if (workInProgressHook === null) {
    if (fiber !== null) {
      fiber.memoizedState = hook
    }
  } else {
    workInProgressHook.next = hook
  }
  workInProgressHook = hook
  return hook
}

// ─── 更新入队与调度（篇 06 / 篇 10） ─────────────────────────
// dispatch 工厂：带 lane 入队 → 从所在 fiber 向上找到 HostRoot → 调度重渲
// （reducer 的套用不在入队时做——下一轮渲染消费队列时才逐个执行，真实源码同款惰性）
const createDispatch = (
  fiber: Fiber | null,
  queue: UpdateQueue
): InternalDispatch => {
  return (action) => {
    // 篇 10：更新必带优先级——Transition 标记期间的更新走低优先级档
    const lane =
      currentTransitionLane !== NoLanes ? currentTransitionLane : SyncLane
    const update: Update = { action, lane, next: null }
    const last = queue.last
    if (last === null) {
      update.next = update
    } else {
      update.next = last.next
      last.next = update
    }
    queue.last = update
    const root = markUpdateFromFiberToRoot(fiber, lane)
    if (root !== null) {
      scheduleRootRender(root, lane)
    }
  }
}

// 从触发更新的 fiber 沿 return 向上找 HostRoot（stateNode 持有 FiberRoot），
// 并把 lane 记到触发更新的 fiber 上——memo bailout 放行检查的依据之一
const markUpdateFromFiberToRoot = (
  fiber: Fiber | null,
  lane: Lanes
): FiberRoot | null => {
  if (fiber !== null) {
    fiber.lanes = fiber.lanes | lane
  }
  let node = fiber
  while (node !== null) {
    if (node.tag === HostRoot && node.stateNode !== null) {
      return node.stateNode as FiberRoot
    }
    node = node.return
  }
  return null
}

// ─── state 系（篇 06 / 篇 08） ──────────────────────────────
// useState 的底层 reducer：函数式更新在这里收拢（真实源码同款 basicStateReducer）
const basicStateReducer = <S>(state: S, action: SetStateAction<S>): S => {
  return typeof action === 'function'
    ? (action as (prev: S) => S)(state)
    : action
}

// mount / update 两条路径共用的核心：
// mount 时只建 hook + 空 queue（reducer 在下一轮消费队列时才需要）；
// update 时先消费 update 队列（按 lane 过滤、保序重放），再基于新 state 建 dispatch
const mountStateImpl = (initialState: unknown): [unknown, InternalDispatch] => {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialState
  hook.queue = { last: null, baseState: initialState, baseQueue: null }
  return [initialState, createDispatch(currentlyRenderingFiber, hook.queue)]
}

// 按本次渲染的 renderLanes 消费更新队列（真实源码同名函数 processUpdateQueue）：
// lane 够的更新套用；不够的克隆留环，等后续能处理它的渲染再消费。
// 一旦发生跳过，其后的更新无论优先级全部克隆留环——保证重放时按入队顺序
// 完整重演（真实源码同款语义：套用的克隆 lane 置 NoLanes，0 是任何
// renderLanes 的子集，重放必命中）
const processUpdateQueue = <S, A>(
  hook: Hook,
  reducer: (state: S, action: A) => S,
  renderLanes: Lanes
): void => {
  const queue = hook.queue as UpdateQueue
  // 1. pending 环并入 baseQueue 环（真实源码同名步骤）
  const lastPending = queue.last
  if (lastPending !== null) {
    const lastBase = queue.baseQueue
    if (lastBase === null) {
      queue.baseQueue = lastPending
    } else {
      // 两个环拼接：base 环尾接 pending 环头，pending 环尾接 base 环头
      // （真实源码 updateReducerImpl 的拼接同款；拼接后队尾是 pending 尾）
      const firstBase = lastBase.next
      const firstPending = lastPending.next
      lastBase.next = firstPending
      lastPending.next = firstBase
      queue.baseQueue = lastPending
    }
    queue.last = null
  }
  // 2. 沿 baseQueue 环消费
  let newState = queue.baseState as S
  let newLastBase: Update | null = null
  let didSkip = false
  const lastBase = queue.baseQueue
  if (lastBase !== null) {
    // 环上 head 恒非空（?? 兜底仅为类型收窄）
    const first: Update = lastBase.next ?? lastBase
    let update: Update = first
    do {
      // 环上 next 恒非空（?? first 仅兜底类型）
      const next = update.next ?? first
      if (isSubsetOfLanes(renderLanes, update.lane)) {
        newState = reducer(newState, update.action as A)
        if (newLastBase !== null) {
          // 跳过之后才套用的更新：克隆留环且 lane 置空——已提交的结果
          // 不允许被重放丢掉（真实源码同款 NoLane 克隆）
          const clone: Update = {
            action: update.action,
            lane: NoLanes,
            next: null
          }
          clone.next = newLastBase.next
          newLastBase.next = clone
          newLastBase = clone
        }
      } else {
        // 优先级不足：克隆留环，等下一次能处理它的渲染
        const clone: Update = {
          action: update.action,
          lane: update.lane,
          next: null
        }
        if (newLastBase === null) {
          clone.next = clone
        } else {
          clone.next = newLastBase.next
          newLastBase.next = clone
        }
        newLastBase = clone
        if (!didSkip) {
          // 首次跳过：基线停在跳过前——下一轮从这里重放（真实源码同款语义）
          queue.baseState = newState
          didSkip = true
        }
      }
      update = next
    } while (update !== first)
  }
  queue.baseQueue = newLastBase
  if (!didSkip) {
    queue.baseState = newState
  }
  hook.memoizedState = newState
}

const updateReducerImpl = <S, A>(
  reducer: (state: S, action: A) => S
): [S, Dispatch<A>] => {
  const hook = updateWorkInProgressHook()
  processUpdateQueue(hook, reducer, getRenderLanes())
  const queue = hook.queue as UpdateQueue
  const dispatch = createDispatch(currentlyRenderingFiber, queue)
  return [hook.memoizedState as S, dispatch as Dispatch<A>]
}

export const useState = <S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] => {
  if (isUpdatingHooks) {
    return updateReducerImpl<S, SetStateAction<S>>(basicStateReducer)
  }
  const initial =
    typeof initialState === 'function'
      ? (initialState as () => S)()
      : initialState
  const [state, dispatch] = mountStateImpl(initial)
  return [state as S, dispatch as Dispatch<SetStateAction<S>>]
}

// useReducer（篇 08）：update 队列与循环 dispatch；useState 是它的特例——
// reducer 换成 basicStateReducer 即可（两个入口共用上面同一套实现）
export const useReducer = <S, A>(
  reducer: (state: S, action: A) => S,
  initialArg: S,
  init?: (arg: S) => S
): [S, Dispatch<A>] => {
  if (isUpdatingHooks) {
    return updateReducerImpl<S, A>(reducer)
  }
  const initialState = init !== undefined ? init(initialArg) : initialArg
  const [state, dispatch] = mountStateImpl(initialState)
  return [state as S, dispatch as Dispatch<A>]
}

// ─── useRef（篇 06） ────────────────────────────────────────
// 跨渲染持久化的最小样本：ref 对象在 mount 时创建一次，
// update 克隆只复制引用——两次渲染拿到的是同一个对象
export const useRef = <T>(initialValue: T): { current: T } => {
  if (isUpdatingHooks) {
    const hook = updateWorkInProgressHook()
    return hook.memoizedState as { current: T }
  }
  const hook = mountWorkInProgressHook()
  const ref = { current: initialValue }
  hook.memoizedState = ref
  return ref
}

// ─── effect 系（篇 07） ─────────────────────────────────────
// effect 种类位：思路对齐真实源码 ReactFiberFlags 的 Passive/Layout，
// 数值简化（真实源码还有 HasEffect / Insertion 位）
export const EffectPassive = 0b0001
export const EffectLayout = 0b0010

// Effect 实例：同一个 hook 的 effect 对象跨渲染复用。真实源码把有状态的
// destroy 收在 inst（EffectInstance）字段里，教学版直接放 destroy 字段
export type Effect = {
  tag: number
  create: () => void | (() => void)
  destroy: (() => void) | null
  deps: unknown[] | null
  // 待执行标记：mount 恒为 true；update 时依赖变了才置 true
  shouldFire: boolean
}

type PendingEffect = {
  effect: Effect
}

// 两个待 flush 队列：layout 同步、passive 异步（commit 时由 collectFiberEffects 填充）
const pendingLayoutEffects: PendingEffect[] = []
const pendingPassiveEffects: PendingEffect[] = []

// 依赖浅比较：逐项 Object.is，长度不同直接不等（真实源码 areHookInputsEqual 同款）。
// nextDeps 为 null（没写依赖数组）视为永不相等——effect 每次渲染都执行
const areHookInputsEqual = (
  nextDeps: unknown[] | null,
  prevDeps: unknown[] | null
): boolean => {
  if (
    nextDeps === null ||
    prevDeps === null ||
    nextDeps.length !== prevDeps.length
  ) {
    return false
  }
  for (let i = 0; i < nextDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false
    }
  }
  return true
}

const mountEffectImpl = (
  tag: number,
  create: () => void | (() => void),
  deps: unknown[] | null
): void => {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = { tag, create, destroy: null, deps, shouldFire: true }
}

const updateEffectImpl = (
  create: () => void | (() => void),
  deps: unknown[] | null
): void => {
  const hook = updateWorkInProgressHook()
  const effect = hook.memoizedState as Effect
  if (areHookInputsEqual(deps, effect.deps)) {
    return
  }
  effect.create = create
  effect.deps = deps
  // destroy 还挂着上一次的清理函数——flush 时先跑它、再跑新 create
  effect.shouldFire = true
}

// effect 对象的判定依据：shouldFire 字段为 effect 独有
// （state 值 / ref / memo 缓存不会长这样——教学版约定）
const isEffect = (value: unknown): value is Effect => {
  return typeof value === 'object' && value !== null && 'shouldFire' in value
}

export const useEffect = (
  create: () => void | (() => void),
  deps?: unknown[]
): void => {
  const list = deps === undefined ? null : deps
  if (isUpdatingHooks) {
    updateEffectImpl(create, list)
    return
  }
  mountEffectImpl(EffectPassive, create, list)
}

export const useLayoutEffect = (
  create: () => void | (() => void),
  deps?: unknown[]
): void => {
  const list = deps === undefined ? null : deps
  if (isUpdatingHooks) {
    updateEffectImpl(create, list)
    return
  }
  mountEffectImpl(EffectLayout, create, list)
}

// commitMutation 遍历到函数组件 fiber 时调用：把待执行的 effect 分拣进
// layout / passive 两个队列（真实源码在 commit 阶段按 fiber flags 收集）
export const collectFiberEffects = (fiber: Fiber): void => {
  let hook = fiber.memoizedState as Hook | null
  while (hook !== null) {
    const effect = hook.memoizedState
    if (isEffect(effect) && effect.shouldFire) {
      const list =
        (effect.tag & EffectLayout) !== 0
          ? pendingLayoutEffects
          : pendingPassiveEffects
      list.push({ effect })
    }
    hook = hook.next
  }
}

// 两阶段 flush：先把整组 destroy 跑完（unmount 段），再跑 create（mount 段）。
// 真实源码 flushPassiveEffects 内部也是 commitPassiveUnmountEffects →
// commitPassiveMountEffects 的两段式顺序
const flushEffectList = (list: PendingEffect[]): void => {
  const effects = list.splice(0, list.length)
  if (effects.length === 0) {
    return
  }
  for (const { effect } of effects) {
    if (effect.destroy !== null) {
      effect.destroy()
      effect.destroy = null
    }
  }
  for (const { effect } of effects) {
    const cleanup = effect.create()
    effect.destroy = typeof cleanup === 'function' ? cleanup : null
    effect.shouldFire = false
  }
}

// layout flush：commitRoot 在双缓存交换后同步调用（DOM 已更新、浏览器未绘制）
export const flushLayoutEffects = (): void => {
  flushEffectList(pendingLayoutEffects)
}

// passive flush：真实 React 由 Scheduler 排到 commit 之后异步执行
// （ReactFiberWorkLoop.js 实核：scheduleCallback(NormalSchedulerPriority,
// flushPassiveEffects)）——篇 09 起挂到真调度器，可被高优先级任务插队
let passiveTask: Task | null = null
export const schedulePassiveEffects = (): void => {
  if (passiveTask !== null) {
    return
  }
  passiveTask = scheduleCallback(NormalPriority, () => {
    passiveTask = null
    flushEffectList(pendingPassiveEffects)
    return false
  })
}

// 删除子树的 unmount 清理：沿 fiber 向下走，函数组件的 effect 逐个跑 destroy。
// 真实 React 把 passive destroy 排进 passive flush 的 unmount 段、layout destroy
// 放在 mutation 阶段；教学版统一在删除时同步执行，语义一致
export const runUnmountEffects = (fiber: Fiber): void => {
  const walk = (node: Fiber): void => {
    if (node.tag === FunctionComponent) {
      let hook = node.memoizedState as Hook | null
      while (hook !== null) {
        const effect = hook.memoizedState
        if (isEffect(effect) && effect.destroy !== null) {
          effect.destroy()
          effect.destroy = null
          effect.shouldFire = false
        }
        hook = hook.next
      }
    }
    if (node.child !== null) {
      walk(node.child)
    }
    if (node.sibling !== null) {
      walk(node.sibling)
    }
  }
  walk(fiber)
}

// ─── memo 系（篇 08） ───────────────────────────────────────
// useMemo / useCallback 的缓存形态：[值, 依赖] 二元组挂在 hook.memoizedState
// 上，依赖不变直接复用旧值——本质是「带依赖的缓存 hook」
export const useMemo = <T>(factory: () => T, deps: unknown[]): T => {
  if (isUpdatingHooks) {
    const hook = updateWorkInProgressHook()
    const cache = hook.memoizedState as [T, unknown[]]
    if (areHookInputsEqual(deps, cache[1])) {
      return cache[0]
    }
    const value = factory()
    hook.memoizedState = [value, deps]
    return value
  }
  const hook = mountWorkInProgressHook()
  const value = factory()
  hook.memoizedState = [value, deps]
  return value
}

export const useCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  deps: unknown[]
): T => {
  if (isUpdatingHooks) {
    const hook = updateWorkInProgressHook()
    const cache = hook.memoizedState as [T, unknown[]]
    if (areHookInputsEqual(deps, cache[1])) {
      return cache[0]
    }
    hook.memoizedState = [callback, deps]
    return callback
  }
  const hook = mountWorkInProgressHook()
  hook.memoizedState = [callback, deps]
  return callback
}

// ─── Context（篇 08） ───────────────────────────────────────
// 简化版 propagateContextChange 的过期哨兵：memoizedValue 被置换成它即「待重渲」
const kStaleContextValue = Symbol('mini-react.stale-context')

// createContext：<Ctx.Provider value={…}> 编译产物的 type 就是 Provider 对象，
// Provider.context 反查 context 本体（与真实源码 createContext 同款形态）
export const createContext = <T>(defaultValue: T): Context<T> => {
  const provider = {} as ProviderType<T>
  const context: Context<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    defaultValue,
    currentValue: defaultValue,
    Provider: provider
  }
  provider.$$typeof = REACT_PROVIDER_TYPE
  provider.context = context
  return context
}

// useContext：读 context 的 fiber 在 dependencies 上登记依赖（数组版同构于
// 真实源码的单链表），memoizedValue 记住本次读到的值——
// memo 的放行检查与 propagateContextChange 都基于这条登记
export const useContext = <T>(context: Context<T>): T => {
  const fiber = currentlyRenderingFiber
  if (fiber !== null) {
    const deps = fiber.dependencies ?? []
    let dep: ContextDependency<unknown> | undefined
    for (const existing of deps) {
      if (existing.context === context) {
        dep = existing
        break
      }
    }
    if (dep === undefined) {
      deps.push({ context, memoizedValue: context.currentValue })
    } else {
      dep.memoizedValue = context.currentValue
    }
    fiber.dependencies = deps
  }
  return context.currentValue
}

// 简化版 propagateContextChange（对照 ReactFiberNewContext.js 的同名函数）：
// value 变更后从 Provider 的旧子树向下扫，把登记了该 context 的 fiber 的
// memoizedValue 置为过期——下游 memo 的放行检查因此失败、强制重渲。
// 真实 React（18 起 eager context propagation）用 lane 位在树上标记，
// 同为「树上标记」，不是 Vue 式的精确依赖收集
export const propagateContextChange = (
  start: Fiber | null,
  context: Context<unknown>
): void => {
  const walk = (fiber: Fiber): void => {
    const deps = fiber.dependencies
    if (deps !== null) {
      for (const dep of deps) {
        if (dep.context === context) {
          dep.memoizedValue = kStaleContextValue
        }
      }
    }
    if (fiber.child !== null) {
      walk(fiber.child)
    }
    if (fiber.sibling !== null) {
      walk(fiber.sibling)
    }
  }
  if (start !== null) {
    walk(start)
  }
}

// ─── 并发更新 Hooks（篇 10） ────────────────────────────────
// Transition 标记：callback 执行期间 dispatch 的更新都打到 transition lane。
// 真实源码 packages/react/src/ReactStartTransition.js 用 Transition 对象
// 传递 lane，教学版用模块级变量（嵌套 transition 后到者覆盖，教学范围外）
let currentTransitionLane: Lanes = NoLanes

export const startTransition = (callback: () => void): void => {
  currentTransitionLane = claimNextTransitionLane()
  try {
    callback()
  } finally {
    currentTransitionLane = NoLanes
  }
}

// useTransition：isPending 状态 + 低优先级标记。
// true 用同步 lane 上屏（立即显示 pending 态）；false 与业务更新同 lane，
// 随 transition 渲染一起生效——中断重放时 isPending 不会提前变 false
export const useTransition = (): [boolean, (callback: () => void) => void] => {
  const [isPending, setPending] = useState(false)
  const start = (callback: () => void): void => {
    setPending(true)
    startTransition(() => {
      callback()
      setPending(false)
    })
  }
  return [isPending, start]
}

// useDeferredValue 派生实现：值没追上时本渲染先返回旧值，
// 新值以 transition lane 补渲（真实源码同样返回旧值 + 低优先级重排）
export const useDeferredValue = <T>(value: T): T => {
  const [deferredValue, setValue] = useState(value)
  if (isUpdatingHooks && !Object.is(deferredValue, value)) {
    startTransition(() => {
      setValue(value)
    })
  }
  return deferredValue
}

// ─── 函数组件渲染入口（篇 06） ──────────────────────────────
// renderWithHooks：置位链表游标 → 按 current 链有无 hooks 选 mount/update
// 路径 → 调用组件函数取 children → 清场。真实源码同名函数（ReactFiberHooks.js）
export const renderWithHooks = (
  fiber: Fiber,
  Component: ComponentType,
  props: Props
): unknown => {
  currentlyRenderingFiber = fiber
  currentHook = null
  workInProgressHook = null
  const current = fiber.alternate
  isUpdatingHooks = current !== null && current.memoizedState !== null
  const children = Component(props)
  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  isUpdatingHooks = false
  return children
}

// ─── memo（篇 08） ──────────────────────────────────────────
// memo：组件级浅比较缓存壳。beginWork 按 $$typeof 识别它——props 未变且
// context 未变就 bailout（整棵复用旧子树），组件函数一次都不调用
export const memo = (Component: ComponentType): MemoType => {
  return { $$typeof: REACT_MEMO_TYPE, type: Component }
}
