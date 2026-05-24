import 'dotenv/config'
import { WebSocketServer, WebSocket } from 'ws'
import { ClientMessage, ServerMessage } from './types'
import jwksRsa from 'jwks-rsa'
import jwt from 'jsonwebtoken'

const PORT = parseInt(process.env.PORT ?? '3000')
const KINDE_DOMAIN = process.env.KINDE_DOMAIN

if (!KINDE_DOMAIN) {
  console.error('KINDE_DOMAIN environment variable is required')
  process.exit(1)
}

const jwksClient = jwksRsa({
  jwksUri: `${KINDE_DOMAIN}/.well-known/jwks`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000, // 10 min
})

interface UserInfo {
  userId: string
  name: string
}

async function validateKindeToken(accessToken: string): Promise<UserInfo> {
  const decoded = jwt.decode(accessToken, { complete: true })
  if (!decoded || typeof decoded === 'string') throw new Error('Invalid token structure')

  const key = await jwksClient.getSigningKey(decoded.header.kid)
  const payload = jwt.verify(accessToken, key.getPublicKey(), {
    issuer: KINDE_DOMAIN,
    algorithms: ['RS256'],
  }) as jwt.JwtPayload

  const name = [payload.given_name, payload.family_name].filter(Boolean).join(' ')
    || String(payload.email ?? 'Utilisateur')

  return { userId: payload.sub!, name }
}

interface ClientInfo {
  ws: WebSocket
  name: string
}

const wss = new WebSocketServer({ port: PORT })
const clients = new Map<string, ClientInfo>()
const alive = new WeakMap<WebSocket, boolean>()

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

function getPeer(userId: string): [string, ClientInfo] | undefined {
  for (const entry of clients) {
    if (entry[0] !== userId) return entry
  }
}

wss.on('connection', (ws) => {
  let userId: string | null = null
  alive.set(ws, true)

  ws.on('pong', () => alive.set(ws, true))

  ws.on('message', async (data) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(data.toString()) as ClientMessage
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' })
      return
    }

    if (msg.type === 'register') {
      if (clients.size >= 2) {
        send(ws, { type: 'error', message: 'Room is full' })
        ws.close(1008, 'Room is full')
        return
      }

      let userInfo: UserInfo
      try {
        userInfo = await validateKindeToken(msg.accessToken)
      } catch {
        send(ws, { type: 'error', message: 'Unauthorized' })
        ws.close(1008, 'Unauthorized')
        return
      }

      userId = userInfo.userId
      clients.set(userId, { ws, name: userInfo.name })
      send(ws, { type: 'registered', userId })

      const peer = getPeer(userId)
      if (peer) {
        send(ws, { type: 'peer_online', peerId: peer[0], peerName: peer[1].name })
        send(peer[1].ws, { type: 'peer_online', peerId: userId, peerName: userInfo.name })
      }
      return
    }

    if (!userId) {
      send(ws, { type: 'error', message: 'Not registered' })
      return
    }

    const peer = getPeer(userId)

    switch (msg.type) {
      case 'call':
        if (peer) send(peer[1].ws, {
          type: 'incoming_call',
          roomId: msg.roomId,
          callerName: clients.get(userId)!.name,
        })
        break
      case 'accept':
        if (peer) send(peer[1].ws, { type: 'call_accepted', roomId: msg.roomId })
        break
      case 'reject':
        if (peer) send(peer[1].ws, { type: 'call_rejected' })
        break
      case 'hangup':
        if (peer) send(peer[1].ws, { type: 'call_hangup' })
        break
      case 'message':
        if (peer) send(peer[1].ws, {
          type: 'message_received',
          text: msg.text,
          fromName: clients.get(userId)!.name,
          timestamp: msg.timestamp,
        })
        break
    }
  })

  ws.on('close', () => {
    if (userId && clients.get(userId)?.ws === ws) {
      clients.delete(userId)
      const peer = getPeer(userId)
      if (peer) send(peer[1].ws, { type: 'peer_offline', peerId: userId })
    }
  })
})

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!alive.get(ws)) { ws.terminate(); return }
    alive.set(ws, false)
    ws.ping()
  })
}, 30_000)

wss.on('close', () => clearInterval(heartbeatInterval))

console.log(`Signaling server listening on ws://0.0.0.0:${PORT}`)
