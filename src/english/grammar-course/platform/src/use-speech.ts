import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API 封装（浏览器内置能力，零依赖）。
// 自 Lexio use-speech.ts 迁移适配，保留三处实战坑修复：
//   ① cancel() 后旧 utterance 派发 interrupted/canceled——主动切换不算失败，忽略；
//   ② 移动端引擎合成中自动 paused 且不再触发 onend——onstart 后轮询 resume 推进连播；
//   ③ 缺 TTS 引擎时 speak() 静默无事件——4s 看门狗兜底上报 onerror，防连播卡死。
// 音色链：本地女声（en-US 优先）→ 本地 en → en-US Natural 网络声 → 任意 en-US → 任意 en。
// Chrome 的 Google 系音色是网络音色（走 Google TTS 服务器，国内不可达会永不 start），
// 不作默认，与 use-speech.ts 移动端边界结论一致。
// 本平台无设置面板：语速固定 0.9（学习语速）。
const LOCAL_FEMALE_RE =
  /samantha|karen|moira|tessa|fiona|victoria|allison|ava|susan|serena|zira|hazel|zoe/i
const RATE = 0.9

export interface SpeakOptions {
  onend?: () => void
  onerror?: () => void
}

export interface Speech {
  supported: boolean
  /** 当前朗读对象 key（句 domId / 词卡 key），null = 未在朗读 */
  activeKey: string | null
  speak: (text: string, key?: string, opts?: SpeakOptions) => void
  stop: () => void
}

export function useSpeech(): Speech {
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  )
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const tokenRef = useRef(0)
  const speakTimerRef = useRef<number | null>(null)
  const startWatchdogRef = useRef<number | null>(null)
  const pausePollRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (speakTimerRef.current !== null) {
      window.clearTimeout(speakTimerRef.current)
      speakTimerRef.current = null
    }
    if (startWatchdogRef.current !== null) {
      window.clearTimeout(startWatchdogRef.current)
      startWatchdogRef.current = null
    }
    if (pausePollRef.current !== null) {
      window.clearInterval(pausePollRef.current)
      pausePollRef.current = null
    }
  }, [])

  // voiceschanged 兼容：Chrome 首次可能为空，异步补齐
  useEffect(() => {
    if (!supported) return
    const update = () => setVoices(window.speechSynthesis.getVoices())
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [supported])

  // 音色选择（见文件头音色链）
  useEffect(() => {
    const en = voices.filter((v) => v.lang.replace('_', '-').startsWith('en'))
    const local = en.filter((v) => v.localService)
    const picked =
      local.find((v) => v.lang === 'en-US' && LOCAL_FEMALE_RE.test(v.name)) ??
      local.find((v) => LOCAL_FEMALE_RE.test(v.name)) ??
      local.find((v) => v.lang === 'en-US') ??
      local[0] ??
      en.find((v) => v.lang === 'en-US' && /natural/i.test(v.name)) ??
      en.find((v) => v.lang === 'en-US') ??
      en[0] ??
      null
    voiceRef.current = picked
  }, [voices])

  useEffect(() => {
    if (!supported) return
    return () => {
      clearTimers()
      window.speechSynthesis.cancel()
    }
  }, [supported, clearTimers])

  const speak = useCallback(
    (text: string, key?: string, opts?: SpeakOptions) => {
      if (!supported) return
      tokenRef.current += 1
      const token = tokenRef.current
      window.speechSynthesis.cancel()
      clearTimers()
      setActiveKey(key ?? null)
      const u = new SpeechSynthesisUtterance(text)
      const v = voiceRef.current
      if (v !== null) u.voice = v
      u.lang = v?.lang ?? 'en-US'
      u.rate = RATE
      let started = false
      u.onstart = () => {
        started = true
        if (startWatchdogRef.current !== null) {
          window.clearTimeout(startWatchdogRef.current)
          startWatchdogRef.current = null
        }
        pausePollRef.current = window.setInterval(() => {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume()
        }, 250)
      }
      u.onend = () => {
        if (pausePollRef.current !== null) {
          window.clearInterval(pausePollRef.current)
          pausePollRef.current = null
        }
        if (token === tokenRef.current) setActiveKey(null)
        opts?.onend?.()
      }
      u.onerror = (e) => {
        if (pausePollRef.current !== null) {
          window.clearInterval(pausePollRef.current)
          pausePollRef.current = null
        }
        if (e.error === 'interrupted' || e.error === 'canceled') return
        if (token === tokenRef.current) setActiveKey(null)
        console.warn('speech:error', e.error)
        opts?.onerror?.()
      }
      // Chrome 下 cancel 后立即 speak 偶发无声，延迟一帧更稳
      speakTimerRef.current = window.setTimeout(() => {
        window.speechSynthesis.speak(u)
        window.speechSynthesis.resume()
        startWatchdogRef.current = window.setTimeout(() => {
          if (!started) {
            console.warn('speech:watchdog', 'utterance never started')
            window.speechSynthesis.cancel()
            if (token === tokenRef.current) setActiveKey(null)
            opts?.onerror?.()
          }
        }, 4000)
      }, 60)
    },
    [supported, clearTimers]
  )

  const stop = useCallback(() => {
    if (!supported) return
    tokenRef.current += 1
    clearTimers()
    window.speechSynthesis.cancel()
    setActiveKey(null)
  }, [supported, clearTimers])

  return { supported, activeKey, speak, stop }
}
