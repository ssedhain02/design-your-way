import { Upload, Sparkles, Type, FolderOpen, Shapes, LayoutTemplate, Globe, PenTool } from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'upload', icon: Upload, label: 'Upload' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
  { id: 'text', icon: Type, label: 'Add text' },
  { id: 'library', icon: FolderOpen, label: 'My library' },
  { id: 'graphics', icon: Shapes, label: 'Graphics' },
  { id: 'templates', icon: LayoutTemplate, label: 'My templates' },
  { id: 'stock', icon: Globe, label: 'Stock images' },
  { id: 'custom', icon: PenTool, label: 'Custom' },
];

export default function ToolSidebar() {
  const { activeTool, setActiveTool } = useDesignerStore();

  return (
    <div className="flex flex-col items-center w-[72px] border-r border-border bg-background py-4 gap-1 overflow-y-auto no-scrollbar">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(isActive ? null : tool.id)}
            className={cn(
              'flex flex-col items-center justify-center w-14 h-14 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-[10px] gap-1',
              isActive && 'bg-accent text-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="leading-tight text-center">{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}
