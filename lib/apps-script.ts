import { serverEnv } from './env.js'

export type AppsScriptResponse = {
  ok?: boolean
  duplicate?: boolean
  error?: string
  pins?: Array<{
    sessionCode: string
    title: string
    pin: string
    updatedAt: string
  }>
}

const looksLikeJson = (value: string): boolean => {
  const trimmed = value.trim()
  return trimmed.startsWith('{') || trimmed.startsWith('[')
}

const looksLikeHtml = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')
}

const htmlTitle = (html: string): string => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match?.[1]?.trim() ?? ''
}

const parseJsonObject = (value: string): AppsScriptResponse => {
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(value.slice(0, 400) || 'Apps Script returned an empty response')
  }
  return JSON.parse(value.slice(start, end + 1)) as AppsScriptResponse
}

const postToAppsScript = async (url: string, payload: unknown): Promise<string> => {
  const body = JSON.stringify(payload)
  const headers = {
    'Content-Type': 'text/plain;charset=utf-8',
    Accept: 'application/json,text/plain,*/*',
  }

  const followed = await fetch(url, {
    method: 'POST',
    headers,
    body,
    redirect: 'follow',
  })
  const followedText = await followed.text()
  if (looksLikeJson(followedText)) return followedText

  const manual = await fetch(url, {
    method: 'POST',
    headers,
    body,
    redirect: 'manual',
  })
  const location = manual.headers.get('location')
  if (location) {
    const redirected = await fetch(location, { method: 'GET', redirect: 'follow' })
    const redirectedText = await redirected.text()
    if (looksLikeJson(redirectedText)) return redirectedText
  }

  const separator = url.includes('?') ? '&' : '?'
  const getUrl = `${url}${separator}payload=${encodeURIComponent(body)}`
  const got = await fetch(getUrl, { method: 'GET', redirect: 'follow' })
  return got.text()
}

export const appsScriptHtmlError = (raw: string): string | null => {
  if (!looksLikeHtml(raw) && !raw.includes('Script function not found')) return null
  const title = htmlTitle(raw)
  if (raw.includes('doGet')) {
    return 'Apps Script is reachable, but Google is calling doGet and that function is not deployed yet. Paste the latest docs/apps-script-example.gs into Apps Script (keep your SECRET line), then Deploy → Manage deployments → Edit → New version → Deploy.'
  }
  if (title.toLowerCase() === 'page not found') {
    return 'The Apps Script Web app URL is invalid or from an old deployment. Copy the current Web app URL from Deploy → Manage deployments and update GOOGLE_APPS_SCRIPT_URL in .env.'
  }
  return 'Google returned an HTML page instead of JSON. Deploy the Web app with Execute as: Me and Who has access: Anyone, then use a new version.'
}

export const callAppsScript = async (payload: Record<string, unknown>): Promise<AppsScriptResponse> => {
  const appsScriptUrl = serverEnv('GOOGLE_APPS_SCRIPT_URL')
  if (!appsScriptUrl) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL is missing')
  }

  const raw = await postToAppsScript(appsScriptUrl, {
    ...payload,
    sharedSecret: serverEnv('GOOGLE_APPS_SCRIPT_SHARED_SECRET'),
  })
  const htmlError = appsScriptHtmlError(raw)
  if (htmlError) {
    throw new Error(htmlError)
  }
  return parseJsonObject(raw)
}

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
