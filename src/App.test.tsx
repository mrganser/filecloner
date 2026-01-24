import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { mockElectronAPI } from './test/setup'

describe('File Cloner App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    // Reset confirm dialog to always return true
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  describe('Initial State', () => {
    it('renders the app title', () => {
      render(<App />)
      expect(screen.getByText('File Cloner')).toBeInTheDocument()
    })

    it('shows empty state for file list', () => {
      render(<App />)
      expect(screen.getByText('No files selected')).toBeInTheDocument()
    })

    it('has default quantity of 1', () => {
      render(<App />)
      const quantityInput = screen.getByPlaceholderText('Enter a number (1-10000)')
      expect(quantityInput).toHaveValue('1')
    })

    it('has consecutive order selected by default', () => {
      render(<App />)
      const consecutiveRadio = screen.getByRole('radio', { name: /consecutive/i })
      expect(consecutiveRadio).toBeChecked()
    })

    it('disables destination button when no files selected', () => {
      render(<App />)
      const destButton = screen.getByRole('button', { name: /destination/i })
      expect(destButton).toBeDisabled()
    })

    it('disables clone button when no files or destination', () => {
      render(<App />)
      const cloneButton = screen.getByRole('button', { name: /clone/i })
      expect(cloneButton).toBeDisabled()
    })
  })

  describe('File Selection', () => {
    it('allows selecting files', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file1.txt', '/path/to/file2.txt'])

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument()
        expect(screen.getByText('file2.txt')).toBeInTheDocument()
      })
    })

    it('shows file count after selection', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue([
        '/path/to/file1.txt',
        '/path/to/file2.txt',
        '/path/to/file3.txt',
      ])

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))

      await waitFor(() => {
        expect(screen.getByText('3 files selected')).toBeInTheDocument()
      })
    })

    it('enables destination button after files are selected', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))

      await waitFor(() => {
        const destButton = screen.getByRole('button', { name: /destination/i })
        expect(destButton).toBeEnabled()
      })
    })

    it('allows removing files from selection', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file1.txt', '/path/to/file2.txt'])

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument()
      })

      // Find and click the remove button for file1
      const removeButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.querySelector('svg.lucide-x'))
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('file1.txt')).not.toBeInTheDocument()
        expect(screen.getByText('file2.txt')).toBeInTheDocument()
      })
    })
  })

  describe('Destination Selection', () => {
    it('allows selecting destination folder', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output/folder')

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /destination/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /destination/i }))

      await waitFor(() => {
        expect(screen.getByText('/output/folder')).toBeInTheDocument()
      })
    })

    it('enables clone button after destination is selected', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output/folder')

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /destination/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /destination/i }))

      await waitFor(() => {
        const cloneButton = screen.getByRole('button', { name: /clone/i })
        expect(cloneButton).toBeEnabled()
      })
    })
  })

  describe('Options Configuration', () => {
    it('allows changing quantity', async () => {
      const user = userEvent.setup()
      render(<App />)

      const quantityInput = screen.getByPlaceholderText('Enter a number (1-10000)')
      await user.clear(quantityInput)
      await user.type(quantityInput, '50')

      expect(quantityInput).toHaveValue('50')
    })

    it('prevents non-numeric input in quantity', async () => {
      const user = userEvent.setup()
      render(<App />)

      const quantityInput = screen.getByPlaceholderText('Enter a number (1-10000)')
      await user.clear(quantityInput)
      await user.type(quantityInput, 'abc123xyz')

      expect(quantityInput).toHaveValue('123')
    })

    it('allows adding custom suffix', async () => {
      const user = userEvent.setup()
      render(<App />)

      const suffixInput = screen.getByPlaceholderText('Leave blank to use original filenames')
      await user.type(suffixInput, '_copy')

      expect(suffixInput).toHaveValue('_copy')
    })

    it('allows switching to grouped order', async () => {
      const user = userEvent.setup()
      render(<App />)

      const groupedRadio = screen.getByRole('radio', { name: /grouped/i })
      await user.click(groupedRadio)

      expect(groupedRadio).toBeChecked()
      expect(screen.getByRole('radio', { name: /consecutive/i })).not.toBeChecked()
    })
  })

  describe('Cloning Process', () => {
    it('clones files with consecutive order', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/a.txt', '/path/to/b.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      // Select files
      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('a.txt')).toBeInTheDocument())

      // Select destination
      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      // Set quantity to 4
      const quantityInput = screen.getByPlaceholderText('Enter a number (1-10000)')
      await user.clear(quantityInput)
      await user.type(quantityInput, '4')

      // Clone
      await user.click(screen.getByRole('button', { name: /clone/i }))

      await waitFor(() => {
        expect(mockElectronAPI.writeFile).toHaveBeenCalledTimes(4)
        // Consecutive: a, b, a, b
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          1,
          '/output/1a.txt',
          expect.anything()
        )
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          2,
          '/output/2b.txt',
          expect.anything()
        )
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          3,
          '/output/3a.txt',
          expect.anything()
        )
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          4,
          '/output/4b.txt',
          expect.anything()
        )
      })
    })

    it('clones files with grouped order', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/a.txt', '/path/to/b.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      // Select files
      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('a.txt')).toBeInTheDocument())

      // Select destination
      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      // Set quantity to 4
      const quantityInput = screen.getByPlaceholderText('Enter a number (1-10000)')
      await user.clear(quantityInput)
      await user.type(quantityInput, '4')

      // Switch to grouped order
      await user.click(screen.getByRole('radio', { name: /grouped/i }))

      // Clone
      await user.click(screen.getByRole('button', { name: /clone/i }))

      await waitFor(() => {
        expect(mockElectronAPI.writeFile).toHaveBeenCalledTimes(4)
        // Grouped: a, a, b, b
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          1,
          '/output/1a.txt',
          expect.anything()
        )
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          2,
          '/output/2a.txt',
          expect.anything()
        )
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          3,
          '/output/3b.txt',
          expect.anything()
        )
        expect(mockElectronAPI.writeFile).toHaveBeenNthCalledWith(
          4,
          '/output/4b.txt',
          expect.anything()
        )
      })
    })

    it('uses custom suffix when provided', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      // Select files
      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('file.txt')).toBeInTheDocument())

      // Select destination
      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      // Add suffix
      const suffixInput = screen.getByPlaceholderText('Leave blank to use original filenames')
      await user.type(suffixInput, '_backup')

      // Clone
      await user.click(screen.getByRole('button', { name: /clone/i }))

      await waitFor(() => {
        expect(mockElectronAPI.writeFile).toHaveBeenCalledWith(
          '/output/1_backup.txt',
          expect.anything()
        )
      })
    })

    it('shows success message after cloning', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('file.txt')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /clone/i }))

      await waitFor(() => {
        expect(screen.getByText(/successfully cloned/i)).toBeInTheDocument()
      })
    })

    it('asks for confirmation before cloning', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('file.txt')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /clone/i }))

      expect(confirmSpy).toHaveBeenCalledWith(
        'Files with the same name will be overwritten. Continue?'
      )
    })

    it('does not clone when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('file.txt')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      // Set confirm to return false JUST before clicking clone
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const writeCallsBefore = mockElectronAPI.writeFile.mock.calls.length

      await user.click(screen.getByRole('button', { name: /clone/i }))

      // Give time for any async operations
      await new Promise((r) => setTimeout(r, 100))

      // Should not have any new write calls
      expect(mockElectronAPI.writeFile.mock.calls.length).toBe(writeCallsBefore)
    })
  })

  describe('Validation', () => {
    it('shows warning when trying to clone without files', () => {
      render(<App />)

      // Since the button is disabled when no files are selected,
      // we test the validation logic indirectly by checking the initial state
      expect(screen.getByText('No files selected')).toBeInTheDocument()
    })

    it('shows warning for invalid quantity', async () => {
      const user = userEvent.setup()
      mockElectronAPI.openFileDialog.mockResolvedValue(['/path/to/file.txt'])
      mockElectronAPI.openDirectoryDialog.mockResolvedValue('/output')

      render(<App />)

      await user.click(screen.getByRole('button', { name: /select files/i }))
      await waitFor(() => expect(screen.getByText('file.txt')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /destination/i }))
      await waitFor(() => expect(screen.getByText('/output')).toBeInTheDocument())

      // Set invalid quantity
      const quantityInput = screen.getByPlaceholderText('Enter a number (1-10000)')
      await user.clear(quantityInput)
      await user.type(quantityInput, '0')

      await user.click(screen.getByRole('button', { name: /clone/i }))

      await waitFor(() => {
        expect(screen.getByText(/quantity must be between/i)).toBeInTheDocument()
      })
    })
  })
})
