import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import checkinAccess from './api/checkin-access.ts'
import markAttendance from './api/mark-attendance.ts'
import readPass from './api/read-pass.ts'

const handlers: Record<string, (request: Request) => Promise<Response>> = {
  '/api/read-pass': readPass,
  '/api/mark-attendance': markAttendance,
  '/api/checkin-access': checkinAccess,
}

const readBody = async (req: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

const toWebRequest = (req: IncomingMessage, body: string): Request => {
  const host = req.headers.host ?? 'localhost'
  const url = `http://${host}${req.url ?? '/'}`
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  const method = req.method ?? 'GET'
  return new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })
}

const sendWebResponse = async (webResponse: Response, res: ServerResponse): Promise<void> => {
  res.statusCode = webResponse.status
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(Buffer.from(await webResponse.arrayBuffer()))
}

export const localApiPlugin = (): Plugin => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const path = req.url?.split('?')[0] ?? ''
      const handler = handlers[path]
      if (!handler) {
        next()
        return
      }

      try {
        const body = await readBody(req)
        const webResponse = await handler(toWebRequest(req, body))
        await sendWebResponse(webResponse, res)
      } catch (error) {
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Local API failed',
            details: cause,
          }),
        )
      }
    })
  },
})
