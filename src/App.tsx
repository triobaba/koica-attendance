import { useEffect, useMemo, useRef, useState } from 'react'
import { StaffPanel } from './StaffPanel'
import { config } from './config'
import {
  enqueueAttendance,
  flushAttendanceQueue,
  listQueuedAttendance,
} from './lib/attendanceQueue'
import { unlockCheckIn, warmCheckInAccess } from './lib/checkinAccess'
import { getCheckInLocation } from './lib/geolocation'
import { isValidProgramId, normalizeProgramId } from './lib/programId'
import { PassReadRateLimitError, readPassFromImage } from './lib/readPass'
import { submitToGoogleSheet } from './lib/sheetAttendance'
import { formatProgrammeWindow, getCheckInProgramme, getNextProgramme } from './schedule'
import type { OfflineCheckIn } from './types'

type ScannedPass = {
  programId: string
  fullName: string
  country: string
}

type FlowOutcome = {
  kind: 'success' | 'duplicate' | 'queued' | 'error'
  title: string
  detail: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const CHECKED_IN_KEY = 'kylp-checked-in'

// Passes already marked present, grouped by programme, so a pass that is still
// in front of the camera cannot be submitted twice for the same session.
const readCheckedIn = (): Record<string, string[]> => {
  const raw = window.localStorage.getItem(CHECKED_IN_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string[]>
  } catch {
    return {}
  }
}

const hasCheckedIn = (sessionCode: string, programId: string): boolean =>
  (readCheckedIn()[sessionCode] ?? []).includes(programId)

const rememberCheckedIn = (sessionCode: string, programId: string): void => {
  const all = readCheckedIn()
  const forSession = all[sessionCode] ?? []
  if (forSession.includes(programId)) return
  window.localStorage.setItem(
    CHECKED_IN_KEY,
    JSON.stringify({ ...all, [sessionCode]: [...forSession, programId] }),
  )
}

const ADMIN_PATH = '/admin'
const RETURN_HOME_MS = 3000

const currentPath = (): string => {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path === '' ? '/' : path
}

const captureJpegBase64 = (video: HTMLVideoElement): string => {
  const naturalWidth = video.videoWidth
  const naturalHeight = video.videoHeight
  if (naturalWidth < 16 || naturalHeight < 16) {
    throw new Error('Camera is not ready yet')
  }

  const outputWidth = Math.min(640, naturalWidth)
  const outputHeight = Math.floor((outputWidth / naturalWidth) * naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not read camera frame')
  }
  context.drawImage(video, 0, 0, outputWidth, outputHeight)
  return canvas.toDataURL('image/jpeg', 0.55).split(',')[1] ?? ''
}

function App() {
  const [programPinInput, setProgramPinInput] = useState('')
  const [checkInUnlocked, setCheckInUnlocked] = useState(false)
  const [path, setPath] = useState(currentPath)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const isAdminRoute = path === ADMIN_PATH

  const [statusMessage, setStatusMessage] = useState('Hold your pass in the frame. Scanning starts automatically.')
  const [statusKind, setStatusKind] = useState<'info' | 'error' | 'success'>('info')
  const [isReading, setIsReading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scanned, setScanned] = useState<ScannedPass | null>(null)
  const [outcome, setOutcome] = useState<FlowOutcome | null>(null)
  const [pendingQueueCount, setPendingQueueCount] = useState(0)

  const [now, setNow] = useState(() => new Date())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannedRef = useRef<ScannedPass | null>(null)
  const submittingRef = useRef(false)
  const readingRef = useRef(false)
  const activeProgramme = useMemo(
    () =>
      getCheckInProgramme(now, {
        enforceWindow: config.enforceProgrammeWindow,
        overrideCode: config.programmeCodeOverride,
      }),
    [now],
  )
  const nextProgramme = useMemo(() => getNextProgramme(now), [now])
  const checkInOpen = Boolean(activeProgramme)
  const flowHalted = outcome !== null

  const resetToHome = () => {
    scannedRef.current = null
    submittingRef.current = false
    setScanned(null)
    setOutcome(null)
    setIsSubmitting(false)
    setCheckInUnlocked(false)
    setProgramPinInput('')
    setStatusKind('info')
    setStatusMessage('Hold your pass in the frame. Scanning starts automatically.')
  }

  const rescan = () => {
    scannedRef.current = null
    setScanned(null)
    setStatusKind('info')
    setStatusMessage('Hold your pass in the frame. Scanning starts automatically.')
  }

  // Every terminal state, good or bad, parks on a message and then hands the
  // device back to the next attendee at the PIN screen.
  const finishWith = (next: FlowOutcome) => {
    scannedRef.current = null
    setScanned(null)
    setOutcome(next)
  }

  useEffect(() => {
    scannedRef.current = scanned
  }, [scanned])

  useEffect(() => {
    submittingRef.current = isSubmitting
  }, [isSubmitting])

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const tick = window.setInterval(() => setNow(new Date()), 15_000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.clearInterval(tick)
    }
  }, [])

  useEffect(() => {
    setPendingQueueCount(listQueuedAttendance().length)
  }, [])

  useEffect(() => {
    if (!isAdminRoute && !checkInUnlocked) {
      warmCheckInAccess()
    }
  }, [isAdminRoute, checkInUnlocked])

  useEffect(() => {
    if (!flowHalted) return
    const timer = window.setTimeout(resetToHome, RETURN_HOME_MS)
    return () => window.clearTimeout(timer)
  }, [flowHalted])

  useEffect(() => {
    const onPopState = () => setPath(currentPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const flushQueue = async (): Promise<void> => {
      if (!isOnline) return
      const result = await flushAttendanceQueue(submitToGoogleSheet)
      if (!cancelled) setPendingQueueCount(result.remaining)
    }

    void flushQueue()
    const timer = window.setInterval(() => void flushQueue(), 3_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void flushQueue()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isOnline])

  useEffect(() => {
    if (isAdminRoute || !checkInUnlocked || !activeProgramme || flowHalted) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      return
    }

    let cancelled = false
    const abortReads = new AbortController()

    const startCamera = async () => {
      if (streamRef.current) return
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          await new Promise<void>((resolve) => {
            video.addEventListener('loadeddata', () => resolve(), { once: true })
          })
        }
      }
    }

    const loop = async () => {
      setStatusKind('info')
      setStatusMessage('Hold your pass in the frame. Scanning starts automatically.')
      while (!cancelled) {
        if (scannedRef.current || submittingRef.current || readingRef.current) {
          await sleep(250)
          continue
        }

        const video = videoRef.current
        if (!video || video.videoWidth < 16) {
          await sleep(200)
          continue
        }

        readingRef.current = true
        setIsReading(true)
        setStatusKind('info')
        setStatusMessage('Reading pass...')
        try {
          const imageBase64 = captureJpegBase64(video)
          const result = await readPassFromImage(imageBase64, {
            timeoutMs: 5000,
            signal: abortReads.signal,
          })
          if (cancelled) return
          const pass = {
            programId: normalizeProgramId(result.pass.programId),
            fullName: result.pass.fullName,
            country: result.pass.country,
          }
          if (hasCheckedIn(activeProgramme.code, pass.programId)) {
            finishWith({
              kind: 'duplicate',
              title: 'Already checked in',
              detail: `${pass.fullName} (${pass.programId}) is already marked present for ${activeProgramme.title}.`,
            })
            return
          }
          scannedRef.current = pass
          setScanned(pass)
          setStatusKind('success')
          setStatusMessage('Pass read. Confirm below.')
        } catch (error) {
          if (cancelled) return
          const message = error instanceof Error ? error.message : 'Scan failed'
          if (error instanceof PassReadRateLimitError) {
            setStatusKind('info')
            setStatusMessage('Vision service is busy. Retrying automatically...')
            await sleep(error.retryAfterMs)
          } else if (message === 'NO_ID') {
            setStatusKind('info')
            setStatusMessage('Hold your pass steady in the frame.')
            await sleep(1_200)
          } else {
            setStatusKind('error')
            setStatusMessage(message)
            await sleep(2_000)
          }
        } finally {
          readingRef.current = false
          setIsReading(false)
        }
      }
    }

    void startCamera()
      .then(() => sleep(150))
      .then(() => loop())
      .catch((error) => {
        if (cancelled) return
        finishWith({
          kind: 'error',
          title: 'Camera unavailable',
          detail: error instanceof Error ? error.message : 'Could not start the camera.',
        })
      })

    return () => {
      cancelled = true
      abortReads.abort()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [isAdminRoute, checkInUnlocked, activeProgramme?.code, flowHalted])

  const queueCheckIn = (payload: OfflineCheckIn) => {
    const result = enqueueAttendance(payload)
    setPendingQueueCount(result.count)
    if (!result.added) {
      finishWith({
        kind: 'duplicate',
        title: 'Already checked in',
        detail: `${payload.fullName} (${payload.programId}) is already queued for ${payload.sessionLabel}.`,
      })
      return
    }
    rememberCheckedIn(payload.sessionCode, payload.programId)
    finishWith({
      kind: 'queued',
      title: 'Check-in saved offline',
      detail: `${payload.fullName} (${payload.programId}) is saved for ${payload.sessionLabel} and will sync automatically.`,
    })
  }

  const handleUnlock = async () => {
    setIsUnlocking(true)
    try {
      await unlockCheckIn(programPinInput)
      setCheckInUnlocked(true)
      setStatusKind('info')
      setStatusMessage('Hold your pass in the frame. Scanning starts automatically.')
    } catch (error) {
      setStatusKind('error')
      setStatusMessage(error instanceof Error ? error.message : 'Incorrect program PIN.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleMarkPresent = async () => {
    if (!scanned) return
    if (!activeProgramme) {
      finishWith({
        kind: 'error',
        title: 'Check-in closed',
        detail: 'There is no live programme right now, so this check-in was not recorded.',
      })
      return
    }
    const normalizedId = normalizeProgramId(scanned.programId)
    const fullName = scanned.fullName.trim()
    const country = scanned.country.trim()
    if (!isValidProgramId(normalizedId) || !fullName || !country) {
      finishWith({
        kind: 'error',
        title: 'Pass could not be read',
        detail: 'The scan did not return a complete pass. Please start again and hold the pass steady.',
      })
      return
    }

    if (hasCheckedIn(activeProgramme.code, normalizedId)) {
      finishWith({
        kind: 'duplicate',
        title: 'Already checked in',
        detail: `${fullName} (${normalizedId}) is already marked present for ${activeProgramme.title}.`,
      })
      return
    }

    setIsSubmitting(true)
    setStatusKind('info')
    setStatusMessage('Capturing check-in location...')
    const location = await getCheckInLocation()
    if (location.locationStatus !== 'ok') {
      setIsSubmitting(false)
      finishWith({
        kind: 'error',
        title: 'Location required',
        detail: 'Turn on location for this site, then start again. Check-in needs the live device location.',
      })
      return
    }

    const payload: OfflineCheckIn = {
      programId: normalizedId,
      fullName,
      country,
      attendanceDate: activeProgramme.date,
      sessionCode: activeProgramme.code,
      sessionLabel: activeProgramme.title,
      programmeWindow: formatProgrammeWindow(activeProgramme),
      source: 'vision',
      editedBeforeConfirm: false,
      ...location,
    }

    if (!isOnline) {
      queueCheckIn(payload)
      setIsSubmitting(false)
      return
    }

    try {
      const result = await submitToGoogleSheet(payload)
      rememberCheckedIn(activeProgramme.code, normalizedId)
      if (result.duplicate) {
        finishWith({
          kind: 'duplicate',
          title: 'Already checked in',
          detail: `${fullName} (${normalizedId}) was already marked present for ${activeProgramme.title}.`,
        })
      } else {
        finishWith({
          kind: 'success',
          title: 'Attendance recorded',
          detail: `${fullName} (${normalizedId}) is marked present for ${activeProgramme.title}.`,
        })
      }
    } catch {
      queueCheckIn(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkInGate = (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault()
        void handleUnlock()
      }}
    >
      <h2>Program Check-in PIN</h2>
      {checkInOpen && activeProgramme ? (
        <p>
          Enter the PIN for {activeProgramme.title} ({formatProgrammeWindow(activeProgramme)}) to begin self check-in.
        </p>
      ) : (
        <p>
          Check-in is closed until a programme is live
          {nextProgramme
            ? ` (next: ${nextProgramme.title} at ${formatProgrammeWindow(nextProgramme)}).`
            : '.'}
        </p>
      )}
      <input
        type="password"
        value={programPinInput}
        onChange={(event) => setProgramPinInput(event.target.value)}
        placeholder="Program PIN"
        autoComplete="current-password"
        disabled={!checkInOpen}
      />
      <button type="submit" disabled={!checkInOpen || isUnlocking || programPinInput.length < 4}>
        {isUnlocking ? 'Checking...' : 'Unlock check-in'}
      </button>
      {statusKind === 'error' && <p className="error">{statusMessage}</p>}
    </form>
  )

  const goHome = () => {
    window.history.pushState({}, '', '/')
    setPath('/')
  }

  return (
    <main className="page">
      <header className="topbar">
        <h1>KOICA Youth Leaders Attendance</h1>
        <span>
          {isAdminRoute
            ? 'Staff admin'
            : activeProgramme
              ? `${activeProgramme.title} · ${formatProgrammeWindow(activeProgramme)}`
              : nextProgramme
                ? `Closed · next ${nextProgramme.title} ${formatProgrammeWindow(nextProgramme)}`
                : 'Check-in closed'}
        </span>
      </header>
      <section className="card-stack">
        {isAdminRoute ? (
          <StaffPanel liveProgramme={activeProgramme} onClose={goHome} />
        ) : !checkInUnlocked ? (
          checkInGate
        ) : outcome ? (
          <article className={`card outcome outcome-${outcome.kind}`}>
            <h2>{outcome.title}</h2>
            <p>{outcome.detail}</p>
            <p className="muted">Returning to the start for the next person...</p>
            <button type="button" onClick={resetToHome}>
              Done
            </button>
          </article>
        ) : !checkInOpen ? (
          <article className="card">
            <h2>Check-in closed</h2>
            <p>
              {nextProgramme
                ? `The live window has ended. Next programme: ${nextProgramme.title} (${formatProgrammeWindow(nextProgramme)}).`
                : 'There is no live programme right now.'}
            </p>
            <button type="button" className="subtle" onClick={() => setCheckInUnlocked(false)}>
              Enter a new PIN
            </button>
          </article>
        ) : (
          <>
            {/* Kept mounted while confirming so returning to the camera is instant. */}
            <section className={scanned ? 'step is-hidden' : 'step'} aria-hidden={Boolean(scanned)}>
              <p className="step-label">Step 1 of 2 · Scan</p>
              <div className="scanner">
                <video ref={videoRef} playsInline muted />
                <div className="scan-frame" aria-hidden="true" />
                <div className="scan-hud">
                  <p className="scan-hint">
                    {isReading ? 'Reading pass...' : 'Hold your pass inside the frame'}
                  </p>
                  <p className={`scan-status ${statusKind}`}>{statusMessage}</p>
                </div>
              </div>
              {!isOnline && <p className="warning">Offline: check-ins queue and sync later.</p>}
              {pendingQueueCount > 0 && (
                <p className="warning">{pendingQueueCount} queued check-ins pending sync.</p>
              )}
            </section>

            {scanned && (
              <section className="step">
                <p className="step-label">Step 2 of 2 · Confirm</p>
                <article className="card confirm">
                  <h2>Is this you?</h2>
                  <dl className="readout">
                    <div>
                      <dt>Full Name</dt>
                      <dd className="readout-lead">{scanned.fullName}</dd>
                    </div>
                    <div>
                      <dt>Program ID</dt>
                      <dd>{scanned.programId}</dd>
                    </div>
                    <div>
                      <dt>Country</dt>
                      <dd>{scanned.country}</dd>
                    </div>
                    <div>
                      <dt>Programme</dt>
                      <dd>
                        {activeProgramme
                          ? `${activeProgramme.title} · ${formatProgrammeWindow(activeProgramme)}`
                          : 'No programme selected'}
                      </dd>
                    </div>
                  </dl>
                  <p className="muted">Your live device location is stored with this check-in.</p>
                </article>
                <div className="action-bar">
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => void handleMarkPresent()}
                    disabled={isSubmitting || !activeProgramme}
                  >
                    {isSubmitting ? 'Submitting...' : 'Mark Present'}
                  </button>
                  <button
                    type="button"
                    className="subtle"
                    onClick={rescan}
                    disabled={isSubmitting}
                  >
                    Scan again
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
