import { getActiveProgramme } from '../src/schedule.js'
import { callAppsScript, jsonResponse } from '../lib/apps-script.js'
import { serverEnv } from '../lib/env.js'

const defaultProgramPin = () => serverEnv('VITE_PROGRAM_PIN', '1234')
const staffPin = () => serverEnv('STAFF_PIN', serverEnv('VITE_STAFF_PIN', '5678'))
const enforceProgrammeWindow = () => serverEnv('VITE_ENFORCE_PROGRAMME_WINDOW', 'true') === 'true'

const scriptSupportsPins = (error?: string): boolean => {
  if (!error) return true
  return !error.startsWith('missing_') && error !== 'unauthorized'
}

// Apps Script costs 2-13s per call, so remember what the deployment can do and
// what it already told us instead of paying that round trip on every unlock.
const CAPABILITY_TTL_MS = 10 * 60 * 1000
const VERIFY_TTL_MS = 60 * 1000

let pinSupport: { supported: boolean; checkedAt: number } | null = null
const verifyCache = new Map<string, { granted: boolean; expiresAt: number }>()

const capabilityIsFresh = (): boolean =>
  pinSupport !== null && Date.now() - pinSupport.checkedAt < CAPABILITY_TTL_MS

const rememberCapability = (error?: string): void => {
  pinSupport = { supported: scriptSupportsPins(error), checkedAt: Date.now() }
}

const resetAccessCache = (): void => {
  verifyCache.clear()
  pinSupport = { supported: true, checkedAt: Date.now() }
}

const probeAppsScript = async (): Promise<void> => {
  // An empty PIN can never match a stored or default PIN, so this only
  // reveals whether the deployment understands verifyPin at all.
  const result = await callAppsScript({
    action: 'verifyPin',
    pin: '',
    sessionCode: '',
    defaultPin: defaultProgramPin(),
  })
  rememberCapability(result.error)
}

const resolveUnlock = async (pin: string, sessionCode: string): Promise<boolean> => {
  // A deployment without verifyPin can only ever be judged against the default
  // PIN locally, so skip the round trip whose answer we would discard anyway.
  if (capabilityIsFresh() && pinSupport?.supported === false) {
    return pin === defaultProgramPin()
  }

  const cacheKey = `${sessionCode}|${pin}`
  const cached = verifyCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.granted
  }

  const result = await callAppsScript({
    action: 'verifyPin',
    pin,
    sessionCode,
    defaultPin: defaultProgramPin(),
  })
  rememberCapability(result.error)

  const granted =
    result.ok === true || (!scriptSupportsPins(result.error) && pin === defaultProgramPin())
  verifyCache.set(cacheKey, { granted, expiresAt: Date.now() + VERIFY_TTL_MS })
  return granted
}

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string
    pin?: string
    staffPin?: string
    sessionCode?: string
    title?: string
  } | null

  if (!body?.action) {
    return jsonResponse({ error: 'action is required' }, 400)
  }

  try {
    if (body.action === 'warm') {
      if (!capabilityIsFresh()) {
        await probeAppsScript()
      }
      return jsonResponse({ ok: true })
    }

    if (body.action === 'unlock') {
      const live = getActiveProgramme()
      if (enforceProgrammeWindow() && !live) {
        return jsonResponse({ error: 'Check-in is closed. There is no live programme right now.' }, 403)
      }
      const sessionCode = live?.code ?? `${body.sessionCode ?? ''}`
      const pin = `${body.pin ?? ''}`
      if (!pin) {
        return jsonResponse({ error: 'PIN is required' }, 400)
      }

      const granted = await resolveUnlock(pin, sessionCode)
      if (granted) {
        return jsonResponse({ ok: true, sessionCode, sessionLabel: live?.title ?? '' })
      }
      return jsonResponse({ error: 'Incorrect program PIN.' }, 401)
    }

    if (body.action === 'listPins' || body.action === 'setPin') {
      if (`${body.staffPin ?? ''}` !== staffPin()) {
        return jsonResponse({ error: 'Incorrect staff PIN.' }, 401)
      }
    }

    if (body.action === 'listPins') {
      const result = await callAppsScript({ action: 'listPins' })
      if (result.ok) {
        return jsonResponse({ ok: true, pins: result.pins ?? [] })
      }
      if (!scriptSupportsPins(result.error)) {
        return jsonResponse({
          ok: true,
          pins: [],
          warning: 'Redeploy Apps Script from docs/apps-script-example.gs to store PINs in the sheet.',
        })
      }
      return jsonResponse({ error: result.error ?? 'Could not load PINs' }, 502)
    }

    if (body.action === 'setPin') {
      const sessionCode = `${body.sessionCode ?? ''}`.trim()
      const pin = `${body.pin ?? ''}`.trim()
      if (!sessionCode || pin.length < 4) {
        return jsonResponse({ error: 'Choose a programme and a PIN of at least 4 characters.' }, 400)
      }
      const result = await callAppsScript({
        action: 'setPin',
        sessionCode,
        pin,
        title: body.title ?? '',
      })
      if (result.ok) {
        resetAccessCache()
        return jsonResponse({ ok: true, pins: result.pins ?? [] })
      }
      if (!scriptSupportsPins(result.error)) {
        return jsonResponse(
          {
            error: 'PIN was not saved. Paste the latest docs/apps-script-example.gs into Apps Script and deploy a new version.',
          },
          502,
        )
      }
      return jsonResponse({ error: result.error ?? 'Could not save PIN' }, 502)
    }

    return jsonResponse({ error: 'Unknown action' }, 400)
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Check-in access failed' },
      502,
    )
  }
}

export default { fetch: handler }
