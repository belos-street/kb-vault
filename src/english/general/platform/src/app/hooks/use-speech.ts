import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '../settings.ts'
import { useVoices } from './use-voices.ts'

export interface SpeakOptions {
  onend?: () => void
  onerror?: () => void
}

/**
 * Web Speech API 封装（浏览器内置能力，零依赖）。
 * 声音策略（requirements.md Q6）：设置里指定的音色优先，否则默认
 * Google US English → en-US Natural 网络声 → 任意 en-US → 任意 en；
 * 语速为全局设置（settings.ts）。
 */
export function useSpeech() {
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  )
  const voices = useVoices()
  const settings = useSettings()
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState(settings.rate)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const rateRef = useRef(settings.rate)
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

  // 音色选择：设置指定 voiceURI 优先；未指定或缺席时回退自动策略
  useEffect(() => {
    const en = voices.filter((v) => v.lang.replace('_', '-').startsWith('en'))
    const wanted = settings.voiceURI
      ? voices.find((v) => v.voiceURI === settings.voiceURI)
      : undefined
    // 默认首选 Chrome 内置的 Google US English（不匹配 Google UK English）
    const google = en.find((v) => /google us english/i.test(v.name))
    const natural = en.find(
      (v) => v.lang === 'en-US' && /natural/i.test(v.name)
    )
    const us = en.find((v) => v.lang === 'en-US')
    const picked = wanted ?? google ?? natural ?? us ?? en[0] ?? null
    voiceRef.current = picked
    setVoice(picked)
  }, [voices, settings.voiceURI])

  // 全局语速变化即时生效（下一条朗读起）
  useEffect(() => {
    rateRef.current = settings.rate
    setRate(settings.rate)
  }, [settings.rate])

  useEffect(() => {
    if (!supported) return
    return () => {
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
        // speak() 开头的 cancel() 会让被打断的旧 utterance 派发
        // interrupted/canceled —— 这是主动切换，不是真失败，忽略
        if (e.error === 'interrupted' || e.error === 'canceled') return
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

  return { supported, voice, rate, speak, stop }
}
