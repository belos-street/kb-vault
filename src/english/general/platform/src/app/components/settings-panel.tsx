import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useVoices } from '../hooks/use-voices.ts'
import { useSpeech } from '../hooks/use-speech.ts'
import { updateSettings, useSettings } from '../settings.ts'

/**
 * 全局设置面板：朗读音色（换人）+ 全局语速。
 * 修改即写 localStorage（settings.ts），全站（课文/单词/默写/听写）即时生效。
 */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useSettings()
  const voices = useVoices()
  const { supported, speak } = useSpeech()
  const [previewing, setPreviewing] = useState(false)

  const enVoices = voices
    .filter((v) => v.lang.replace('_', '-').startsWith('en'))
    .sort((a, b) => {
      const us = Number(b.lang === 'en-US') - Number(a.lang === 'en-US')
      return us !== 0 ? us : a.name.localeCompare(b.name)
    })

  const preview = () => {
    speak('Hello! This is my digital butler.', {
      onend: () => setPreviewing(false),
      onerror: () => setPreviewing(false)
    })
    setPreviewing(true)
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <section className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>设置</h2>
        {!supported && (
          <p className="hint">当前浏览器不支持语音合成，音色与语速不可用。</p>
        )}
        <label className="field">
          <span>朗读音色（英语）</span>
          <select
            value={settings.voiceURI}
            disabled={!supported}
            onChange={(e) => updateSettings({ voiceURI: e.target.value })}>
            <option value="">自动（优先 Natural 声）</option>
            {enVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}（{v.lang}）
              </option>
            ))}
          </select>
          <span className="field-tip">
            未列出音色？部分浏览器首次加载时音色列表为空，重试或重启浏览器后会出现。
          </span>
        </label>
        <label className="field">
          <span>朗读语速（全局）</span>
          <span className="field-row">
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={settings.rate}
              disabled={!supported}
              onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
            />
            <output>{settings.rate.toFixed(1)}x</output>
          </span>
        </label>
        <div className="controls">
          <button
            className="btn"
            onClick={preview}
            disabled={!supported || previewing}>
            <Volume2 size={15} /> 试听
          </button>
          <button className="btn primary" onClick={onClose}>
            完成
          </button>
        </div>
      </section>
    </div>
  )
}
