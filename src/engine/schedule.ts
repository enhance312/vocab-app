import type { TodayTask, SessionStatus } from '../db/types'

// Review intervals: 1 day, 2 days, 4 days, 7 days before current day
const REVIEW_OFFSETS = [1, 2, 4, 7]

/**
 * For day N, returns:
 * - newList: List N (the new list to learn)
 * - reviewLists: Lists at offsets [N-1, N-2, N-4, N-7] that are > 0
 */
export function getSchedule(day: number): { newList: number; reviewLists: number[] } {
  const reviewLists = REVIEW_OFFSETS
    .map(offset => day - offset)
    .filter(n => n > 0)

  return {
    newList: day,
    reviewLists,
  }
}

/**
 * Returns today's tasks based on current day and session completion status.
 */
export function getTodayTasks(
  currentDay: number,
  sessionStatus: SessionStatus
): TodayTask[] {
  const { reviewLists } = getSchedule(currentDay)

  const tasks: TodayTask[] = [
    {
      type: 'morning',
      label: '早上 · 新单词',
      listNumbers: [currentDay],
      completed: sessionStatus.morning,
    },
    {
      type: 'noon',
      label: '中午 · 巩固新词',
      listNumbers: [currentDay],
      completed: sessionStatus.noon,
    },
    {
      type: 'evening',
      label: '晚上 · 复习旧词',
      listNumbers: reviewLists,
      completed: sessionStatus.evening,
    },
  ]

  return tasks
}

/**
 * Check if today is a new day — if so, advance the day counter.
 */
export function checkDayAdvance(
  currentDay: number,
  sessionStatus: SessionStatus,
  lastStudyDate: string
): { currentDay: number; sessionStatus: SessionStatus; lastStudyDate: string } | null {
  const today = new Date().toISOString().slice(0, 10)
  if (today === lastStudyDate) return null

  // If all three sessions were completed, advance to next day
  if (sessionStatus.morning && sessionStatus.noon && sessionStatus.evening) {
    return {
      currentDay: Math.min(currentDay + 1, 30),
      sessionStatus: { morning: false, noon: false, evening: false },
      lastStudyDate: today,
    }
  }

  // Otherwise just reset today's date
  return { currentDay, sessionStatus: { morning: false, noon: false, evening: false }, lastStudyDate: today }
}
