const optionalEnv = (key: string, fallback: string): string => {
  const value = import.meta.env[key]
  return value && typeof value === 'string' ? value : fallback
}

export const config = {
  programmeCodeOverride: optionalEnv('VITE_PROGRAMME_CODE', ''),
  enforceProgrammeWindow: optionalEnv('VITE_ENFORCE_PROGRAMME_WINDOW', 'true') === 'true',
}
