// #region agent log
fetch('http://127.0.0.1:7340/ingest/5d4c122e-e010-454f-b4af-74372fe873f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1c2be'},body:JSON.stringify({sessionId:'e1c2be',runId:'post-fix',hypothesisId:'H2',location:'lib/env.ts:1',message:'lib/env module loaded via .js specifier',data:{runtime:typeof process!=='undefined'?process.version:'unknown'},timestamp:Date.now()})}).catch(()=>{});
// #endregion

export const serverEnv = (key: string, fallback = ''): string => {
  let value = (process.env[key] ?? fallback).replace(/\r/g, '').trim()
  if (key === 'GEMINI_MODEL' && (value === 'gemini-2.5-flash' || value === 'gemini-3.6-flash' || value === '')) {
    value = 'gemini-3.1-flash-lite'
  }
  return value
}
