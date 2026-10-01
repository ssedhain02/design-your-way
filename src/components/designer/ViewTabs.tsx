import { GARMENT_VIEWS } from '@/types/designer';
import { useDesignerStore } from '@/store/designerStore';
import { cn } from '@/lib/utils';

export default function ViewTabs() {
  const { activeView, setActiveView } = useDesignerStore();

  return (
    <div className="flex items-center justify-start gap-2 overflow-x-auto px-3 no-scrollbar md:flex-wrap md:justify-center md:px-0">
      {GARMENT_VIEWS.map((view) => (
        <button
          key={view.id}
          onClick={() => setActiveView(view.id)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors md:px-5 md:text-sm',
            activeView === view.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:bg-accent'
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
