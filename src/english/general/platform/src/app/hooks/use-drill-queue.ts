import { useEffect, useRef, useState } from 'react'
import { PROGRESS_MODES, progressStore } from '../progress.ts'
import { shuffle } from '../utils/text.ts'

export interface DrillResult {
  key: string
  correct: boolean
}

export type DrillMode = (typeof PROGRESS_MODES)[keyof typeof PROGRESS_MODES]

export interface DrillQueueOptions<T> {
  lessonId: string
  mode: DrillMode
  items: T[]
  keyOf: (item: T) => string
}

/**
 * 三练习模式（单词 / 听写 / 默写）共享的队列状态机：
 * - 挂载时按 localStorage 已通过项过滤（已通过不再出题）
 * - pass / fail 记账：每个条目只记首次对错；pass 同步写入进度
 * - 强制全对推进：只有 pass() 后 next() 才会前进
 */
export function useDrillQueue<T>(opts: DrillQueueOptions<T>) {
  const { lessonId, mode, items, keyOf } = opts
  const total = items.length
  const [queue, setQueue] = useState<T[]>(() => {
    const passed = progressStore.passedSet(lessonId, mode)
    return shuffle(items.filter((i) => !passed.has(keyOf(i))))
  })
  const [pos, setPos] = useState(0)
  const [isPassed, setIsPassed] = useState(false)
  const [results, setResults] = useState<DrillResult[]>([])
  const [phase, setPhase] = useState<'drill' | 'summary'>(
    queue.length === 0 ? 'summary' : 'drill'
  )
  const countedRef = useRef(false)

  const current = queue[pos]

  const record = (correct: boolean) => {
    if (!current || countedRef.current) return
    setResults((r) => [...r, { key: keyOf(current), correct }])
    countedRef.current = true
  }

  const pass = () => {
    if (!current || isPassed) return
    setIsPassed(true)
    record(true)
    progressStore.markPassed(lessonId, mode, keyOf(current))
  }

  const fail = () => {
    if (!current || isPassed) return
    setIsPassed(false)
    record(false)
  }

  const next = () => {
    if (!isPassed) return
    setIsPassed(false)
    countedRef.current = false
    if (pos + 1 < queue.length) setPos(pos + 1)
    else setPhase('summary')
  }

  const restart = (list: T[]) => {
    setQueue(shuffle(list))
    setPos(0)
    setIsPassed(false)
    setResults([])
    setPhase('drill')
    countedRef.current = false
  }

  const passedCount = progressStore.passedSet(lessonId, mode).size

  return {
    queue,
    pos,
    current,
    total,
    isPassed,
    results,
    phase,
    passedCount,
    pass,
    fail,
    next,
    restart
  }
}

/**
 * 答对后的自动推进：绿色通过态停留 delay 毫秒后自动 goNext()
 * （下一条 / 汇总页），期间点绿色按钮可提前走。输入态清理由调用方的 goNext 负责。
 */
export function useAutoAdvance(
  isPassed: boolean,
  goNext: () => void,
  delay = 1000
) {
  const goNextRef = useRef(goNext)
  useEffect(() => {
    goNextRef.current = goNext
  })
  useEffect(() => {
    if (!isPassed) return
    const timer = window.setTimeout(() => goNextRef.current(), delay)
    return () => window.clearTimeout(timer)
  }, [isPassed, delay])
}
