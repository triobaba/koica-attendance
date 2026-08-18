import type { OfflineCheckIn } from '../types'

export const submitToGoogleSheet = async (payload: OfflineCheckIn): Promise<{ duplicate: boolean }> => {
  const response = await fetch('/api/mark-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await response.json()) as { ok?: boolean; duplicate?: boolean; error?: string }
  if (!response.ok || body.ok === false) {
    throw new Error(body.error ?? `Sheet write failed: ${response.status}`)
  }

  return { duplicate: Boolean(body.duplicate) }
}
