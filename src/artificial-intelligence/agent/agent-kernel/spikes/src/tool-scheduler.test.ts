import { describe, expect, test } from 'bun:test'
import { scheduleTasks, type ScheduledTask } from './tool-scheduler'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('scheduleTasks', () => {
  test('overlaps consecutive safe tasks and serializes unsafe tasks', async () => {
    const events: string[] = []
    const tasks: ScheduledTask[] = [
      {
        safe: true,
        run: async () => {
          events.push('safe-1-start')
          await sleep(20)
          events.push('safe-1-end')
        },
      },
      {
        safe: true,
        run: async () => {
          events.push('safe-2-start')
          await sleep(20)
          events.push('safe-2-end')
        },
      },
      {
        safe: false,
        run: async () => {
          events.push('unsafe-start')
          await sleep(10)
          events.push('unsafe-end')
        },
      },
    ]

    await scheduleTasks(tasks)

    expect(events.slice(0, 2)).toEqual(['safe-1-start', 'safe-2-start'])
    expect(events.indexOf('unsafe-start')).toBeGreaterThan(
      events.indexOf('safe-1-end'),
    )
    expect(events.indexOf('unsafe-start')).toBeGreaterThan(
      events.indexOf('safe-2-end'),
    )
  })

  test('stops before an approval task and waits for in-flight work', async () => {
    const events: string[] = []
    const tasks: ScheduledTask[] = [
      {
        safe: true,
        run: async () => {
          events.push('safe-start')
          await sleep(20)
          events.push('safe-end')
        },
      },
      {
        safe: true,
        requiresApproval: true,
        run: async () => {
          events.push('approval')
        },
      },
      {
        safe: true,
        run: async () => {
          events.push('after-approval')
        },
      },
    ]

    const outcome = await scheduleTasks(tasks)

    expect(outcome.suspendedAt).toBe(1)
    expect(events).toEqual(['safe-start', 'safe-end'])
  })
})
