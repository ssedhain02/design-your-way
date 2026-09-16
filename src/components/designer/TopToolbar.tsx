import { Columns2, Info, Monitor, Redo2, Scissors, Undo2 } from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const layoutOptions = [
  { id: 'split' as const, label: 'Split', icon: Columns2 },
  { id: 'design' as const, label: 'Design', icon: Scissors },
  { id: 'mockup' as const, label: '3D', icon: Monitor },
];

export default function TopToolbar() {
  const { layout, setLayout, undo, redo, canUndo, canRedo } = useDesignerStore();

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Info" aria-label="Designer information">
          <Info className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo()}
          className={cn('h-8 w-8 text-muted-foreground', !canUndo() && 'opacity-30 cursor-not-allowed')}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo()}
          className={cn('h-8 w-8 text-muted-foreground', !canRedo() && 'opacity-30 cursor-not-allowed')}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-md bg-muted p-0.5" aria-label="Designer layout">
          {layoutOptions.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => setLayout(id)}
              className={cn(
                'h-8 rounded px-2.5 text-xs sm:px-3',
                layout === id ? 'bg-background text-foreground shadow-sm hover:bg-background' : 'text-muted-foreground'
              )}
              aria-pressed={layout === id}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className={id === 'split' ? 'hidden sm:inline' : ''}>{label}</span>
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="ml-1 h-8 w-8 text-muted-foreground" title="Product options" aria-label="Product options">
          <Scissors className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
