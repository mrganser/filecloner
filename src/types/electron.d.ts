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

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
