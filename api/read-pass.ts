import { serverEnv } from '../lib/env.js'

type ParsedPass = {
  programId: string
  fullName: string
  country: string
  confidence: number
}

type GeminiOptions = {
  model: string
  jsonMode: boolean
  thinkingLevel?: 'minimal' | 'low'
  mediaResolution?: 'MEDIA_RESOLUTION_LOW'
}

const defaultResponse: ParsedPass = {
  programId: '',
  fullName: '',
  country: '',
  confidence: 0,
}

const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.0-flash']
const GEMINI_TIMEOUT_MS = 4600
const REQUEST_DEADLINE_MS = 4800

let cachedOptions: GeminiOptions | null = null

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

const callGemini = async (
  apiKey: string,
  imageBase64: string,
  prompt: string,
  options: GeminiOptions,
  timeoutMs: number,
): Promise<Response> => {
  const generationConfig: Record<string, unknown> = {
    temperature: 0,
    maxOutputTokens: 96,
  }
  if (options.jsonMode) {
    generationConfig.responseMimeType = 'application/json'
  }
  if (options.thinkingLevel) {
    generationConfig.thinkingConfig = { thinkingLevel: options.thinkingLevel }
  }
  if (options.mediaResolution) {
    generationConfig.mediaResolution = options.mediaResolution
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig,
        }),
      },
    )
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

const optionAttempts = (requestedModel: string): GeminiOptions[] => {
  const models = [requestedModel, ...FALLBACK_MODELS.filter((model) => model !== requestedModel)]
  return models.flatMap((model) => [
    { model, jsonMode: true, thinkingLevel: 'minimal' },
    { model, jsonMode: true },
  ])
}

const jsonError = (error: string, details?: string, status = 502): Response =>
  new Response(JSON.stringify({ error, details }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed', undefined, 405)
  }

  const apiKey = serverEnv('GEMINI_API_KEY')
  if (!apiKey) {
    return jsonError('GEMINI_API_KEY is missing', undefined, 500)
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

  const requestedModel = serverEnv('GEMINI_MODEL', 'gemini-3.1-flash-lite')
  const prompt =
    'Read this KOICA Youth Leaders pass. Return JSON only: {"programId":"KYLP000","fullName":"","country":"","confidence":0}. programId must match KYLP plus digits or be empty. Do not guess an ID.'

  const attempts = cachedOptions ? [cachedOptions] : optionAttempts(requestedModel)
  const deadline = Date.now() + REQUEST_DEADLINE_MS
  let geminiResponse: Response | null = null
  let lastDetails = ''
  let usedOptions: GeminiOptions | null = null

  for (const options of attempts) {
    const remaining = deadline - Date.now()
    if (remaining < 250) break
    try {
      const response = await callGemini(
        apiKey,
        imageBase64,
        prompt,
        options,
        Math.min(GEMINI_TIMEOUT_MS, remaining),
      )
      if (response.ok) {
        geminiResponse = response
        usedOptions = options
        cachedOptions = options
        break
      }
      lastDetails = await response.text()
      cachedOptions = null
      if (response.status === 404) {
        continue
      }
      if (response.status !== 400) {
        return jsonError('Vision model request failed', lastDetails)
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError'
      lastDetails = aborted
        ? 'Vision timed out'
        : error instanceof Error
          ? error.message
          : String(error)
      cachedOptions = null
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

  if (!geminiResponse?.ok || !usedOptions) {
    return jsonError('Vision model request failed', lastDetails || 'No vision model accepted the request')
  }

  const geminiBody = (await geminiResponse.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const rawText = geminiBody.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const parsed = parseJsonObject(rawText)

  return new Response(JSON.stringify({ pass: parsed, rawText }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default { fetch: handler }
