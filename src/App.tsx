import { useState, useCallback } from 'react'
import {
  Files,
  FolderOpen,
  Copy,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SortableFileList } from '@/components/sortable-file-list'
import { cn } from '@/lib/utils'

type MessageType = 'info' | 'success' | 'warning' | 'error'

interface Message {
  text: string
  type: MessageType
}

const messageStyles: Record<MessageType, { bg: string; icon: typeof Info }> = {
  info: { bg: 'bg-primary/10 text-primary border-primary/20', icon: Info },
  success: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  warning: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  error: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
}

export default function App() {
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [destinationFolder, setDestinationFolder] = useState('')
  const [message, setMessage] = useState<Message | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [suffix, setSuffix] = useState('')
  const [order, setOrder] = useState<'consecutive' | 'grouped'>('consecutive')
  const [loading, setLoading] = useState(false)

  const handleSelectFiles = useCallback(async () => {
    const files = await window.electronAPI.openFileDialog()
    if (files) {
      setFilePaths(files)
      setMessage({ text: `${files.length} file(s) selected`, type: 'info' })
    }
  }, [])

  const handleSelectDestination = useCallback(async () => {
    const directory = await window.electronAPI.openDirectoryDialog()
    if (directory) {
      setDestinationFolder(directory)
      setMessage({ text: 'Destination folder selected', type: 'info' })
    }
  }, [])

  const handleRemoveFile = useCallback((id: string) => {
    setFilePaths((prev) => prev.filter((f) => f !== id))
  }, [])

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 10000)) {
      setQuantity(value)
    }
  }, [])

  const cloneFiles = useCallback(async () => {
    if (!filePaths.length) {
      return setMessage({ text: 'Please select files to clone', type: 'warning' })
    }
    if (!destinationFolder || !window.electronAPI.fileExists(destinationFolder)) {
      return setMessage({ text: 'Please select a valid destination folder', type: 'warning' })
    }
    const qty = parseInt(quantity) || 0
    if (qty < 1 || qty > 10000) {
      return setMessage({ text: 'Quantity must be between 1 and 10,000', type: 'warning' })
    }

    if (!confirm('Files with the same name will be overwritten. Continue?')) {
      return
    }

    setLoading(true)
    setMessage(null)

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const files = filePaths.map((filePath) => ({
          data: window.electronAPI.readFile(filePath),
          filename: window.electronAPI.getBasename(filePath),
        }))

        for (let i = 1; i <= qty; i++) {
          const prefix = String(i).padStart(qty.toString().length, '0')
          const index =
            order === 'consecutive'
              ? (i - 1) % files.length
              : Math.floor((i - 1) / Math.ceil(qty / files.length))

          const finalSuffix = suffix
            ? suffix + window.electronAPI.getExtname(files[index].filename)
            : files[index].filename

          window.electronAPI.writeFile(
            window.electronAPI.resolvePath(destinationFolder, `${prefix}${finalSuffix}`),
            files[index].data
          )
        }

        setMessage({ text: `Successfully cloned ${qty} file(s)!`, type: 'success' })
      } catch (err) {
        setMessage({
          text: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'error',
        })
      } finally {
        setLoading(false)
      }
    }, 50)
  }, [filePaths, destinationFolder, quantity, order, suffix])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Loader2 className="relative h-16 w-16 spinner-glow text-primary" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-medium text-gradient">Cloning files...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 pt-4">
      {/* Drag region for window movement */}
      <div className="drag-region h-8 -mx-8 -mt-4 mb-4" />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-3 text-center animate-fade-in">
          <h1 className="text-4xl title-display text-gradient flex items-center justify-center gap-3">
            <Copy className="h-9 w-9 text-primary" />
            File Cloner
          </h1>
          <p className="text-muted-foreground text-sm">
            Duplicate your files with custom ordering and naming
          </p>
        </div>

        {/* Cards Row */}
        <div className="flex gap-6">
          {/* Options Card */}
          <Card className="card-shine border-gradient animate-fade-in-delay-1 flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Options
              </CardTitle>
              <CardDescription>Configure how your files will be cloned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Number of output files
                </Label>
                <Input
                  id="quantity"
                  type="text"
                  value={quantity}
                  onChange={handleQuantityChange}
                  placeholder="Enter a number (1-10000)"
                  className="max-w-[200px] bg-background/50"
                />
              </div>

              {/* Suffix */}
              <div className="space-y-2">
                <Label htmlFor="suffix" className="text-sm font-medium">
                  Custom suffix{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="suffix"
                  type="text"
                  maxLength={40}
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="Leave blank to use original filenames"
                  className="max-w-[300px] bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Files will be named:{' '}
                  <code className="px-1.5 py-0.5 rounded bg-muted text-primary/80">
                    001{suffix || 'filename'}.ext
                  </code>
                  ,{' '}
                  <code className="px-1.5 py-0.5 rounded bg-muted text-primary/80">
                    002{suffix || 'filename'}.ext
                  </code>
                  , ...
                </p>
              </div>

              {/* Order */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Clone order</Label>
                <RadioGroup
                  value={order}
                  onValueChange={(value) => setOrder(value as 'consecutive' | 'grouped')}
                  className="flex gap-4"
                >
                  <label
                    htmlFor="consecutive"
                    className={cn(
                      'flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      order === 'consecutive'
                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    )}
                  >
                    <RadioGroupItem value="consecutive" id="consecutive" />
                    <div>
                      <div className="font-medium text-sm">Consecutive</div>
                      <div className="text-xs text-muted-foreground">1, 2, 3, 1, 2...</div>
                    </div>
                  </label>
                  <label
                    htmlFor="grouped"
                    className={cn(
                      'flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      order === 'grouped'
                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    )}
                  >
                    <RadioGroupItem value="grouped" id="grouped" />
                    <div>
                      <div className="font-medium text-sm">Grouped</div>
                      <div className="text-xs text-muted-foreground">1, 1, 2, 2, 3...</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Files Card */}
          <Card className="card-shine border-gradient animate-fade-in-delay-2 flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Selected Files
              </CardTitle>
              <CardDescription>
                Drag to reorder. Files will be cloned in this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pb-4">
              <SortableFileList
                files={filePaths}
                onReorder={setFilePaths}
                onRemove={handleRemoveFile}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 animate-fade-in-delay-3">
          <Button
            size="xl"
            variant="outline"
            onClick={handleSelectFiles}
            className="glow-accent-hover transition-smooth"
          >
            <Files className="mr-2 h-5 w-5" />
            Select Files
          </Button>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <Button
            size="xl"
            variant="outline"
            onClick={handleSelectDestination}
            disabled={!filePaths.length}
            className="glow-accent-hover transition-smooth"
          >
            <FolderOpen className="mr-2 h-5 w-5" />
            Destination
          </Button>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <Button
            size="xl"
            variant="success"
            onClick={cloneFiles}
            disabled={!filePaths.length || !destinationFolder}
            className={cn(
              'transition-smooth',
              filePaths.length && destinationFolder && 'glow-accent animate-pulse-glow'
            )}
          >
            <Copy className="mr-2 h-5 w-5" />
            Clone
          </Button>
        </div>

        {/* Destination path display */}
        {destinationFolder && (
          <div className="text-center animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Destination:{' '}
              <code className="px-2 py-1 rounded bg-muted text-foreground/80">
                {destinationFolder}
              </code>
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 animate-fade-in',
              messageStyles[message.type].bg
            )}
          >
            {(() => {
              const Icon = messageStyles[message.type].icon
              return <Icon className="h-5 w-5 shrink-0" />
            })()}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  )
}
