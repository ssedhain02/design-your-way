import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolSidebar from '@/components/designer/ToolSidebar';
import ToolPanel from '@/components/designer/ToolPanel';
import TopToolbar from '@/components/designer/TopToolbar';
import DesignCanvas from '@/components/designer/DesignCanvas';
import ViewTabs from '@/components/designer/ViewTabs';
import ZoomControls from '@/components/designer/ZoomControls';
import SaveProductDialog from '@/components/designer/SaveProductDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDesignerStore } from '@/store/designerStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const MockupPanel = lazy(() => import('@/components/designer/MockupPanel'));

export default function Index() {
  const [saveOpen, setSaveOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { layout, setLayout, selectedProduct, selectedSize, setSelectedSize, setGarmentColor } = useDesignerStore();

  useEffect(() => {
    if (isMobile && layout === 'split') setLayout('design');
  }, [isMobile, layout, setLayout]);

  const handleSaveClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaveOpen(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopToolbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={cn('flex min-w-0', layout === 'mockup' && 'hidden')}>
          <ToolSidebar />
          <ToolPanel />
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            {!isMobile && layout === 'split' ? (
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={54} minSize={34}>
                  <div className="flex h-full min-w-0 flex-col">
                    <DesignCanvas />
                    <div className="shrink-0 border-t border-border bg-canvas py-3"><ViewTabs /></div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={46} minSize={30}>
                  <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Loading 3D preview...</div>}>
                    <MockupPanel className="h-full" />
                  </Suspense>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="relative h-full">
                <div className={cn('h-full flex-col', layout === 'mockup' ? 'hidden' : 'flex')}>
                  <DesignCanvas />
                  <div className="shrink-0 border-t border-border bg-canvas py-3"><ViewTabs /></div>
                </div>
                <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Loading 3D preview...</div>}>
                  <MockupPanel className={cn('h-full', layout === 'mockup' ? 'flex' : 'hidden')} />
                </Suspense>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background gap-3">
            <div className={layout === 'mockup' ? 'invisible' : ''}><ZoomControls /></div>

            {/* Product info & size selector */}
            {selectedProduct && (
              <div className="flex items-center gap-3">
                {/* Color swatches from selected product */}
                <div className="flex items-center gap-1">
                  {selectedProduct.colors.map((c, i) => (
                    <button
                      key={i}
                      className="w-5 h-5 rounded-full border border-border hover:ring-2 ring-primary transition-all"
                      style={{ backgroundColor: c }}
                      onClick={() => setGarmentColor(c)}
                      title={c}
                    />
                  ))}
                </div>

                {selectedProduct.sizes.length > 0 && (
                  <Select value={selectedSize || ''} onValueChange={setSelectedSize}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.sizes.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <span className="text-sm font-medium">${selectedProduct.basePrice.toFixed(2)}</span>
              </div>
            )}

            <Button
              variant="outline"
              className="shrink-0"
              onClick={handleSaveClick}
            >
              Save / Add to Cart
            </Button>
          </div>
        </div>
      </div>

      <SaveProductDialog open={saveOpen} onOpenChange={setSaveOpen} />
    </div>
  );
}
