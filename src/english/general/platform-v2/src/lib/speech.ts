import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getStoredVoiceURI,
  pickBestVoice,
  setPreferredVoiceURI,
  sortEnglishVoices,
  writeVoiceURI
} from './voice.ts'

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState(() => getStoredVoiceURI())
  const cancelled = useRef(false)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const loadVoices = useCallback(() => {
    if (!supported) return
    const list = window.speechSynthesis.getVoices()
    setVoices(list)

    const stored = getStoredVoiceURI()
    if (stored && list.some((voice) => voice.voiceURI === stored)) {
      setVoiceURI(stored)
      return
    }

    const best = pickBestVoice(list)
    if (best) {
      setVoiceURI(best.voiceURI)
      writeVoiceURI(best.voiceURI)
    }
  }, [supported])

  useEffect(() => {
    if (!supported) return
    loadVoices()

    const onVoices = () => loadVoices()
    const onVoiceChange = () => {
      const next = getStoredVoiceURI()
      if (next) setVoiceURI(next)
    }

    window.speechSynthesis.addEventListener('voiceschanged', onVoices)
    window.addEventListener('lexio:voice-change', onVoiceChange)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      window.removeEventListener('lexio:voice-change', onVoiceChange)
    }
  }, [loadVoices, supported])

  const selectedVoice =
    voices.find((voice) => voice.voiceURI === voiceURI) ?? pickBestVoice(voices)

  const chooseVoice = useCallback((uri: string) => {
    setVoiceURI(uri)
    setPreferredVoiceURI(uri)
  }, [])

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
        utterance.lang = selectedVoice?.lang ?? 'en-US'
        if (selectedVoice) utterance.voice = selectedVoice
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
    [selectedVoice, supported]
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

  return {
    supported,
    speaking,
    currentIndex,
    playAll,
    speakOne,
    stop,
    voices: sortEnglishVoices(voices),
    voiceURI: selectedVoice?.voiceURI ?? voiceURI,
    setVoice: chooseVoice
  }
}
