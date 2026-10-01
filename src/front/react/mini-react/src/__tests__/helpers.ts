// 测试基建：排空调度器
// mini-react 的渲染切片与 passive effects 都由宏任务（MessageChannel）驱动，
// Suspense 重试还会先排一层微任务——连续 10 轮 setTimeout(0) 把两层全部清空
export const flush = (): Promise<void> => {
  let remaining = 10
  return new Promise((resolve) => {
    const tick = (): void => {
      if (remaining === 0) {
        resolve()
        return
      }
      remaining -= 1
      setTimeout(tick, 0)
    }
    tick()
  })
}
