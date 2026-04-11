import { GARMENT_VIEWS } from '@/types/designer';
import { useDesignerStore } from '@/store/designerStore';
import { cn } from '@/lib/utils';

export default function ViewTabs() {
  const { activeView, setActiveView } = useDesignerStore();

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {GARMENT_VIEWS.map((view) => (
        <button
          key={view.id}
          onClick={() => setActiveView(view.id)}
          className={cn(
            'px-5 py-2 text-sm font-medium rounded-full border transition-colors',
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
