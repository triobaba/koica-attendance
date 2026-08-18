import { getActiveProgramme } from '../src/schedule.js'
import { callAppsScript, jsonResponse } from '../lib/apps-script.js'
import { serverEnv } from '../lib/env.js'

// #region agent log
fetch('http://127.0.0.1:7340/ingest/5d4c122e-e010-454f-b4af-74372fe873f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1c2be'},body:JSON.stringify({sessionId:'e1c2be',runId:'post-fix',hypothesisId:'H2',location:'api/checkin-access.ts:1',message:'checkin-access module loaded, schedule import resolved',data:{hasGetActiveProgramme:typeof getActiveProgramme==='function',hasCallAppsScript:typeof callAppsScript==='function'},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const defaultProgramPin = () => serverEnv('VITE_PROGRAM_PIN', '1234')
const staffPin = () => serverEnv('STAFF_PIN', serverEnv('VITE_STAFF_PIN', '5678'))
const enforceProgrammeWindow = () => serverEnv('VITE_ENFORCE_PROGRAMME_WINDOW', 'true') === 'true'

const scriptSupportsPins = (error?: string): boolean => {
  if (!error) return true
  return !error.startsWith('missing_') && error !== 'unauthorized'
}

async function handler(request: Request): Promise<Response> {
  // #region agent log
  fetch('http://127.0.0.1:7340/ingest/5d4c122e-e010-454f-b4af-74372fe873f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1c2be'},body:JSON.stringify({sessionId:'e1c2be',runId:'post-fix-h3',hypothesisId:'H3',location:'api/checkin-access.ts:handler',message:'handler invoked, checking request shape',data:{method:(request as {method?:string}).method??null,jsonType:typeof (request as {json?:unknown}).json,isWebRequest:typeof Request!=='undefined'&&request instanceof Request},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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

      const result = await callAppsScript({
        action: 'verifyPin',
        pin,
        sessionCode,
        defaultPin: defaultProgramPin(),
      })
      if (result.ok) {
        return jsonResponse({ ok: true, sessionCode, sessionLabel: live?.title ?? '' })
      }
      if (!scriptSupportsPins(result.error) && pin === defaultProgramPin()) {
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
