import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const cancelled = useRef(false)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stop = useCallback(() => {
    cancelled.current = true
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
    setCurrentIndex(null)
  }, [supported])

  const speakOne = useCallback(
    (text: string, index: number, rate: number) =>
      new Promise<void>((resolve) => {
        if (!supported || text.trim().length === 0) {
          resolve()
          return
        }
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = rate
        utterance.onend = () => {
          setCurrentIndex(null)
          resolve()
        }
        utterance.onerror = () => {
          setCurrentIndex(null)
          resolve()
        }
        setCurrentIndex(index)
        window.speechSynthesis.speak(utterance)
      }),
    [supported]
  )

  const playAll = useCallback(
    async (texts: string[], rate: number) => {
      if (!supported) return
      cancelled.current = false
      window.speechSynthesis.cancel()
      setSpeaking(true)
      for (let index = 0; index < texts.length; index += 1) {
        if (cancelled.current) break
        const text = texts[index]
        if (!text) continue
        // eslint-disable-next-line no-await-in-loop -- 逐句顺序朗读，不能并行
        await speakOne(text, index, rate)
      }
      setSpeaking(false)
      setCurrentIndex(null)
    },
    [speakOne, supported]
  )

  useEffect(
    () => () => {
      if (supported) window.speechSynthesis.cancel()
    },
    [supported]
  )

  return { supported, speaking, currentIndex, playAll, speakOne, stop }
}
