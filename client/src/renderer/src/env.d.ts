/// <reference types="vite/client" />

interface ChatMessage {
  id: string
  from: 'me' | 'peer'
  text: string
  timestamp: number
}

declare global {
  interface Window {
    api: {
      auth: {
        getStatus: () => Promise<{ isAuthenticated: boolean; displayName?: string }>
        login: () => void
        logout: () => void
        onUpdated: (cb: (status: { isAuthenticated: boolean; displayName?: string }) => void) => void
      }
      call: (roomId: string) => void
      accept: (roomId: string) => void
      reject: () => void
      hangup: () => void
      onIncomingCall: (cb: (roomId: string) => void) => void
      onCallAccepted: (cb: (roomId: string) => void) => void
      onCallRejected: (cb: () => void) => void
      onCallHangup: (cb: () => void) => void
      onPeerStatus: (cb: (online: boolean, peerName: string) => void) => void
      sendMessage: (text: string) => void
      onMessage: (cb: (msg: ChatMessage) => void) => void
      getMessages: () => Promise<ChatMessage[]>
    }
  }
}
