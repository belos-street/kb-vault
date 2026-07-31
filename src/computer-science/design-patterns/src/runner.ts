import { transform } from 'sucrase'

export interface RunResult {
  logs: Array<{ type: 'log' | 'error' | 'success'; text: string }>
}

export async function runCode(code: string): Promise<RunResult> {
  const logs: RunResult['logs'] = []

  // 转译 TypeScript → JavaScript
  let js: string
  try {
    js = transform(code, {
      transforms: ['typescript'],
      disableESTransforms: true
    }).code
  } catch (e) {
    logs.push({ type: 'error', text: `[编译错误] ${(e as Error).message}` })
    return { logs }
  }

  // 沙箱 console
  const sandboxConsole = {
    log: (...args: unknown[]) => {
      logs.push({ type: 'log', text: args.map(formatValue).join(' ') })
    },
    error: (...args: unknown[]) => {
      logs.push({ type: 'error', text: args.map(formatValue).join(' ') })
    },
    warn: (...args: unknown[]) => {
      logs.push({ type: 'log', text: `⚠️ ${args.map(formatValue).join(' ')}` })
    },
    info: (...args: unknown[]) => {
      logs.push({ type: 'log', text: args.map(formatValue).join(' ') })
    },
    assert: (condition: unknown, ...args: unknown[]) => {
      if (!condition) {
        logs.push({
          type: 'error',
          text: `Assertion failed: ${args.map(formatValue).join(' ')}`
        })
      }
    }
  }

  // 用 AsyncFunction 执行，天然支持 async/await 和顶层 Promise
  const AsyncFunction = Object.getPrototypeOf(
    async function () {}
  ).constructor as FunctionConstructor
  try {
    const fn = new AsyncFunction(
      'console',
      'structuredClone',
      `"use strict";\n${js}`
    )
    await fn(sandboxConsole, structuredClone)
    logs.push({ type: 'success', text: '✓ 执行完成' })
  } catch (e) {
    logs.push({ type: 'error', text: `[运行时错误] ${(e as Error).message}` })
  }

  return { logs }
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
