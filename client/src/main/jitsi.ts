import { WebContentsView, BrowserWindow, session } from 'electron'

const CALL_WIDTH = 900
const CALL_HEIGHT = 600
const CONTROLS_HEIGHT = 60

function grantMediaPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    callback(['media', 'audioCapture', 'videoCapture', 'display-capture'].includes(permission))
  })
  session.defaultSession.setPermissionCheckHandler((_, permission) => {
    return ['media', 'audioCapture', 'videoCapture', 'display-capture'].includes(permission)
  })
}

export function createJitsiView(
  mainWindow: BrowserWindow,
  roomId: string,
  displayName: string
): WebContentsView {
  grantMediaPermissions()

  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.contentView.addChildView(view)

  mainWindow.setResizable(true)
  mainWindow.setSize(CALL_WIDTH, CALL_HEIGHT)
  mainWindow.center()
  mainWindow.setResizable(false)

  view.setBounds({
    x: 0,
    y: 0,
    width: CALL_WIDTH,
    height: CALL_HEIGHT - CONTROLS_HEIGHT,
  })

  const url =
    `https://meet.jit.si/${roomId}` +
    `#config.prejoinPageEnabled=false` +
    `&config.disableDeepLinking=true` +
    `&userInfo.displayName=${encodeURIComponent(displayName)}`

  view.webContents.loadURL(url)

  return view
}

export function destroyJitsiView(mainWindow: BrowserWindow, view: WebContentsView): void {
  // Libère caméra/micro avant de détacher la vue
  view.webContents.loadURL('about:blank')
  mainWindow.contentView.removeChildView(view)

  mainWindow.setResizable(true)
  mainWindow.setSize(380, 560)
  mainWindow.center()
  mainWindow.setResizable(false)
}
