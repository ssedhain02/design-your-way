import { Upload, Sparkles, Type, FolderOpen, Shapes, LayoutTemplate, Globe, Palette, Layers } from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const tools = [
  { id: 'upload', icon: Upload, label: 'Upload' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
  { id: 'text', icon: Type, label: 'Add text' },
  { id: 'library', icon: FolderOpen, label: 'My library' },
  { id: 'graphics', icon: Shapes, label: 'Graphics' },
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'stock', icon: Globe, label: 'Stock' },
  { id: 'custom', icon: Palette, label: 'Colors' },
  { id: 'layers', icon: Layers, label: 'Layers' },
];

export default function ToolSidebar() {
  const { activeTool, setActiveTool, selectElement } = useDesignerStore();

  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border border-border bg-background/95 py-1.5 shadow-lg backdrop-blur-md no-scrollbar max-md:rounded-xl md:w-[72px] md:rounded-none md:border-y-0 md:border-l-0 md:py-4 md:shadow-none">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon"
            onClick={() => { selectElement(null); setActiveTool(tool.id); }}
            className={cn(
              'h-9 w-9 shrink-0 rounded-lg text-muted-foreground transition-colors md:flex md:h-14 md:w-14 md:flex-col md:gap-1 md:text-[10px]',
              isActive && 'bg-accent text-foreground'
            )}
            title={tool.label}
            aria-label={tool.label}
            aria-pressed={isActive}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden leading-tight text-center md:block">{tool.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
