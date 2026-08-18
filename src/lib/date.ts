const accraDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Accra',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const getAccraDateString = (date = new Date()): string => {
  return accraDateFormat.format(date)
}

export const buildProgramDates = (startDate: string, days: number): string[] => {
  const [year, month, day] = startDate.split('-').map((segment) => Number.parseInt(segment, 10))
  const start = new Date(Date.UTC(year, month - 1, day))
  const dates: string[] = []

  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(start)
    current.setUTCDate(start.getUTCDate() + offset)
    const yyyy = current.getUTCFullYear()
    const mm = `${current.getUTCMonth() + 1}`.padStart(2, '0')
    const dd = `${current.getUTCDate()}`.padStart(2, '0')
    dates.push(`${yyyy}-${mm}-${dd}`)
  }

  return dates
}
