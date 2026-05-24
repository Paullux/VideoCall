import { BrowserWindow, session } from 'electron'

function grantMediaPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    callback(['media', 'audioCapture', 'videoCapture', 'display-capture'].includes(permission))
  })
  session.defaultSession.setPermissionCheckHandler((_, permission) => {
    return ['media', 'audioCapture', 'videoCapture', 'display-capture'].includes(permission)
  })
}

export function createJitsiWindow(roomId: string, displayName: string): BrowserWindow {
  grantMediaPermissions()

  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    minWidth: 640,
    minHeight: 480,
    resizable: true,
    title: 'VideoCall — En appel',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const url =
    `https://meet.jit.si/${roomId}` +
    `#config.prejoinPageEnabled=false` +
    `&config.disableDeepLinking=true` +
    `&userInfo.displayName=${encodeURIComponent(displayName)}`

  win.loadURL(url)

  return win
}

export function destroyJitsiWindow(win: BrowserWindow): void {
  win.loadURL('about:blank')
  win.close()
}
