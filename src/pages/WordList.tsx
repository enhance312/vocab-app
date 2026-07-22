import { useState, useEffect } from 'react'
import { getAllWords, getWordsByList } from '../db/database'
import type { Word } from '../db/types'
import SpeakButton from '../components/SpeakButton'

const LIST_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1)

export default function WordList() {
  const [selectedList, setSelectedList] = useState<number | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [totalCounts, setTotalCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    (async () => {
      const all = await getAllWords()
      const counts: Record<number, number> = {}
      for (const w of all) {
        counts[w.listNumber] = (counts[w.listNumber] || 0) + 1
      }
      setTotalCounts(counts)
    })()
  }, [])

  useEffect(() => {
    if (selectedList === null) return
    (async () => {
      const listWords = await getWordsByList(selectedList)
      setWords(listWords)
    })()
  }, [selectedList])

  if (selectedList !== null) {
    return (
      <div className="flex flex-col gap-4 pt-4">
        <header className="flex items-center gap-3">
          <button onClick={() => setSelectedList(null)} className="text-[var(--color-text-secondary)] text-lg">←</button>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">List {selectedList}</h1>
          <span className="text-xs text-[var(--color-text-secondary)]">{words.length} 词</span>
        </header>

        <div className="space-y-2 scroll-optimized">
          {words.map(w => (
            <div key={w.id} className="bg-[var(--color-card-bg)] rounded-lg p-3 shadow-sm border border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-300 w-6">{w.indexInList}</span>
                <SpeakButton word={w.word} size="sm" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{w.word}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{w.phonetic}</span>
              </div>
              <p className="text-sm text-[var(--color-meaning)] mt-1 ml-14">{w.meaning}</p>
              {w.root && <p className="text-xs text-[var(--color-text-secondary)] mt-1 ml-14">词根: {w.root}</p>}
              {w.extensions && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 ml-14">拓展: {w.extensions}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <header>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">词表浏览</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">30 个 List，共约 2000 词</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {LIST_NUMBERS.map(n => (
          <button
            key={n}
            onClick={() => setSelectedList(n)}
            className="bg-[var(--color-card-bg)] rounded-xl p-4 text-center active:bg-stone-50 transition-colors shadow-sm border border-[var(--color-border)]"
          >
            <p className="text-lg font-bold text-[var(--color-text-primary)]">List {n}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{totalCounts[n] || '...'} 词</p>
          </button>
        ))}
      </div>
    </div>
  )
}
