import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerCaptureHandlers } from './ipc/capture-handlers'
import { registerSessionHandlers } from './ipc/session-handlers'

// Force legacy GDI/DirectX to prevent WGC native crash loops
app.commandLine.appendSwitch('disable-features', 'WinrtScreenCapture')

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled Rejection:', reason)
})

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#121315',
    title: 'Zenier Desktop Recorder',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#121315',
      symbolColor: '#e3e2e3',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  })

  // Enforce strict CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const devCsp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: mediastream:; connect-src 'self' ws://localhost:* http://localhost:*;"
    const prodCsp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: mediastream:; connect-src 'self';"
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [is.dev ? devCsp : prodCsp]
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
    console.log('[Main] Window ready-to-show.')
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.webContents.send('app:shutdown-requested')
    setTimeout(() => { mainWindow.destroy() }, 3000)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.zenier.recorder')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register global permission handler safely in app.whenReady
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'display-capture', 'audioCapture', 'videoCapture']
    callback(allowed.includes(permission))
  })

  registerCaptureHandlers()
  const mainWindow = createWindow()
  registerSessionHandlers(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
