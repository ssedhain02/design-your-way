import { Button } from '@/components/ui/button';

export default function BottomBar() {
  return (
    <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-background">
      <Button variant="outline" className="px-8 text-sm font-medium">
        Save product
      </Button>
    </div>
  );
}
