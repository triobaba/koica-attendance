import { getActiveProgramme } from '../src/schedule.js'
import { callAppsScript, jsonResponse } from '../lib/apps-script.js'
import { serverEnv } from '../lib/env.js'

type MarkAttendancePayload = {
  programId: string
  fullName: string
  country: string
  attendanceDate: string
  sessionCode: string
  sessionLabel: string
  programmeWindow?: string
  source: 'vision' | 'manual'
  editedBeforeConfirm: boolean
  latitude?: number | null
  longitude?: number | null
  accuracyMeters?: number | null
  mapsUrl?: string
  locationStatus?: string
}

const enforceProgrammeWindow = () => serverEnv('VITE_ENFORCE_PROGRAMME_WINDOW', 'true') === 'true'

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const payload = (await request.json()) as MarkAttendancePayload
  if (enforceProgrammeWindow()) {
    const live = getActiveProgramme()
    if (!live || live.code !== payload.sessionCode) {
      return jsonResponse({ error: 'Check-in is closed. There is no live programme right now.' }, 403)
    }
  }

  try {
    const parsed = await callAppsScript({
      ...payload,
      action: 'mark',
      checkedInAt: new Date().toISOString(),
    })
    if (parsed.ok === false) {
      if (parsed.error === 'busy_retry') {
        return jsonResponse(
          { error: 'Attendance service is busy. Retrying automatically.' },
          503,
          { 'Retry-After': '3' },
        )
      }
      const status = parsed.error === 'unauthorized' ? 401 : 502
      return jsonResponse({ error: parsed.error ?? 'Apps Script rejected the write' }, status)
    }

    return jsonResponse({ ok: true, duplicate: Boolean(parsed.duplicate) })
  } catch (error) {
    return jsonResponse(
      {
        error: 'Apps Script write failed',
        details: error instanceof Error ? error.message : String(error),
      },
      502,
    )
  }
}

export default { fetch: handler }
