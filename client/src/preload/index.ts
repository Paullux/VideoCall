import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface ChatMessage {
  id: string
  from: 'me' | 'peer'
  text: string
  timestamp: number
}

const api = {
  // Auth
  auth: {
    getStatus: (): Promise<{ isAuthenticated: boolean; displayName?: string }> =>
      ipcRenderer.invoke('auth:get-status'),
    login: (): void => ipcRenderer.send('auth:login'),
    logout: (): void => ipcRenderer.send('auth:logout'),
    onUpdated: (cb: (status: { isAuthenticated: boolean; displayName?: string }) => void): void => {
      ipcRenderer.on('auth:updated', (_, status) => cb(status))
    },
  },

  // Signaling
  call: (roomId: string): void => ipcRenderer.send('call', roomId),
  accept: (roomId: string): void => ipcRenderer.send('accept', roomId),
  reject: (): void => ipcRenderer.send('reject'),
  hangup: (): void => ipcRenderer.send('hangup'),

  onIncomingCall: (cb: (roomId: string) => void): void => {
    ipcRenderer.on('incoming_call', (_, roomId) => cb(roomId as string))
  },
  onCallAccepted: (cb: (roomId: string) => void): void => {
    ipcRenderer.on('call_accepted', (_, roomId) => cb(roomId as string))
  },
  onCallRejected: (cb: () => void): void => {
    ipcRenderer.on('call_rejected', () => cb())
  },
  onCallHangup: (cb: () => void): void => {
    ipcRenderer.on('call_hangup', () => cb())
  },
  onPeerStatus: (cb: (online: boolean, peerName: string) => void): void => {
    ipcRenderer.on('peer_status', (_, online, name) => cb(online as boolean, name as string))
  },

  // Chat
  sendMessage: (text: string): void => ipcRenderer.send('send-message', text),
  onMessage: (cb: (msg: ChatMessage) => void): void => {
    ipcRenderer.on('new-message', (_, msg) => cb(msg as ChatMessage))
  },
  getMessages: (): Promise<ChatMessage[]> => ipcRenderer.invoke('get-messages'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
