import { useCallback, useEffect, useRef, useState } from 'react'

export interface SpeakOptions {
  onend?: () => void
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
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      if (!supported) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      const v = voiceRef.current
      if (v) u.voice = v
      u.lang = v?.lang ?? 'en-US'
      u.rate = rateRef.current
      u.onend = () => opts?.onend?.()
      // Chrome 下 cancel 后立即 speak 偶发无声，延迟一帧更稳
      window.setTimeout(() => window.speechSynthesis.speak(u), 60)
    },
    [supported]
  )

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  const updateRate = useCallback((r: number) => {
    rateRef.current = r
    setRate(r)
  }, [])

  return { supported, voice, rate, setRate: updateRate, speak, stop }
}
