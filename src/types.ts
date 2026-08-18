export type PassRead = {
  programId: string
  fullName: string
  country: string
  confidence: number
}

export type CheckInSource = 'vision' | 'manual'

export type LocationStatus = 'ok' | 'denied' | 'timeout' | 'unavailable'

export type OfflineCheckIn = {
  programId: string
  fullName: string
  country: string
  attendanceDate: string
  sessionCode: string
  sessionLabel: string
  programmeWindow: string
  source: CheckInSource
  editedBeforeConfirm: boolean
  latitude: number | null
  longitude: number | null
  accuracyMeters: number | null
  mapsUrl: string
  locationStatus: LocationStatus
}

export type ProgrammeKind = 'admin' | 'lecture' | 'practice' | 'visit' | 'culture' | 'ap'

export type Programme = {
  code: string
  title: string
  kind: ProgrammeKind
  date: string
  startsAt: string
  endsAt: string
  speaker?: string
}
