import { useEffect, useState } from 'react'

/**
 * 系统可用音色列表（voiceschanged 兼容：Chrome 首次可能为空，异步补齐）。
 * useSpeech 的音色选择与设置面板共用同一份数据源。
 */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const update = () => setVoices(window.speechSynthesis.getVoices())
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update)
    }
  }, [])
  return voices
}
