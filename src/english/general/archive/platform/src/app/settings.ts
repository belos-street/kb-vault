/**
 * 全局设置持久化（localStorage，同 progress.ts 的策略）+ React 订阅：
 * - voiceURI：英语朗读音色（speechSynthesis voice 的 voiceURI，空串 = 自动选择）
 * - rate：全局朗读语速（课文 / 拼写 / 听写统一生效）
 */
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'english-platform-settings-v1'

export interface Settings {
  voiceURI: string
  rate: number
}

export const DEFAULT_SETTINGS: Settings = { voiceURI: '', rate: 1 }

let cache: Settings | null = null
const listeners = new Set<() => void>()

function sanitize(raw: Partial<Settings>): Settings {
  return {
    voiceURI: typeof raw.voiceURI === 'string' ? raw.voiceURI : '',
    rate:
      typeof raw.rate === 'number' && raw.rate >= 0.5 && raw.rate <= 1.5
        ? raw.rate
        : DEFAULT_SETTINGS.rate
  }
}

function read(): Settings {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache =
      raw === null
        ? { ...DEFAULT_SETTINGS }
        : sanitize(JSON.parse(raw) as Partial<Settings>)
  } catch (err) {
    console.warn('settings:load failed', err)
    cache = { ...DEFAULT_SETTINGS }
  }
  return cache
}

function write(next: Settings): void {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('settings:save failed', err)
  }
  listeners.forEach((l) => l())
}

export function updateSettings(patch: Partial<Settings>): void {
  write({ ...read(), ...patch })
}

/** React 绑定：订阅全局设置变化（同页内即时生效） */
export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(read)
  useEffect(() => {
    const listener = () => setSettings(read())
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return settings
}
