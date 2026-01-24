import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock the electron API
const mockElectronAPI = {
  openFileDialog: vi.fn(),
  openDirectoryDialog: vi.fn(),
  readFile: vi.fn((path: string) => Buffer.from(`content of ${path}`)),
  writeFile: vi.fn(),
  fileExists: vi.fn(() => true),
  getBasename: vi.fn((path: string) => path.split('/').pop() || path),
  getExtname: vi.fn((path: string) => {
    const match = path.match(/\.[^.]+$/)
    return match ? match[0] : ''
  }),
  resolvePath: vi.fn((...paths: string[]) => paths.join('/')),
}

window.electronAPI = mockElectronAPI

// Export for use in tests
export { mockElectronAPI }
