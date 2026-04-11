import { Info, Undo2, Redo2, Scissors } from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';
import { cn } from '@/lib/utils';

export default function TopToolbar() {
  const { mode, setMode, undo, redo, canUndo, canRedo } = useDesignerStore();

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Info">
          <Info className="w-4 h-4" />
        </button>
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={cn('p-2 rounded-lg hover:bg-accent text-muted-foreground', !canUndo() && 'opacity-30 cursor-not-allowed')}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={cn('p-2 rounded-lg hover:bg-accent text-muted-foreground', !canRedo() && 'opacity-30 cursor-not-allowed')}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-0">
        <button
          onClick={() => setMode('edit')}
          className={cn(
            'px-6 py-2 text-sm font-medium rounded-l-full transition-colors',
            mode === 'edit'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          Edit
        </button>
        <button
          onClick={() => setMode('preview')}
          className={cn(
            'px-6 py-2 text-sm font-medium rounded-r-full transition-colors',
            mode === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          Preview
        </button>
        <button className="ml-3 p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Product options">
          <Scissors className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
