import WebSocket from 'ws'
import { ipcMain, Notification, BrowserWindow } from 'electron'
import { ClientMessage, ServerMessage } from '../shared/types'
import { addMessage, getMessages, ChatMessage } from './store'
import { randomBytes } from 'crypto'

interface SignalingConfig {
  url: string
  getAccessToken: () => Promise<string>
}

interface SignalingCallbacks {
  onCallReady: (roomId: string) => void
  onCallEnded: () => void
}

export function createSignalingClient(
  mainWindow: BrowserWindow,
  config: SignalingConfig,
  callbacks: SignalingCallbacks
) {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let destroyed = false

  function send(channel: string, ...args: unknown[]): void {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send(channel, ...args)
  }

  async function connect(): Promise<void> {
    if (destroyed) return

    let accessToken: string
    try {
      accessToken = await config.getAccessToken()
    } catch {
      reconnectTimer = setTimeout(connect, 10_000)
      return
    }

    ws = new WebSocket(config.url)

    ws.on('open', () => {
      const msg: ClientMessage = { type: 'register', accessToken }
      ws!.send(JSON.stringify(msg))
    })

    ws.on('message', (data) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(data.toString()) as ServerMessage
      } catch { return }

      switch (msg.type) {
        case 'peer_online':
          send('peer_status', true, msg.peerName)
          break
        case 'peer_offline':
          send('peer_status', false, '')
          break
        case 'incoming_call':
          send('incoming_call', msg.roomId)
          if (Notification.isSupported()) {
            new Notification({
              title: 'Appel entrant',
              body: `${msg.callerName} vous appelle`,
            }).show()
          }
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
          break
        case 'call_accepted':
          send('call_accepted', msg.roomId)
          callbacks.onCallReady(msg.roomId)
          break
        case 'call_rejected':
          send('call_rejected')
          break
        case 'call_hangup':
          send('call_hangup')
          callbacks.onCallEnded()
          break
        case 'message_received': {
          const chatMsg: ChatMessage = {
            id: randomBytes(8).toString('hex'),
            from: 'peer',
            text: msg.text,
            timestamp: msg.timestamp,
          }
          addMessage(chatMsg)
          send('new-message', chatMsg)
          if (Notification.isSupported() && !mainWindow.isFocused()) {
            new Notification({
              title: msg.fromName,
              body: msg.text,
            }).show()
          }
          break
        }
      }
    })

    ws.on('close', () => {
      send('peer_status', false, '')
      if (!destroyed) reconnectTimer = setTimeout(connect, 5_000)
    })

    ws.on('error', () => {
      // close event follows
    })
  }

  // ─── IPC ──────────────────────────────────────────────────────────────────

  ipcMain.on('call', (_, roomId: string) => {
    ws?.send(JSON.stringify({ type: 'call', roomId } satisfies ClientMessage))
  })
  ipcMain.on('accept', (_, roomId: string) => {
    ws?.send(JSON.stringify({ type: 'accept', roomId } satisfies ClientMessage))
    callbacks.onCallReady(roomId)
  })
  ipcMain.on('reject', () => {
    ws?.send(JSON.stringify({ type: 'reject' } satisfies ClientMessage))
  })
  ipcMain.on('hangup', () => {
    ws?.send(JSON.stringify({ type: 'hangup' } satisfies ClientMessage))
    callbacks.onCallEnded()
  })
  ipcMain.on('send-message', (_, text: string) => {
    const timestamp = Date.now()
    const chatMsg: ChatMessage = {
      id: randomBytes(8).toString('hex'),
      from: 'me',
      text,
      timestamp,
    }
    addMessage(chatMsg)
    send('new-message', chatMsg)
    ws?.send(JSON.stringify({ type: 'message', text, timestamp } satisfies ClientMessage))
  })
  ipcMain.handle('get-messages', () => getMessages())

  connect()

  return {
    destroy(): void {
      destroyed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    },
  }
}
