// 最小调度器：task queue（最小堆按过期时间排序）+ MessageChannel 宏任务循环
// + shouldYield 时间片检查 + 过期任务强制执行（饿死保护）
// 真实源码对照：packages/scheduler/src/forks/Scheduler.js
// 教学版省略：timerQueue（delay 延迟任务）/ continuation 返回值 /
// runWithPriority / requestPaint / profiling 钩子

// 优先级档位（数值与 SchedulerPriorities.js 对齐，教学版取用到的子集）
export const ImmediatePriority = 1
export const UserBlockingPriority = 2
export const NormalPriority = 3
export const LowPriority = 4

export type PriorityLevel =
  | typeof ImmediatePriority
  | typeof UserBlockingPriority
  | typeof NormalPriority
  | typeof LowPriority

// 各档位的超时时间：过期后调度器不再让出（饿死保护）。
// 真实源码在 SchedulerFeatureFlags.js 里按档位配置 timeout
const priorityTimeout: Record<PriorityLevel, number> = {
  [ImmediatePriority]: -1,
  [UserBlockingPriority]: 250,
  [NormalPriority]: 5000,
  [LowPriority]: 10000
}

// 时间片长度（真实源码 frameYieldMs，Scheduler 每片让出前最多占这么久）
const frameInterval = 5

export type Task = {
  id: number
  // 返回 true 表示任务未完成，调度器让出后下一片继续调用；
  // 真实源码返回 continuation 回调（等价语义，教学版收敛为布尔值）
  callback: ((didTimeout: boolean) => boolean) | null
  priorityLevel: PriorityLevel
  // 过期时刻 = 入队时刻 + 档位超时：到期后任务强制执行、不再让出
  expirationTime: number
  // 最小堆排序键。教学版立即执行的任务与 expirationTime 相同
  // （真实源码延迟任务按 startTime 排序进 timerQueue，教学版省略）
  sortIndex: number
}

const getCurrentTime = (): number => performance.now()

// ─── task queue：最小堆（SchedulerMinHeap.js 同构，按 sortIndex 排序） ───
const taskQueue: Task[] = []

const push = (task: Task): void => {
  taskQueue.push(task)
  let index = taskQueue.length - 1
  while (index > 0) {
    const parentIndex = (index - 1) >> 1
    const parent = taskQueue[parentIndex]
    if (parent === undefined || parent.sortIndex <= task.sortIndex) {
      break
    }
    taskQueue[index] = parent
    index = parentIndex
  }
  taskQueue[index] = task
}

const pop = (): Task | null => {
  const first = taskQueue[0]
  const last = taskQueue.pop()
  if (first === undefined || first === last) {
    // 空堆，或弹出的就是唯一元素
    return first ?? null
  }
  if (last !== undefined) {
    // 尾元素补到堆顶，向下换位
    taskQueue[0] = last
    let index = 0
    for (;;) {
      const leftIndex = index * 2 + 1
      const left = taskQueue[leftIndex]
      if (left === undefined) {
        break
      }
      const rightIndex = leftIndex + 1
      const right = taskQueue[rightIndex]
      const smaller = right !== undefined && right.sortIndex < left.sortIndex
      const smallerIndex = smaller ? rightIndex : leftIndex
      const smallerTask = smaller ? right : left
      if (
        smallerTask === undefined ||
        last.sortIndex <= smallerTask.sortIndex
      ) {
        break
      }
      taskQueue[index] = smallerTask
      index = smallerIndex
    }
    taskQueue[index] = last
  }
  return first
}

const peek = (): Task | null => {
  return taskQueue[0] ?? null
}

// ─── 调度器工作循环：饿死保护与让出判定 ──────────────────────
let taskIdCounter = 1
let isMessageLoopRunning = false
// 本片起点：shouldYield 以它测量已占用时长
let startTime = -1

// shouldYield：时间片检查。真实源码 shouldYieldToHost（导出名为
// unstable_shouldYield），ReactFiberWorkLoop 内的本地 shouldYield 即它
export const shouldYield = (): boolean => {
  return getCurrentTime() - startTime >= frameInterval
}

// 调度器工作循环（真实源码同名函数）。核心判定与真实源码逐字对应：
// `expirationTime > currentTime && shouldYield()` —— 任务已过期就不再让出，
// 一口气跑完（饿死保护：低优先级任务排队过久后强制立即执行）
const workLoop = (currentTime: number): boolean => {
  let currentTask = peek()
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYield()) {
      // 时间片耗尽且任务未过期：让出主线程，下一片继续
      break
    }
    const callback = currentTask.callback
    if (typeof callback === 'function') {
      const didTimeout = currentTask.expirationTime <= currentTime
      const hasMoreWork = callback(didTimeout)
      if (hasMoreWork) {
        // 任务未完成：保留队列原位，让出主线程排下一片
        break
      }
      currentTask.callback = null
    }
    pop()
    currentTask = peek()
  }
  return currentTask !== null
}

const performWorkUntilDeadline = (): void => {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime()
    startTime = currentTime
    let hasMoreWork = true
    try {
      hasMoreWork = workLoop(currentTime)
    } finally {
      if (hasMoreWork) {
        // 还有余活：把下一片排到当前宏任务之后（真实源码同款收尾）
        schedulePerformWorkUntilDeadline()
      } else {
        isMessageLoopRunning = false
      }
    }
  }
}

// MessageChannel 宏任务优先：嵌套 setTimeout(0) 五层后被浏览器钳到 4ms，
// 消息任务没有这个节流，切片间隙更顺滑（真实源码同款选择，注释原话
// "We prefer MessageChannel because of the 4ms setTimeout clamping"）
const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = performWorkUntilDeadline

const schedulePerformWorkUntilDeadline = (): void => {
  port.postMessage(null)
}

const requestHostCallback = (): void => {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true
    schedulePerformWorkUntilDeadline()
  }
}

// unstable_scheduleCallback 的教学版：入队 + 排宏任务，返回任务句柄
export const scheduleCallback = (
  priorityLevel: PriorityLevel,
  callback: (didTimeout: boolean) => boolean
): Task => {
  const currentTime = getCurrentTime()
  const task: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    expirationTime: currentTime + priorityTimeout[priorityLevel],
    sortIndex: currentTime + priorityTimeout[priorityLevel]
  }
  push(task)
  requestHostCallback()
  return task
}

// unstable_cancelCallback 同款：置空回调（堆无法随机删除，执行时跳过）
export const cancelCallback = (task: Task): void => {
  task.callback = null
}
