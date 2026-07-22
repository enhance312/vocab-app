import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getWordsByLists, saveRecord } from '../db/database'
import { useApp } from '../store/AppContext'
import type { Word, SessionType } from '../db/types'
import SpeakButton from '../components/SpeakButton'

type Phase = 'memorize' | 'quiz' | 'result'

const sessionLabels: Record<string, string> = {
  morning: '新单词',
  noon: '巩固新词',
  evening: '复习旧词',
}

export default function StudySession() {
  const { type } = useParams<{ type: SessionType }>()
  const navigate = useNavigate()
  const { tasks, completeSession } = useApp()

  const [phase, setPhase] = useState<Phase>('memorize')
  const [words, setWords] = useState<Word[]>([])
  const [shuffledWords, setShuffledWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<{ wordId: number; known: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  const task = tasks.find(t => t.type === type)
  const listNumbers = task?.listNumbers || []

  useEffect(() => {
    (async () => {
      if (listNumbers.length === 0) { setLoading(false); return }
      const all = await getWordsByLists(listNumbers)
      setWords(all)
      setShuffledWords([...all].sort(() => Math.random() - 0.5))
      setLoading(false)
    })()
  }, [listNumbers])

  const currentWord = useMemo(
    () => shuffledWords[currentIndex],
    [shuffledWords, currentIndex]
  )

  const handleKnown = useCallback(async (known: boolean) => {
    if (!currentWord) return
    const today = new Date().toISOString().slice(0, 10)
    await saveRecord({
      wordId: currentWord.id,
      studyDate: today,
      sessionType: type as SessionType,
      known,
    })
    setResults(prev => [...prev, { wordId: currentWord.id, known }])
    setRevealed(false)

    if (currentIndex + 1 < shuffledWords.length) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setPhase('result')
      await completeSession(type as SessionType)
    }
  }, [currentWord, currentIndex, shuffledWords.length, type, completeSession])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-text-secondary)] animate-pulse">加载单词...</p>
      </div>
    )
  }

  if (listNumbers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[var(--color-text-secondary)] text-lg">📭 暂无复习内容</p>
        <p className="text-[var(--color-text-secondary)] text-sm">完成前面的学习后，晚上才会有复习任务</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] active:bg-stone-50"
        >
          返回首页
        </button>
      </div>
    )
  }

  // === PHASE: Memorize ===
  if (phase === 'memorize') {
    return (
      <div className="flex flex-col min-h-full">
        <header className="flex items-center justify-between py-3">
          <button onClick={() => navigate('/')} className="text-[var(--color-text-secondary)] text-lg">←</button>
          <h2 className="font-bold text-[var(--color-text-primary)]">{sessionLabels[type || '']}</h2>
          <span className="text-xs text-[var(--color-text-secondary)]">记忆阶段</span>
        </header>

        <p className="text-xs text-[var(--color-text-secondary)] mb-3 text-center">
          浏览记忆以下 {words.length} 个单词，准备好后点击「开始检测」
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 scroll-optimized">
          {words.map(w => (
            <div key={w.id} className="bg-[var(--color-card-bg)] rounded-lg p-3 shadow-sm border border-[var(--color-border)] word-card">
              <div className="flex items-center gap-2">
                <SpeakButton word={w.word} size="sm" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{w.word}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{w.phonetic}</span>
              </div>
              <p className="text-sm text-[var(--color-meaning)] mt-1 ml-7">{w.meaning}</p>
              {w.root && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 ml-7">词根: {w.root}</p>
              )}
              {w.extensions && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 ml-7">拓展: {w.extensions}</p>
              )}
            </div>
          ))}
        </div>

        <div className="py-4 safe-area-bottom">
          <button
            onClick={() => setPhase('quiz')}
            className="w-full py-3 bg-[var(--color-accent)] text-white rounded-xl font-bold text-lg active:bg-[var(--color-accent-hover)] transition-colors shadow-sm"
          >
            开始检测
          </button>
        </div>
      </div>
    )
  }

  // === PHASE: Quiz ===
  if (phase === 'quiz' && currentWord) {
    return (
      <div className="flex flex-col min-h-full" onClick={() => !revealed && setRevealed(true)}>
        <div className="py-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] mb-2">
            <button onClick={() => navigate('/')} className="text-[var(--color-text-secondary)]">✕ 退出</button>
            <span>{currentIndex + 1} / {shuffledWords.length}</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-[var(--color-progress)] rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / shuffledWords.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
          <div className={`w-full bg-[var(--color-card-bg)] rounded-2xl p-8 text-center shadow-md border border-[var(--color-border)] transition-all duration-300 ${
            revealed ? 'border-[var(--color-accent)]/30' : ''
          }`}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <SpeakButton word={currentWord.word} size="lg" />
              <p className="text-3xl font-bold text-[var(--color-text-primary)] tracking-wide">
                {currentWord.word}
              </p>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{currentWord.phonetic}</p>

            {revealed && (
              <div className="animate-fadeIn border-t border-[var(--color-border)] pt-4 mt-2">
                <p className="text-lg text-[var(--color-meaning)] font-medium mb-2">
                  {currentWord.meaning}
                </p>
                {currentWord.root && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    📝 词根: {currentWord.root}
                  </p>
                )}
                {currentWord.extensions && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    📎 拓展: {currentWord.extensions}
                  </p>
                )}
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-4">点击屏幕查看释义</p>
            )}
          </div>
        </div>

        {revealed && (
          <div className="py-4 flex gap-3 safe-area-bottom animate-fadeIn">
            <button
              onClick={(e) => { e.stopPropagation(); handleKnown(false) }}
              className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-lg border border-red-200 active:bg-red-100"
            >
              不认识 ✗
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleKnown(true) }}
              className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-xl font-bold text-lg active:bg-[var(--color-accent-hover)] shadow-sm"
            >
              认识 ✓
            </button>
          </div>
        )}
      </div>
    )
  }

  // === PHASE: Result ===
  const correct = results.filter(r => r.known).length
  const total = results.length
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0
  const unknownWords = results
    .filter(r => !r.known)
    .map(r => words.find(w => w.id === r.wordId))
    .filter(Boolean) as Word[]

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-5xl mb-4">{rate >= 80 ? '🎉' : rate >= 60 ? '💪' : '📚'}</p>
        <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">完成！</p>
        <p className="text-lg text-[var(--color-text-secondary)] mb-1">
          正确率 <span className={`font-bold ${rate >= 80 ? 'text-[var(--color-success)]' : rate >= 60 ? 'text-[var(--color-accent)]' : 'text-red-500'}`}>
            {rate}%
          </span>
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">{correct} / {total}</p>

        {unknownWords.length > 0 && (
          <div className="mt-6 w-full max-h-56 overflow-y-auto space-y-1">
            <p className="text-xs text-[var(--color-text-secondary)] mb-2 text-center">
              不认识的词 ({unknownWords.length}个):
            </p>
            {unknownWords.map(w => (
              <div key={w.id} className="bg-[var(--color-card-bg)] rounded-lg px-3 py-2 text-left border border-[var(--color-border)]">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{w.word}</span>
                <span className="text-xs text-[var(--color-meaning)] ml-2">{w.meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="py-4 flex gap-3 safe-area-bottom">
        {unknownWords.length > 0 && (
          <button
            onClick={() => {
              setShuffledWords(unknownWords.sort(() => Math.random() - 0.5))
              setCurrentIndex(0)
              setRevealed(false)
              setResults([])
              setPhase('quiz')
            }}
            className="flex-1 py-3 bg-amber-50 text-[var(--color-accent)] rounded-xl font-bold border border-amber-200 active:bg-amber-100"
          >
            重测不认识 ({unknownWords.length})
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className={`${unknownWords.length > 0 ? 'flex-1' : 'w-full'} py-3 bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold active:bg-stone-50`}
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
