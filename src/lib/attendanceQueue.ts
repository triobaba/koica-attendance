import type { OfflineCheckIn } from '../types'

const QUEUE_KEY = 'kylp-offline-queue'
const BASE_RETRY_MS = 2_000
const MAX_RETRY_MS = 60_000

export type AttendanceQueueItem = OfflineCheckIn & {
  id: string
  attempts: number
  nextAttemptAt: number
  lastError?: string
}

const normalizeItem = (
  item: OfflineCheckIn & Partial<AttendanceQueueItem> & { id?: string | number },
): AttendanceQueueItem => ({
  ...item,
  id: String(item.id ?? `${Date.now()}-${Math.random()}`),
  attempts: Number(item.attempts ?? 0),
  nextAttemptAt: Number(item.nextAttemptAt ?? 0),
})

export const listQueuedAttendance = (): AttendanceQueueItem[] => {
  const raw = window.localStorage.getItem(QUEUE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<
      OfflineCheckIn & Partial<AttendanceQueueItem> & { id?: string | number }
    >
    return Array.isArray(parsed) ? parsed.map(normalizeItem) : []
  } catch {
    return []
  }
}

const saveQueuedAttendance = (items: AttendanceQueueItem[]): void => {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export const enqueueAttendance = (
  payload: OfflineCheckIn,
): { added: boolean; count: number } => {
  const queued = listQueuedAttendance()
  const duplicate = queued.some(
    (item) => item.programId === payload.programId && item.sessionCode === payload.sessionCode,
  )
  if (duplicate) {
    return { added: false, count: queued.length }
  }

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  const next: AttendanceQueueItem = {
    ...payload,
    id,
    attempts: 0,
    nextAttemptAt: Date.now(),
  }
  const updated = [...queued, next]
  saveQueuedAttendance(updated)
  return { added: true, count: updated.length }
}

let activeFlush: Promise<QueueFlushResult> | null = null

export type QueueFlushResult = {
  remaining: number
  synced: number
  failed: number
  nextRetryAt: number | null
}

export const flushAttendanceQueue = (
  submit: (payload: OfflineCheckIn) => Promise<unknown>,
): Promise<QueueFlushResult> => {
  if (activeFlush) return activeFlush

  activeFlush = (async () => {
    const now = Date.now()
    const snapshot = listQueuedAttendance()
    const due = snapshot.filter((item) => item.nextAttemptAt <= now)
    const outcomes = new Map<string, AttendanceQueueItem | null>()
    let synced = 0
    let failed = 0

    // Keep sheet writes sequential so this device never competes with itself
    // for the Apps Script lock.
    for (const item of due) {
      try {
        await submit(item)
        outcomes.set(item.id, null)
        synced += 1
      } catch (error) {
        const attempts = item.attempts + 1
        const retryMs = Math.min(BASE_RETRY_MS * 2 ** Math.min(attempts - 1, 5), MAX_RETRY_MS)
        outcomes.set(item.id, {
          ...item,
          attempts,
          nextAttemptAt: Date.now() + retryMs,
          lastError: error instanceof Error ? error.message : String(error),
        })
        failed += 1
      }
    }

    // Merge into the latest copy so a check-in added while this flush was
    // running cannot be overwritten or lost.
    const current = listQueuedAttendance()
    const updated = current.flatMap((item) => {
      if (!outcomes.has(item.id)) return [item]
      const outcome = outcomes.get(item.id)
      return outcome ? [outcome] : []
    })
    saveQueuedAttendance(updated)

    const nextRetryAt =
      updated.length > 0 ? Math.min(...updated.map((item) => item.nextAttemptAt)) : null
    return { remaining: updated.length, synced, failed, nextRetryAt }
  })().finally(() => {
    activeFlush = null
  })

  return activeFlush
}
