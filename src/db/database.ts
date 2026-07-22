import Dexie, { type EntityTable } from 'dexie'
import type { Word, UserProgress, StudyRecord } from './types'

export class VocabDatabase extends Dexie {
  words!: EntityTable<Word, 'id'>
  progress!: EntityTable<UserProgress, 'id'>
  records!: EntityTable<StudyRecord, 'id'>

  constructor() {
    super('vocab2000')

    this.version(1).stores({
      words: 'id, listNumber, indexInList',
      progress: 'id',
      records: '++id, wordId, studyDate, sessionType',
    })
  }
}

export const db = new VocabDatabase()

// Initialize progress if first launch
export async function initProgress(): Promise<UserProgress> {
  const existing = await db.progress.get(1)
  if (existing) return existing

  const today = new Date().toISOString().slice(0, 10)
  const initial: UserProgress = {
    id: 1,
    currentDay: 1,
    sessionStatus: { morning: false, noon: false, evening: false },
    completedDays: [],
    lastStudyDate: today,
  }
  await db.progress.put(initial)
  return initial
}

// Seed words from JSON
export async function seedWords(words: Word[]): Promise<void> {
  const count = await db.words.count()
  if (count > 0) return
  await db.words.bulkPut(words)
}

export async function getProgress(): Promise<UserProgress> {
  return (await db.progress.get(1))!
}

export async function updateProgress(update: Partial<UserProgress>): Promise<void> {
  await db.progress.update(1, update)
}

export async function getWord(id: number): Promise<Word | undefined> {
  return db.words.get(id)
}

export async function getWordsByList(listNumber: number): Promise<Word[]> {
  return db.words.where('listNumber').equals(listNumber).sortBy('indexInList')
}

export async function getWordsByLists(listNumbers: number[]): Promise<Word[]> {
  return db.words.where('listNumber').anyOf(listNumbers).sortBy('indexInList')
}

export async function getAllWords(): Promise<Word[]> {
  return db.words.orderBy('id').toArray()
}

export async function saveRecord(record: StudyRecord): Promise<void> {
  await db.records.put(record)
}

export async function getTodayRecords(date: string): Promise<StudyRecord[]> {
  return db.records.where('studyDate').equals(date).toArray()
}

export async function getRecordsForList(
  _listNumber: number,
  date: string,
  _sessionType: string
): Promise<StudyRecord[]> {
  return db.records.where('studyDate').equals(date).toArray()
}
