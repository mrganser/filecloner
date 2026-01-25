import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'

// Electron Forge Vite plugin globals
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

let mainWindow: BrowserWindow | null = null

function createWindow() {
  // Icon path for development (in production, macOS uses the bundled .icns from Resources)
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'src/assets/icons/icon.png')
    : path.join(__dirname, '../../src/assets/icons/icon.png')

  mainWindow = new BrowserWindow({
    title: 'File Cloner',
    width: 1024,
    height: 850,
    minWidth: 600,
    minHeight: 500,
    backgroundColor: '#09090b',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Set dock icon on macOS during development (in production, macOS uses the bundled icon)
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL && process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(iconPath)
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  // Error handling for debugging
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  })
  return result.canceled ? null : result.filePaths
})

ipcMain.handle('open-directory-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
})
