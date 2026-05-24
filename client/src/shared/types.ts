// Client → Server
export type ClientMessage =
  | { type: 'register'; accessToken: string }
  | { type: 'call'; roomId: string }
  | { type: 'accept'; roomId: string }
  | { type: 'reject' }
  | { type: 'hangup' }

// Server → Client
export type ServerMessage =
  | { type: 'registered'; userId: string }
  | { type: 'peer_online'; peerId: string; peerName: string }
  | { type: 'peer_offline'; peerId: string }
  | { type: 'incoming_call'; roomId: string; callerName: string }
  | { type: 'call_accepted'; roomId: string }
  | { type: 'call_rejected' }
  | { type: 'call_hangup' }
  | { type: 'error'; message: string }
