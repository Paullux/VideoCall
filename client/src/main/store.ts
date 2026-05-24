import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  from: 'me' | 'peer'
  text: string
  timestamp: number
}

const MAX_MESSAGES = 500

function messagesPath(): string {
  return join(app.getPath('userData'), 'messages.json')
}

export function getMessages(): ChatMessage[] {
  try {
    const path = messagesPath()
    if (!existsSync(path)) return []
    return JSON.parse(readFileSync(path, 'utf-8')) as ChatMessage[]
  } catch { return [] }
}

export function addMessage(msg: ChatMessage): void {
  const msgs = getMessages()
  msgs.push(msg)
  if (msgs.length > MAX_MESSAGES) msgs.splice(0, msgs.length - MAX_MESSAGES)
  writeFileSync(messagesPath(), JSON.stringify(msgs), 'utf-8')
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  accessToken: string
  idToken: string
  refreshToken: string
  userId: string
  displayName: string
  email: string
}

function storePath(): string {
  return join(app.getPath('userData'), 'auth.json')
}

export function getAuth(): AuthState | null {
  try {
    const path = storePath()
    if (!existsSync(path)) return null
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as AuthState | null
  } catch {
    return null
  }
}

export function setAuth(auth: AuthState): void {
  writeFileSync(storePath(), JSON.stringify(auth, null, 2), 'utf-8')
}

export function clearAuth(): void {
  writeFileSync(storePath(), 'null', 'utf-8')
}
