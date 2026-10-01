import { Minus, Plus, Hand } from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';
import { Button } from '@/components/ui/button';

export default function ZoomControls() {
  const { zoom, setZoom } = useDesignerStore();

  return (
    <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-background px-1 md:gap-1 md:px-2 md:py-1">
      <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 10)} className="h-7 w-7 text-muted-foreground" aria-label="Zoom out">
        <Minus className="w-4 h-4" />
      </Button>
      <select
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-12 cursor-pointer appearance-none bg-transparent text-center text-xs text-foreground md:w-14 md:text-sm"
      >
        {[10, 25, 50, 75, 100, 125, 150, 200].map((v) => (
          <option key={v} value={v}>{v}%</option>
        ))}
      </select>
      <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 10)} className="h-7 w-7 text-muted-foreground" aria-label="Zoom in">
        <Plus className="w-4 h-4" />
      </Button>
      <div className="mx-0.5 h-5 w-px bg-border md:mx-1" />
      <Button variant="ghost" size="icon" className="hidden h-7 w-7 text-muted-foreground min-[360px]:inline-flex" aria-label="Pan canvas">
        <Hand className="w-4 h-4" />
      </Button>
    </div>
  );
}
