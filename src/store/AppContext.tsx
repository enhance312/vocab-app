import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { initProgress, seedWords, getProgress, updateProgress } from '../db/database'
import type { UserProgress, SessionType, Word, TodayTask } from '../db/types'
import { getTodayTasks } from '../engine/schedule'

interface AppState {
  progress: UserProgress | null
  tasks: TodayTask[]
  loading: boolean
  completeSession: (type: SessionType) => Promise<void>
  resetDay: () => Promise<void>
  jumpToDay: (day: number) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const p = await getProgress()
    setProgress(p)
    if (p) {
      const tasks = getTodayTasks(p.currentDay, p.sessionStatus)
      return { p, tasks }
    }
    return null
  }, [])

  const [tasks, setTasks] = useState<TodayTask[]>([])

  useEffect(() => {
    (async () => {
      // Initialize
      await initProgress()

      // Seed words from JSON
      try {
        const wordsModule = await import('../data/words.json')
        const words = wordsModule.default as Word[]
        await seedWords(words)
      } catch {
        console.warn('Word data not loaded')
      }

      const result = await refresh()
      if (result) {
        setTasks(result.tasks)
      }
      setLoading(false)
    })()
  }, [refresh])

  const completeSession = useCallback(async (type: SessionType) => {
    if (!progress) return
    const updated = { ...progress }
    updated.sessionStatus = { ...progress.sessionStatus, [type]: true }

    // Check if day is complete
    const { morning, noon, evening } = updated.sessionStatus
    if (morning && noon && evening) {
      if (!updated.completedDays.includes(updated.currentDay)) {
        updated.completedDays = [...updated.completedDays, updated.currentDay]
      }
      // Advance to next day if all done
      if (updated.currentDay < 30) {
        updated.currentDay = updated.currentDay + 1
        updated.sessionStatus = { morning: false, noon: false, evening: false }
        updated.lastStudyDate = new Date().toISOString().slice(0, 10)
      }
    }

    await updateProgress(updated)
    setProgress(updated)
    setTasks(getTodayTasks(updated.currentDay, updated.sessionStatus))
  }, [progress])

  const resetDay = useCallback(async () => {
    if (!progress) return
    const updated = { ...progress, sessionStatus: { morning: false, noon: false, evening: false } }
    await updateProgress(updated)
    setProgress(updated)
    setTasks(getTodayTasks(updated.currentDay, updated.sessionStatus))
  }, [progress])

  const jumpToDay = useCallback(async (day: number) => {
    const updated: UserProgress = {
      id: 1,
      currentDay: day,
      sessionStatus: { morning: false, noon: false, evening: false },
      completedDays: [],
      lastStudyDate: new Date().toISOString().slice(0, 10),
    }
    await updateProgress(updated)
    setProgress(updated)
    setTasks(getTodayTasks(day, updated.sessionStatus))
  }, [])

  return (
    <AppContext.Provider value={{ progress, tasks, loading, completeSession, resetDay, jumpToDay }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
