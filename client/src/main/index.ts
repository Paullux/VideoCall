import { app, BrowserWindow, WebContentsView, ipcMain, shell } from 'electron'
import { join, resolve } from 'path'
import { is } from '@electron-toolkit/utils'
import { createSignalingClient } from './signaling'
import { createJitsiView, destroyJitsiView } from './jitsi'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  parseJwtPayload,
  isTokenExpired,
} from './auth'
import { getAuth, setAuth, clearAuth } from './store'

const KINDE_DOMAIN = (import.meta.env['KINDE_DOMAIN'] as string) ?? ''
const KINDE_CLIENT_ID = (import.meta.env['KINDE_CLIENT_ID'] as string) ?? ''
const SIGNALING_URL = (import.meta.env['SIGNALING_URL'] as string) ?? ''

// Enregistre le protocol custom AVANT app.ready (requis sur Windows)
if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient('videocall', process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('videocall')
}

// Single-instance lock — nécessaire pour capturer le deep link sur Windows
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

let mainWindow: BrowserWindow | null = null
let pendingVerifier: string | null = null
let pendingState: string | null = null
let signalingDestroy: (() => void) | null = null
let currentJitsiView: WebContentsView | null = null

// ─── Deep link handler ────────────────────────────────────────────────────────

async function handleDeepLink(url: string): Promise<void> {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'callback') return

    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')
    if (!code || !state || state !== pendingState || !pendingVerifier) return

    const tokens = await exchangeCodeForTokens(KINDE_DOMAIN, KINDE_CLIENT_ID, code, pendingVerifier)
    pendingVerifier = null
    pendingState = null

    const payload = parseJwtPayload(tokens.idToken)
    const displayName = [payload.given_name, payload.family_name].filter(Boolean).join(' ')
      || String(payload.email ?? 'Utilisateur')

    setAuth({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      userId: String(payload.sub),
      displayName,
      email: String(payload.email ?? ''),
    })

    mainWindow?.webContents.send('auth:updated', { isAuthenticated: true, displayName })
    initSignaling()
  } catch (err) {
    console.error('Deep link handling failed:', err)
    mainWindow?.webContents.send('auth:updated', { isAuthenticated: false })
  }
}

// Windows : deep link arrive comme second instance
app.on('second-instance', (_, commandLine) => {
  const url = commandLine.find((arg) => arg.startsWith('videocall://'))
  if (url) handleDeepLink(url)
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// macOS : deep link via open-url
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// ─── Token refresh ────────────────────────────────────────────────────────────

async function getValidAccessToken(): Promise<string> {
  const auth = getAuth()
  if (!auth) throw new Error('Not authenticated')

  if (!isTokenExpired(auth.accessToken)) return auth.accessToken

  const refreshed = await refreshAccessToken(KINDE_DOMAIN, KINDE_CLIENT_ID, auth.refreshToken)
  const payload = parseJwtPayload(refreshed.idToken)
  setAuth({ ...auth, accessToken: refreshed.accessToken, idToken: refreshed.idToken,
    displayName: [payload.given_name, payload.family_name].filter(Boolean).join(' ') || auth.displayName })

  return refreshed.accessToken
}

// ─── Signaling ────────────────────────────────────────────────────────────────

function initSignaling(): void {
  if (!mainWindow || !SIGNALING_URL) return
  const win = mainWindow

  if (signalingDestroy) {
    signalingDestroy()
    signalingDestroy = null
  }

  const signaling = createSignalingClient(
    win,
    { url: SIGNALING_URL, getAccessToken: getValidAccessToken },
    {
      onCallReady: (roomId) => {
        const auth = getAuth()
        currentJitsiView = createJitsiView(win, roomId, auth?.displayName ?? '')
      },
      onCallEnded: () => {
        if (currentJitsiView) {
          destroyJitsiView(win, currentJitsiView)
          currentJitsiView = null
        }
      },
    }
  )

  win.on('close', () => {
    if (currentJitsiView) destroyJitsiView(win, currentJitsiView)
  })

  signalingDestroy = () => signaling.destroy()
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('auth:get-status', () => {
  const auth = getAuth()
  return { isAuthenticated: !!auth, displayName: auth?.displayName }
})

ipcMain.on('auth:login', () => {
  if (!KINDE_DOMAIN || !KINDE_CLIENT_ID) {
    console.error('Missing KINDE_DOMAIN or KINDE_CLIENT_ID')
    return
  }
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const state = generateState()
  pendingVerifier = verifier
  pendingState = state
  shell.openExternal(buildAuthUrl(KINDE_DOMAIN, KINDE_CLIENT_ID, state, challenge))
})

ipcMain.on('auth:logout', () => {
  clearAuth()
  signalingDestroy?.()
  signalingDestroy = null
  mainWindow?.webContents.send('auth:updated', { isAuthenticated: false })
})

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 380,
    height: 560,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    title: 'VideoCall',
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  mainWindow = createWindow()

  // Si déjà authentifié, connecte le signaling
  if (getAuth()) initSignaling()

  // Windows : deep link au démarrage via argv
  const startUrl = process.argv.find((arg) => arg.startsWith('videocall://'))
  if (startUrl) handleDeepLink(startUrl)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => signalingDestroy?.())
