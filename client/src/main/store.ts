import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

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
