export type StoredPin = {
  sessionCode: string
  title: string
  pin: string
  updatedAt: string
}

const postAccess = async (payload: Record<string, unknown>): Promise<Response> => {
  return fetch('/api/checkin-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

const readError = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? `Request failed (${response.status})`
}

// Apps Script is slowest on its first hit, so pay that cost in the background
// while the attendee is still reading the screen.
export const warmCheckInAccess = (): void => {
  void postAccess({ action: 'warm' }).catch(() => {})
}

export const unlockCheckIn = async (pin: string): Promise<void> => {
  const response = await postAccess({ action: 'unlock', pin })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
}

export const listProgrammePins = async (staffPin: string): Promise<{ pins: StoredPin[]; warning?: string }> => {
  const response = await postAccess({ action: 'listPins', staffPin })
  const body = (await response.json().catch(() => null)) as {
    ok?: boolean
    pins?: StoredPin[]
    warning?: string
    error?: string
  } | null
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error ?? `Could not load PINs (${response.status})`)
  }
  return { pins: body?.pins ?? [], warning: body?.warning }
}

export const saveProgrammePin = async (input: {
  staffPin: string
  sessionCode: string
  pin: string
  title: string
}): Promise<StoredPin[]> => {
  const response = await postAccess({ action: 'setPin', ...input })
  const body = (await response.json().catch(() => null)) as {
    ok?: boolean
    pins?: StoredPin[]
    error?: string
  } | null
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error ?? `Could not save PIN (${response.status})`)
  }
  return body?.pins ?? []
}
