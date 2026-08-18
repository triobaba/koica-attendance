import { useEffect, useMemo, useState } from 'react'
import { listProgrammePins, saveProgrammePin, type StoredPin } from './lib/checkinAccess'
import { programmes } from './schedule'
import type { Programme } from './types'

const DEFAULT_PIN_CODE = '*'

type StaffPanelProps = {
  liveProgramme: Programme | null
  onClose: () => void
}

export function StaffPanel({ liveProgramme, onClose }: StaffPanelProps) {
  const [staffPin, setStaffPin] = useState('')
  const [staffUnlocked, setStaffUnlocked] = useState(false)
  const [pins, setPins] = useState<StoredPin[]>([])
  const [warning, setWarning] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusKind, setStatusKind] = useState<'info' | 'error' | 'success'>('info')
  const [sessionCode, setSessionCode] = useState(liveProgramme?.code ?? DEFAULT_PIN_CODE)
  const [pinInput, setPinInput] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const selectedTitle = useMemo(() => {
    if (sessionCode === DEFAULT_PIN_CODE) return 'Default PIN for programmes without a custom PIN'
    return programmes.find((programme) => programme.code === sessionCode)?.title ?? sessionCode
  }, [sessionCode])

  useEffect(() => {
    if (!staffUnlocked) return
    const current = pins.find((item) => item.sessionCode === sessionCode)
    setPinInput(current?.pin ?? '')
  }, [pins, sessionCode, staffUnlocked])

  const unlockStaff = async () => {
    setIsBusy(true)
    setStatusMessage('')
    try {
      const result = await listProgrammePins(staffPin)
      setPins(result.pins)
      setWarning(result.warning ?? '')
      setStaffUnlocked(true)
      setStatusKind('success')
      setStatusMessage('Staff unlocked. Set a PIN per programme or a default PIN.')
    } catch (error) {
      setStatusKind('error')
      setStatusMessage(error instanceof Error ? error.message : 'Could not unlock staff tools.')
    } finally {
      setIsBusy(false)
    }
  }

  const savePin = async () => {
    setIsBusy(true)
    try {
      const next = await saveProgrammePin({
        staffPin,
        sessionCode,
        pin: pinInput.trim(),
        title: selectedTitle,
      })
      setPins(next)
      setWarning('')
      setStatusKind('success')
      setStatusMessage(`Saved PIN for ${selectedTitle}.`)
    } catch (error) {
      setStatusKind('error')
      setStatusMessage(error instanceof Error ? error.message : 'Could not save PIN.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <article className="card">
      <h2>Staff PIN tools</h2>
      {!staffUnlocked ? (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            void unlockStaff()
          }}
        >
          <p>Facilitators can set a check-in PIN per programme. Participants use that PIN to unlock the camera.</p>
          <label>
            Staff PIN
            <input
              type="password"
              value={staffPin}
              onChange={(event) => setStaffPin(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <div className="row">
            <button type="submit" disabled={isBusy || staffPin.length < 4}>
              {isBusy ? 'Checking...' : 'Unlock staff tools'}
            </button>
            <button type="button" className="subtle" onClick={onClose}>
              Back to check-in
            </button>
          </div>
          {statusMessage && <p className={statusKind}>{statusMessage}</p>}
        </form>
      ) : (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            void savePin()
          }}
        >
          {liveProgramme ? (
            <p>
              Live programme: {liveProgramme.title}. Participants must use the PIN for this session, or the default PIN
              if this session has none.
            </p>
          ) : (
            <p>No live programme right now. You can still set PINs for upcoming sessions.</p>
          )}
          <label>
            Programme
            <select value={sessionCode} onChange={(event) => setSessionCode(event.target.value)}>
              <option value={DEFAULT_PIN_CODE}>Default PIN (all programmes without a custom PIN)</option>
              {programmes.map((programme) => (
                <option key={programme.code} value={programme.code}>
                  {programme.date} · {programme.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Check-in PIN
            <input
              type="text"
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value)}
              placeholder="At least 4 characters"
              autoComplete="off"
            />
          </label>
          <div className="row">
            <button type="submit" disabled={isBusy || pinInput.trim().length < 4}>
              {isBusy ? 'Saving...' : 'Save PIN'}
            </button>
            <button type="button" className="subtle" onClick={onClose}>
              Back to check-in
            </button>
          </div>
          {warning && <p className="warning">{warning}</p>}
          {statusMessage && <p className={statusKind}>{statusMessage}</p>}
          {pins.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th>PIN</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {pins.map((item) => (
                    <tr key={item.sessionCode}>
                      <td>{item.sessionCode === DEFAULT_PIN_CODE ? 'Default PIN' : item.title || item.sessionCode}</td>
                      <td>{item.pin}</td>
                      <td>{item.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>
      )}
    </article>
  )
}
