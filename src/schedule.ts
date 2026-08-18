import type { Programme } from './types.js'

// Source: https://serene-sawine-f5fe79.netlify.app/koica-schedule.ics
// Check-in programmes only (meals, free days, arrival, and departure omitted).

export const programmes: Programme[] = [
  {
    code: 'koica-2026-001',
    title: 'Orientation, program briefing & team formation',
    kind: 'admin',
    date: '2026-08-17',
    startsAt: '2026-08-17T09:00:00.000Z',
    endsAt: '2026-08-17T10:30:00.000Z',
  },
  {
    code: 'koica-2026-002',
    title: 'Opening ceremony',
    kind: 'admin',
    date: '2026-08-17',
    startsAt: '2026-08-17T10:30:00.000Z',
    endsAt: '2026-08-17T12:00:00.000Z',
  },
  {
    code: 'koica-2026-004',
    title: 'Country report',
    kind: 'lecture',
    date: '2026-08-17',
    startsAt: '2026-08-17T14:00:00.000Z',
    endsAt: '2026-08-17T17:00:00.000Z',
    speaker: 'Prof. Cha Jae-sang, Prof. Kim Ki-yoon, Director Lee Seok-gak',
  },
  {
    code: 'koica-2026-006',
    title: 'Self-introduction & networking',
    kind: 'lecture',
    date: '2026-08-17',
    startsAt: '2026-08-17T19:00:00.000Z',
    endsAt: '2026-08-17T21:00:00.000Z',
    speaker: 'Wendy',
  },
  {
    code: 'koica-2026-007',
    title: 'Light IoT and LED / intelligent signage applications',
    kind: 'lecture',
    date: '2026-08-18',
    startsAt: '2026-08-18T09:00:00.000Z',
    endsAt: '2026-08-18T12:00:00.000Z',
    speaker: 'Prof. Cha Jae-sang',
  },
  {
    code: 'koica-2026-009',
    title: 'Applications and utilization of AI-ICT solutions',
    kind: 'lecture',
    date: '2026-08-18',
    startsAt: '2026-08-18T14:00:00.000Z',
    endsAt: '2026-08-18T17:00:00.000Z',
    speaker: 'Prof. Kim Ki-yoon',
  },
  {
    code: 'koica-2026-011',
    title: 'Identifying business opportunities and customer development',
    kind: 'lecture',
    date: '2026-08-19',
    startsAt: '2026-08-19T09:00:00.000Z',
    endsAt: '2026-08-19T12:00:00.000Z',
    speaker: 'Director Lee Seok-gak',
  },
  {
    code: 'koica-2026-013',
    title: 'Advanced customer development',
    kind: 'lecture',
    date: '2026-08-19',
    startsAt: '2026-08-19T14:00:00.000Z',
    endsAt: '2026-08-19T17:00:00.000Z',
    speaker: 'Director Lee Seok-gak',
  },
  {
    code: 'koica-2026-015',
    title: 'Market size analysis and competitive analysis',
    kind: 'lecture',
    date: '2026-08-20',
    startsAt: '2026-08-20T09:00:00.000Z',
    endsAt: '2026-08-20T12:00:00.000Z',
    speaker: 'Director Lee Seok-gak',
  },
  {
    code: 'koica-2026-017',
    title: 'Entrepreneurship cases for solving social problems',
    kind: 'lecture',
    date: '2026-08-20',
    startsAt: '2026-08-20T14:00:00.000Z',
    endsAt: '2026-08-20T17:00:00.000Z',
    speaker: 'Director Lee Seok-gak',
  },
  {
    code: 'koica-2026-019',
    title: 'Pitching and AP writing',
    kind: 'lecture',
    date: '2026-08-21',
    startsAt: '2026-08-21T09:00:00.000Z',
    endsAt: '2026-08-21T12:00:00.000Z',
    speaker: 'Prof. Kim Byung-chun',
  },
  {
    code: 'koica-2026-021',
    title: 'Private-sector AP enhancement',
    kind: 'lecture',
    date: '2026-08-21',
    startsAt: '2026-08-21T14:00:00.000Z',
    endsAt: '2026-08-21T17:00:00.000Z',
    speaker: 'Prof. Kim Byung-chun',
  },
  {
    code: 'koica-2026-023',
    title: 'Site visit: GI-KACE',
    kind: 'visit',
    date: '2026-08-22',
    startsAt: '2026-08-22T09:00:00.000Z',
    endsAt: '2026-08-22T12:00:00.000Z',
  },
  {
    code: 'koica-2026-025',
    title: 'Cultural experience: KAMP & Osu Castle',
    kind: 'culture',
    date: '2026-08-22',
    startsAt: '2026-08-22T14:00:00.000Z',
    endsAt: '2026-08-22T17:00:00.000Z',
  },
  {
    code: 'koica-2026-028',
    title: 'Hands-on: generative AI startup tools',
    kind: 'practice',
    date: '2026-08-24',
    startsAt: '2026-08-24T09:00:00.000Z',
    endsAt: '2026-08-24T12:00:00.000Z',
    speaker: 'Prince',
  },
  {
    code: 'koica-2026-030',
    title: 'Perception AI startup case analysis',
    kind: 'practice',
    date: '2026-08-24',
    startsAt: '2026-08-24T14:00:00.000Z',
    endsAt: '2026-08-24T17:00:00.000Z',
    speaker: 'Ama',
  },
  {
    code: 'koica-2026-032',
    title: 'AP preparation — small group 1',
    kind: 'ap',
    date: '2026-08-24',
    startsAt: '2026-08-24T20:00:00.000Z',
    endsAt: '2026-08-24T22:00:00.000Z',
  },
  {
    code: 'koica-2026-033',
    title: 'Hands-on MVP development using no-code platforms',
    kind: 'practice',
    date: '2026-08-25',
    startsAt: '2026-08-25T09:00:00.000Z',
    endsAt: '2026-08-25T12:00:00.000Z',
    speaker: 'Prince',
  },
  {
    code: 'koica-2026-035',
    title: 'Problem tree & stakeholder map',
    kind: 'practice',
    date: '2026-08-25',
    startsAt: '2026-08-25T14:00:00.000Z',
    endsAt: '2026-08-25T17:00:00.000Z',
    speaker: 'Prince',
  },
  {
    code: 'koica-2026-037',
    title: 'AP preparation — small group 2',
    kind: 'ap',
    date: '2026-08-25',
    startsAt: '2026-08-25T20:00:00.000Z',
    endsAt: '2026-08-25T22:00:00.000Z',
  },
  {
    code: 'koica-2026-038',
    title: 'Site visit: NYA',
    kind: 'visit',
    date: '2026-08-26',
    startsAt: '2026-08-26T09:00:00.000Z',
    endsAt: '2026-08-26T12:00:00.000Z',
  },
  {
    code: 'koica-2026-040',
    title: 'Basics of problem solving and KPIs',
    kind: 'lecture',
    date: '2026-08-26',
    startsAt: '2026-08-26T14:00:00.000Z',
    endsAt: '2026-08-26T17:00:00.000Z',
    speaker: 'Prince',
  },
  {
    code: 'koica-2026-042',
    title: 'AP preparation — small group 3',
    kind: 'ap',
    date: '2026-08-26',
    startsAt: '2026-08-26T20:00:00.000Z',
    endsAt: '2026-08-26T22:00:00.000Z',
  },
  {
    code: 'koica-2026-043',
    title: 'Startup project design',
    kind: 'lecture',
    date: '2026-08-27',
    startsAt: '2026-08-27T09:00:00.000Z',
    endsAt: '2026-08-27T12:00:00.000Z',
    speaker: 'Okantey',
  },
  {
    code: 'koica-2026-045',
    title: 'Special lecture by YALI alumni',
    kind: 'lecture',
    date: '2026-08-27',
    startsAt: '2026-08-27T14:00:00.000Z',
    endsAt: '2026-08-27T17:00:00.000Z',
  },
  {
    code: 'koica-2026-047',
    title: 'AP preparation — small group 4',
    kind: 'ap',
    date: '2026-08-27',
    startsAt: '2026-08-27T20:00:00.000Z',
    endsAt: '2026-08-27T22:00:00.000Z',
  },
  {
    code: 'koica-2026-048',
    title: 'Final submission — demo day materials',
    kind: 'ap',
    date: '2026-08-28',
    startsAt: '2026-08-28T09:00:00.000Z',
    endsAt: '2026-08-28T12:00:00.000Z',
    speaker: 'Okantey',
  },
  {
    code: 'koica-2026-050',
    title: 'Demo day pitching',
    kind: 'lecture',
    date: '2026-08-28',
    startsAt: '2026-08-28T14:00:00.000Z',
    endsAt: '2026-08-28T17:00:00.000Z',
    speaker: 'MEST Africa',
  },
  {
    code: 'koica-2026-051',
    title: 'Completion ceremony',
    kind: 'admin',
    date: '2026-08-28',
    startsAt: '2026-08-28T17:00:00.000Z',
    endsAt: '2026-08-28T18:00:00.000Z',
  },
  {
    code: 'koica-2026-052',
    title: 'Farewell reception',
    kind: 'culture',
    date: '2026-08-28',
    startsAt: '2026-08-28T18:00:00.000Z',
    endsAt: '2026-08-28T20:00:00.000Z',
  },
]

const GRACE_BEFORE_MS = 20 * 60 * 1000
const GRACE_AFTER_MS = 20 * 60 * 1000

export const getProgrammeByCode = (code: string): Programme | undefined => {
  return programmes.find((programme) => programme.code === code)
}

export const getActiveProgramme = (now = new Date()): Programme | null => {
  const t = now.getTime()
  const current = programmes.find((programme) => {
    const start = Date.parse(programme.startsAt)
    const end = Date.parse(programme.endsAt)
    return t >= start && t < end
  })
  if (current) return current

  const upcoming = programmes.find((programme) => {
    const start = Date.parse(programme.startsAt)
    return start > t && start - t <= GRACE_BEFORE_MS
  })
  if (upcoming) return upcoming

  const recent = [...programmes].reverse().find((programme) => {
    const end = Date.parse(programme.endsAt)
    return t >= end && t - end <= GRACE_AFTER_MS
  })
  return recent ?? null
}

export const getNextProgramme = (now = new Date()): Programme | null => {
  const t = now.getTime()
  return programmes.find((programme) => Date.parse(programme.startsAt) > t) ?? null
}

export const getCheckInProgramme = (now = new Date(), options?: { enforceWindow?: boolean; overrideCode?: string }): Programme | null => {
  if (options?.overrideCode && !options.enforceWindow) {
    const override = getProgrammeByCode(options.overrideCode)
    if (override) return override
  }

  const active = getActiveProgramme(now)
  if (active) return active
  if (options?.enforceWindow) return null

  return getNextProgramme(now) ?? programmes[programmes.length - 1] ?? null
}

export const formatProgrammeWindow = (programme: Programme): string => {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const start = time.format(new Date(programme.startsAt))
  const end = time.format(new Date(programme.endsAt))
  return `${start}–${end}`
}
