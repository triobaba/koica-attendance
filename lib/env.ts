export const serverEnv = (key: string, fallback = ''): string => {
  let value = (process.env[key] ?? fallback).replace(/\r/g, '').trim()
  if (key === 'GEMINI_MODEL' && (value === 'gemini-2.5-flash' || value === 'gemini-3.6-flash' || value === '')) {
    value = 'gemini-3.1-flash-lite'
  }
  return value
}
