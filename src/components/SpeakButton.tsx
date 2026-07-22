import { useCallback, useState } from 'react'

interface SpeakButtonProps {
  word: string
  size?: 'sm' | 'md' | 'lg'
}

// Web Speech API (offline-capable) as primary, Youdao TTS as network fallback
function speakWithWebSpeech(word: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis
    if (!synth) return reject(new Error('SpeechSynthesis not available'))

    const utter = new SpeechSynthesisUtterance(word)
    utter.lang = 'en-US'
    utter.rate = 0.9
    utter.pitch = 1

    // Try to pick a good English voice
    const voices = synth.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en-US') && v.localService)
      || voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utter.voice = enVoice

    utter.onend = () => resolve()
    utter.onerror = () => reject(new Error('SpeechSynthesis error'))

    synth.speak(utter)
  })
}

function getYoudaoUrl(word: string): string {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`
}

function speakWithAudioElement(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('Audio load error'))
    audio.play().catch(reject)
  })
}

export default function SpeakButton({ word, size = 'md' }: SpeakButtonProps) {
  const [playing, setPlaying] = useState(false)

  const sizeClasses = {
    sm: 'text-sm p-0.5',
    md: 'text-base p-1',
    lg: 'text-xl p-1.5',
  }

  const speak = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Cancel any ongoing speech
    window.speechSynthesis?.cancel()

    setPlaying(true)

    try {
      // Preload voices on first interaction
      if (window.speechSynthesis?.getVoices().length === 0) {
        await new Promise<void>(r => {
          window.speechSynthesis!.onvoiceschanged = () => r()
          // Fire in case it never fires
          setTimeout(r, 500)
        })
      }

      await speakWithWebSpeech(word)
    } catch {
      // Fallback: Youdao TTS (needs network)
      try {
        await speakWithAudioElement(getYoudaoUrl(word))
      } catch {
        // Both failed, silently ignore
      }
    } finally {
      setPlaying(false)
    }
  }, [word])

  return (
    <button
      onClick={speak}
      className={`inline-flex items-center justify-center rounded-full transition-colors active:scale-90 ${
        sizeClasses[size]
      } ${
        playing
          ? 'text-[var(--color-accent)] bg-amber-50'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-amber-50'
      }`}
      aria-label={`朗读 ${word}`}
      title="点击朗读"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}>
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
    </button>
  )
}
