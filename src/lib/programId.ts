export const normalizeProgramId = (value: string): string => {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

export const isValidProgramId = (value: string): boolean => {
  return /^KYLP\d+$/.test(normalizeProgramId(value))
}
