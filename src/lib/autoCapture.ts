export type AutoCaptureResult = 'stable' | 'timeout'

type AutoCaptureOptions = {
  signal?: AbortSignal
  maxWaitMs?: number
  sampleIntervalMs?: number
  stableFramesRequired?: number
  motionThreshold?: number
  sampleWidth?: number
  sampleHeight?: number
}

const defaultOptions: Required<Omit<AutoCaptureOptions, 'signal'>> = {
  maxWaitMs: 2500,
  sampleIntervalMs: 150,
  stableFramesRequired: 4,
  motionThreshold: 11,
  sampleWidth: 48,
  sampleHeight: 32,
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const toLuma = (imageData: ImageData): Float32Array => {
  const pixels = imageData.data
  const luma = new Float32Array(imageData.width * imageData.height)
  for (let i = 0, p = 0; i < luma.length; i += 1, p += 4) {
    luma[i] = pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114
  }
  return luma
}

const meanAbsoluteDiff = (a: Float32Array, b: Float32Array): number => {
  const len = Math.min(a.length, b.length)
  if (len === 0) return Number.POSITIVE_INFINITY
  let sum = 0
  for (let i = 0; i < len; i += 1) {
    sum += Math.abs(a[i] - b[i])
  }
  return sum / len
}

export const waitForStableFrame = async (
  video: HTMLVideoElement,
  options?: AutoCaptureOptions,
): Promise<AutoCaptureResult> => {
  const cfg = { ...defaultOptions, ...options }
  const canvas = document.createElement('canvas')
  canvas.width = cfg.sampleWidth
  canvas.height = cfg.sampleHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return 'timeout'

  let previous: Float32Array | null = null
  let stableFrames = 0
  const startedAt = Date.now()

  while (Date.now() - startedAt < cfg.maxWaitMs) {
    if (options?.signal?.aborted) {
      const aborted = new Error('capture aborted')
      aborted.name = 'AbortError'
      throw aborted
    }

    if (video.videoWidth < 16 || video.videoHeight < 16) {
      await sleep(cfg.sampleIntervalMs)
      continue
    }

    const sourceW = video.videoWidth
    const sourceH = video.videoHeight
    const cropW = Math.max(16, Math.floor(sourceW * 0.34))
    const cropH = Math.max(16, Math.floor(sourceH * 0.24))
    const cropX = Math.floor((sourceW - cropW) / 2)
    const cropY = Math.floor((sourceH - cropH) / 2)

    context.drawImage(
      video,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cfg.sampleWidth,
      cfg.sampleHeight,
    )
    const current = toLuma(context.getImageData(0, 0, cfg.sampleWidth, cfg.sampleHeight))
    if (!previous) {
      previous = current
      stableFrames = 1
      await sleep(cfg.sampleIntervalMs)
      continue
    }

    const motion = meanAbsoluteDiff(previous, current)
    previous = current
    if (motion <= cfg.motionThreshold) {
      stableFrames += 1
      if (stableFrames >= cfg.stableFramesRequired) {
        return 'stable'
      }
    } else {
      stableFrames = 0
    }

    await sleep(cfg.sampleIntervalMs)
  }

  return 'timeout'
}
