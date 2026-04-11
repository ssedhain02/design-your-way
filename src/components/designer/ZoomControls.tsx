import { Minus, Plus, Hand } from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';

export default function ZoomControls() {
  const { zoom, setZoom } = useDesignerStore();

  return (
    <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1">
      <button onClick={() => setZoom(zoom - 10)} className="p-1 rounded hover:bg-accent text-muted-foreground">
        <Minus className="w-4 h-4" />
      </button>
      <select
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="text-sm bg-transparent text-foreground w-14 text-center appearance-none cursor-pointer"
      >
        {[10, 25, 50, 75, 100, 125, 150, 200].map((v) => (
          <option key={v} value={v}>{v}%</option>
        ))}
      </select>
      <button onClick={() => setZoom(zoom + 10)} className="p-1 rounded hover:bg-accent text-muted-foreground">
        <Plus className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      <button className="p-1 rounded hover:bg-accent text-muted-foreground">
        <Hand className="w-4 h-4" />
      </button>
    </div>
  );
}
