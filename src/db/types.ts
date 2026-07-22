export interface Word {
  id: number
  listNumber: number
  indexInList: number
  word: string
  phonetic: string
  meaning: string
  root: string
  extensions: string
  notes: string
}

export type SessionType = 'morning' | 'noon' | 'evening'

export interface SessionStatus {
  morning: boolean
  noon: boolean
  evening: boolean
}

export interface UserProgress {
  id: number
  currentDay: number
  sessionStatus: SessionStatus
  completedDays: number[]
  lastStudyDate: string
}

export interface StudyRecord {
  id?: number
  wordId: number
  studyDate: string
  sessionType: SessionType
  known: boolean
}

export interface TodayTask {
  type: SessionType
  label: string
  listNumbers: number[]
  completed: boolean
}
