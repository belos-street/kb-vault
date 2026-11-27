import { expect, test } from 'bun:test'
import { pickBestVoice, sortEnglishVoices } from './voice.ts'

function voice(name: string, lang: string, localService = true) {
  return {
    name,
    lang,
    voiceURI: name,
    localService
  } as unknown as SpeechSynthesisVoice
}

const voices = [
  voice('Microsoft David - English (United States)', 'en-US'),
  voice('Microsoft Zira - English (United States)', 'en-US'),
  voice('Google US English', 'en-US', false),
  voice(
    'Microsoft Aria Online (Natural) - English (United States)',
    'en-US',
    false
  ),
  voice('Microsoft Hortense - French (France)', 'fr-FR')
]

test('优先自然女声，并过滤非英语', () => {
  const sorted = sortEnglishVoices(voices)
  expect(sorted[0]?.name).toContain('Aria')
  expect(sorted.some((item) => item.lang.startsWith('fr'))).toBe(false)
})

test('男声排在女声后面', () => {
  const sorted = sortEnglishVoices(voices)
  const david = sorted.findIndex((item) => item.name.includes('David'))
  const zira = sorted.findIndex((item) => item.name.includes('Zira'))
  expect(david).toBeGreaterThan(zira)
})

test('没有英语音色时返回 undefined', () => {
  expect(pickBestVoice([])).toBeUndefined()
})
