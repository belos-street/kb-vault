// Spike：concurrencySafe 分组调度原型。
// 连续 safe 任务并发；unsafe 任务单独串行；遇 requiresApproval 停止调度。

export interface ScheduledTask {
  safe: boolean
  requiresApproval?: boolean
  run: () => Promise<void>
}

export async function scheduleTasks(
  tasks: ScheduledTask[],
): Promise<{ suspendedAt?: number }> {
  let index = 0

  while (index < tasks.length) {
    const task = tasks[index]
    if (task === undefined) return {}

    if (task.requiresApproval === true) {
      return { suspendedAt: index }
    }

    if (!task.safe) {
      await task.run()
      index += 1
      continue
    }

    const group: ScheduledTask[] = []
    while (index < tasks.length) {
      const current = tasks[index]
      if (
        current === undefined ||
        !current.safe ||
        current.requiresApproval === true
      ) {
        break
      }
      group.push(current)
      index += 1
    }

    await Promise.all(group.map((item) => item.run()))
  }

  return {}
}
