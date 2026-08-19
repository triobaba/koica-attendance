import { serverEnv } from '../lib/env.js'

type ParsedPass = {
  programId: string
  fullName: string
  country: string
  confidence: number
}

const defaultResponse: ParsedPass = {
  programId: '',
  fullName: '',
  country: '',
  confidence: 0,
}

const FALLBACK_MODELS = ['claude-haiku-4-5', 'claude-haiku-4-5-20251001', 'claude-3-5-haiku-latest']
const CLAUDE_TIMEOUT_MS = 4600
const REQUEST_DEADLINE_MS = 4800

let cachedModel: string | null = null

const parseJsonObject = (value: string): ParsedPass => {
  const withoutFence = value.replace(/```json|```/gi, '').trim()
  const start = withoutFence.indexOf('{')
  const end = withoutFence.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return defaultResponse
  }
  try {
    const parsed = JSON.parse(withoutFence.slice(start, end + 1)) as Partial<ParsedPass>
    return {
      programId: `${parsed.programId ?? ''}`.trim(),
      fullName: `${parsed.fullName ?? ''}`.trim(),
      country: `${parsed.country ?? ''}`.trim(),
      confidence: Number(parsed.confidence ?? 0),
    }
  } catch {
    return defaultResponse
  }
}

const modelAttempts = (requestedModel: string): string[] => {
  const models = [requestedModel, ...FALLBACK_MODELS.filter((model) => model !== requestedModel)]
  return cachedModel ? [cachedModel, ...models.filter((model) => model !== cachedModel)] : models
}

const callClaude = async (
  apiKey: string,
  imageBase64: string,
  prompt: string,
  model: string,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_tokens: 96,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })
  } catch (error) {
    if (controller.signal.aborted) {
      const timeout = new Error('Vision timed out')
      timeout.name = 'AbortError'
      throw timeout
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

const jsonError = (
  error: string,
  details?: string,
  status = 502,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify({ error, details }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed', undefined, 405)
  }

  const apiKey = serverEnv('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return jsonError('ANTHROPIC_API_KEY is missing', undefined, 500)
  }

  let imageBase64 = ''
  try {
    const body = (await request.json()) as { imageBase64?: string }
    const rawImage = `${body.imageBase64 ?? ''}`.replace(/\s/g, '')
    imageBase64 = rawImage.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
  } catch (error) {
    return jsonError('Invalid JSON body', error instanceof Error ? error.message : String(error), 400)
  }
  if (!imageBase64) {
    return jsonError('imageBase64 is required', undefined, 400)
  }

  const requestedModel = serverEnv('CLAUDE_MODEL', 'claude-haiku-4-5')
  const prompt =
    'Read this KOICA Youth Leaders pass. Return JSON only: {"programId":"KYLP000","fullName":"","country":"","confidence":0}. programId must match KYLP plus digits or be empty. Do not guess an ID.'

  const deadline = Date.now() + REQUEST_DEADLINE_MS
  let claudeResponse: Response | null = null
  let lastDetails = ''
  let usedModel: string | null = null

  for (const model of modelAttempts(requestedModel)) {
    const remaining = deadline - Date.now()
    if (remaining < 250) break
    try {
      const response = await callClaude(
        apiKey,
        imageBase64,
        prompt,
        model,
        Math.min(CLAUDE_TIMEOUT_MS, remaining),
      )
      if (response.ok) {
        claudeResponse = response
        usedModel = model
        cachedModel = model
        break
      }
      lastDetails = await response.text()
      cachedModel = null
      if (response.status === 404) {
        continue
      }
      if (response.status === 429 || response.status === 529) {
        const retryAfter = response.headers.get('retry-after') ?? '2'
        return jsonError(
          'Vision service is busy. Retrying automatically.',
          lastDetails,
          429,
          { 'Retry-After': retryAfter },
        )
      }
      return jsonError('Vision model request failed', lastDetails)
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError'
      lastDetails = aborted
        ? 'Vision timed out'
        : error instanceof Error
          ? error.message
          : String(error)
      cachedModel = null
      if (aborted) {
        return new Response(JSON.stringify({ pass: defaultResponse, rawText: '' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined
      return jsonError('Vision model request failed', cause ? `${lastDetails}: ${cause}` : lastDetails)
    }
  }

  if (!claudeResponse?.ok || !usedModel) {
    return jsonError('Vision model request failed', lastDetails || 'No vision model accepted the request')
  }

  const claudeBody = (await claudeResponse.json()) as {
    content?: Array<{ type?: string; text?: string }>
  }
  const rawText = claudeBody.content?.find((part) => part.type === 'text')?.text ?? ''
  const parsed = parseJsonObject(rawText)

  return new Response(JSON.stringify({ pass: parsed, rawText }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default { fetch: handler }
