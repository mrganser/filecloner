import { contextBridge, ipcRenderer } from 'electron'
import fs from 'fs'
import path from 'path'

export interface ElectronAPI {
  openFileDialog: () => Promise<string[] | null>
  openDirectoryDialog: () => Promise<string | null>
  readFile: (filePath: string) => Buffer
  writeFile: (filePath: string, data: Buffer) => void
  fileExists: (filePath: string) => boolean
  getBasename: (filePath: string) => string
  getExtname: (filePath: string) => string
  resolvePath: (...args: string[]) => string
}

const electronAPI: ElectronAPI = {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  readFile: (filePath: string) => fs.readFileSync(filePath),
  writeFile: (filePath: string, data: Buffer) => fs.writeFileSync(filePath, data),
  fileExists: (filePath: string) => fs.existsSync(filePath),
  getBasename: (filePath: string) => path.basename(filePath),
  getExtname: (filePath: string) => path.extname(filePath),
  resolvePath: (...args: string[]) => path.resolve(...args),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
