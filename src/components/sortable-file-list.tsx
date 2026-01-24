import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, File, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableItemProps {
  id: string
  index: number
  onRemove: (id: string) => void
}

function SortableItem({ id, index, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const filename = window.electronAPI.getBasename(id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-card/80 p-3 transition-all duration-200',
        isDragging
          ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]'
          : 'border-border hover:border-primary/30 hover:bg-muted/30'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-primary active:cursor-grabbing transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium" title={filename}>
          {filename}
        </span>
        <span className="block truncate text-xs text-muted-foreground" title={id}>
          {id.length > 50 ? '...' + id.slice(-47) : id}
        </span>
      </div>
      <span className="text-xs text-muted-foreground/60 font-mono">#{index + 1}</span>
      <button
        onClick={() => onRemove(id)}
        className="opacity-0 transition-all duration-200 group-hover:opacity-100 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface SortableFileListProps {
  files: string[]
  onReorder: (files: string[]) => void
  onRemove: (id: string) => void
}

export function SortableFileList({ files, onReorder, onRemove }: SortableFileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = files.indexOf(active.id as string)
      const newIndex = files.indexOf(over.id as string)
      onReorder(arrayMove(files, oldIndex, newIndex))
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          <File className="h-5 w-5" />
        </div>
        <p className="text-sm">No files selected</p>
        <p className="text-xs text-muted-foreground/60">Click "Select Files" to get started</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col rounded-lg border border-border/50 bg-background/30 p-2 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto max-h-64">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={files} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {files.map((file, index) => (
                <SortableItem key={file} id={file} index={index} onRemove={onRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <div className="pt-2 border-t border-border/30 text-center shrink-0">
        <span className="text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''} selected
        </span>
      </div>
    </div>
  )
}
