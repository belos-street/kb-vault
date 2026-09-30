// lane 简化版：位掩码优先级档位
// 真实源码对照：packages/react-reconciler/src/ReactFiberLane.js
// （TotalLanes = 31 位；教学版 8 位、4 档——位越低优先级越高）
import type { PriorityLevel } from './index'
import { LowPriority, NormalPriority, UserBlockingPriority } from './index'

export const NoLanes = 0b00000000
export const SyncLane = 0b00000001
export const InputContinuousLane = 0b00000010
export const DefaultLane = 0b00000100
export const TransitionLane1 = 0b00001000
export const TransitionLane2 = 0b00010000
export const TransitionLanes = TransitionLane1 | TransitionLane2
// 重试档（篇 11）：Suspense resolve 后的重渲染走这里，可被更高优先级插队
export const RetryLane = 0b00100000

export type Lanes = number
export type Lane = number

// 判定 lanes 是否包含目标位（真实源码同名函数）
export const includesSomeLane = (a: Lanes, b: Lanes): boolean => {
  return (a & b) !== NoLanes
}

// 判定 subset 是否为 set 的子集——processUpdateQueue 消费更新时用它：
// NoLanes(0) 是任何集合的子集，所以「已消费」的更新重放时必被套用
export const isSubsetOfLanes = (set: Lanes, subset: Lanes): boolean => {
  return (set & subset) === subset
}

export const mergeLanes = (a: Lanes, b: Lanes): Lanes => {
  return a | b
}

export const removeLanes = (set: Lanes, subset: Lanes): Lanes => {
  return set & ~subset
}

// 取最高优先级的 lane：位值最小 = 优先级最高。真实源码同名函数经
// pickArbitraryLaneIndex / clz32 实现，教学版用位技巧 lanes & -lanes
export const getHighestPriorityLane = (lanes: Lanes): Lane => {
  return lanes & -lanes
}

// 对照 ReactFiberLane.js 的 getNextLanes：取根上待处理的最高优先级 lane。
// 真实版返回「同优先级组」的 lane 集合，教学版返回单个 lane
export const getNextLanes = (root: { pendingLanes: Lanes }): Lanes => {
  return getHighestPriorityLane(root.pendingLanes)
}

// Transition 档位轮转：并发 transition 各占一位（真实源码
// claimNextTransitionLane 在 TransitionLane1~10 间循环，教学版 2 位）
const transitionLanePool = [TransitionLane1, TransitionLane2]
let nextTransitionLaneIndex = 0
export const claimNextTransitionLane = (): Lane => {
  const lane = transitionLanePool[nextTransitionLaneIndex] ?? TransitionLane1
  nextTransitionLaneIndex =
    (nextTransitionLaneIndex + 1) % transitionLanePool.length
  return lane
}

// lane → 调度器优先级档位（真实源码 lanesToEventPriority 的教学化映射）
export const lanesToSchedulerPriority = (lanes: Lanes): PriorityLevel => {
  if (includesSomeLane(lanes, SyncLane | InputContinuousLane)) {
    return UserBlockingPriority
  }
  if (includesSomeLane(lanes, DefaultLane)) {
    return NormalPriority
  }
  // Transition / Retry：低优先级档——可中断渲染的主力
  return LowPriority
}
