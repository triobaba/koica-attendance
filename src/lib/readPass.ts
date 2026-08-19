import type { PassRead } from '../types'
import { isValidProgramId, normalizeProgramId } from './programId'

type ReadPassResponse = {
  pass: PassRead
  rawText: string
}

export class PassReadRateLimitError extends Error {
  retryAfterMs: number

  constructor(retryAfterMs: number) {
    super('Vision service is busy. Retrying automatically.')
    this.name = 'PassReadRateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

const retryAfterMs = (response: Response): number => {
  const value = response.headers.get('retry-after')
  if (!value) return 2_000

  const seconds = Number(value)
  if (Number.isFinite(seconds)) {
    return Math.max(1_000, Math.min(seconds * 1_000, 30_000))
  }

  const dateMs = Date.parse(value)
  if (Number.isNaN(dateMs)) return 2_000
  return Math.max(1_000, Math.min(dateMs - Date.now(), 30_000))
}

export const readPassFromImage = async (
  imageBase64: string,
  options?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<ReadPassResponse> => {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? 5000
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onParentAbort = () => controller.abort()
  options?.signal?.addEventListener('abort', onParentAbort, { once: true })

  try {
    const response = await fetch('/api/read-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    })

    if (response.status === 429) {
      throw new PassReadRateLimitError(retryAfterMs(response))
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string; details?: string } | null
      const detail = typeof body?.details === 'string' ? body.details : ''
      const modelMessage = detail.match(/"message":\s*"([^"]+)"/)?.[1]
      throw new Error(modelMessage ?? body?.error ?? `Vision API failed with status ${response.status}`)
    }

    const body = (await response.json()) as ReadPassResponse
    const normalized = normalizeProgramId(body.pass.programId)

    const fullName = body.pass.fullName.trim()
    const country = body.pass.country.trim()
    if (!isValidProgramId(normalized) || !fullName || !country) {
      throw new Error('NO_ID')
    }

    return {
      ...body,
      pass: {
        ...body.pass,
        programId: normalized,
        fullName,
        country,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('NO_ID')
    }
    throw error
  } finally {
    clearTimeout(timer)
    options?.signal?.removeEventListener('abort', onParentAbort)
  }
}
