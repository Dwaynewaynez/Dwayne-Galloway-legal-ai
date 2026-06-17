import { useState, useCallback, useRef, useEffect } from 'react'

interface TTSState {
  isSpeaking: boolean
  isPaused: boolean
  currentText: string
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
}

export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    voices: [],
    selectedVoice: null,
  })
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices()
      const englishVoices = available.filter((v) => v.lang.startsWith('en'))
      setState((prev) => ({
        ...prev,
        voices: englishVoices.length > 0 ? englishVoices : available,
        selectedVoice: englishVoices[0] || available[0] || null,
      }))
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!text.trim()) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = state.selectedVoice
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setState((prev) => ({ ...prev, isSpeaking: true, isPaused: false, currentText: text }))
      }

      utterance.onend = () => {
        setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false, currentText: '' }))
      }

      utterance.onerror = () => {
        setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }))
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [state.selectedVoice]
  )

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false, currentText: '' }))
  }, [])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setState((prev) => ({ ...prev, isPaused: true }))
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setState((prev) => ({ ...prev, isPaused: false }))
  }, [])

  const selectVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setState((prev) => ({ ...prev, selectedVoice: voice }))
  }, [])

  return {
    ...state,
    speak,
    stop,
    pause,
    resume,
    selectVoice,
  }
}
