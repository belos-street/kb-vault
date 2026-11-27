const VOICE_KEY = 'lexio-v2:voice'

const femaleHints = [
  'aria',
  'jenny',
  'zira',
  'samantha',
  'michelle',
  'ana',
  'ava',
  'emma',
  'olivia',
  'sophia',
  'lily',
  'libby',
  'sonia',
  'natasha',
  'hazel',
  'susan',
  'female',
  'google us english',
  'google uk english female'
]

const maleHints = [
  'david',
  'mark',
  'guy',
  'ryan',
  'alex',
  'daniel',
  'fred',
  'george',
  'james',
  'eric',
  'tom',
  'oliver',
  'thomas',
  'male'
]

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()
  const lang = voice.lang.toLowerCase()
  if (!lang.startsWith('en')) return -1000

  let score = 0
  if (lang.startsWith('en-us')) score += 30
  else if (lang.startsWith('en-gb')) score += 10

  if (name.includes('natural') || name.includes('online')) score += 50
  if (name.includes('google')) score += 20
  if (femaleHints.some((hint) => name.includes(hint))) score += 40
  if (maleHints.some((hint) => name.includes(hint))) score -= 100
  if (voice.localService) score += 5

  return score
}

export function sortEnglishVoices(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice[] {
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith('en'))
    .sort((left, right) => {
      const diff = scoreVoice(right) - scoreVoice(left)
      return diff !== 0 ? diff : left.name.localeCompare(right.name)
    })
}

export function pickBestVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  return sortEnglishVoices(voices)[0]
}

export function getStoredVoiceURI(): string {
  try {
    return localStorage.getItem(VOICE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** 自动挑选默认音色时只写存储，不广播，避免多个 useSpeech 实例互相触发。 */
export function writeVoiceURI(uri: string): void {
  try {
    localStorage.setItem(VOICE_KEY, uri)
  } catch {
    // 音色偏好不是关键数据，存不下就只在本次会话生效。
  }
}

/** 用户手动选择时同时广播，让同页其他朗读组件立即换声。 */
export function setPreferredVoiceURI(uri: string): void {
  writeVoiceURI(uri)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lexio:voice-change'))
  }
}
