import { useCallback, useEffect, useRef, useState } from 'react'

export interface SpeakOptions {
  onend?: () => void
  onerror?: () => void
}

/**
 * Web Speech API 封装（浏览器内置能力，零依赖）。
 * 声音策略（requirements.md Q6）：en-US Natural 网络声优先，自动回退任意 en 声。
 */
export function useSpeech(defaultRate = 1) {
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  )
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState(defaultRate)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const rateRef = useRef(defaultRate)
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

  useEffect(() => {
    if (!supported) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      const en = voices.filter((v) => v.lang.replace('_', '-').startsWith('en'))
      const natural = en.find(
        (v) => v.lang === 'en-US' && /natural/i.test(v.name)
      )
      const us = en.find((v) => v.lang === 'en-US')
      voiceRef.current = natural ?? us ?? en[0] ?? null
      setVoice(voiceRef.current)
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pick)
      clearTimers()
      window.speechSynthesis.cancel()
    }
  }, [supported, clearTimers])

  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      if (!supported) return
      window.speechSynthesis.cancel()
      clearTimers()
      const u = new SpeechSynthesisUtterance(text)
      const v = voiceRef.current
      if (v) u.voice = v
      u.lang = v?.lang ?? 'en-US'
      u.rate = rateRef.current
      let started = false
      u.onstart = () => {
        started = true
        if (startWatchdogRef.current !== null) {
          window.clearTimeout(startWatchdogRef.current)
          startWatchdogRef.current = null
        }
        // 移动端引擎可能在合成中自动进入 paused 且不再触发 onend，
        // 轮询 resume 保证逐句连播能推进。
        pausePollRef.current = window.setInterval(() => {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume()
        }, 250)
      }
      u.onend = () => {
        if (pausePollRef.current !== null) {
          window.clearInterval(pausePollRef.current)
          pausePollRef.current = null
        }
        opts?.onend?.()
      }
      u.onerror = (e) => {
        if (pausePollRef.current !== null) {
          window.clearInterval(pausePollRef.current)
          pausePollRef.current = null
        }
        console.warn('speech:error', e.error)
        opts?.onerror?.()
      }
      // Chrome 下 cancel 后立即 speak 偶发无声，延迟一帧更稳
      speakTimerRef.current = window.setTimeout(() => {
        window.speechSynthesis.speak(u)
        window.speechSynthesis.resume()
        // 部分移动端浏览器缺 TTS 引擎时 speak() 静默无事件（无 onstart/onend/onerror），
        // 看门狗兜底把这种"假播放"上报为错误，避免连播卡死。
        startWatchdogRef.current = window.setTimeout(() => {
          if (!started) {
            console.warn('speech:watchdog', 'utterance never started')
            window.speechSynthesis.cancel()
            opts?.onerror?.()
          }
        }, 4000)
      }, 60)
    },
    [supported, clearTimers]
  )

  const stop = useCallback(() => {
    if (!supported) return
    clearTimers()
    window.speechSynthesis.cancel()
  }, [supported, clearTimers])

  const updateRate = useCallback((r: number) => {
    rateRef.current = r
    setRate(r)
  }, [])

  return { supported, voice, rate, setRate: updateRate, speak, stop }
}
