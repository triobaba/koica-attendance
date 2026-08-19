export const serverEnv = (key: string, fallback = ''): string => {
  return (process.env[key] ?? fallback).replace(/\r/g, '').trim()
}
