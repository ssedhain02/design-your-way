import { useState, lazy, Suspense } from 'react';
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

const MannequinPreview = lazy(() => import('@/components/designer/MannequinPreview'));

export default function Index() {
  const [saveOpen, setSaveOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mode, selectedProduct, selectedSize, setSelectedSize, setGarmentColor } = useDesignerStore();

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

      <div className="flex flex-1 overflow-hidden">
        <ToolSidebar />

        <ToolPanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'preview' ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">Loading 3D preview...</div>}>
              <MannequinPreview />
            </Suspense>
          ) : (
            <DesignCanvas />
          )}

          <div className="py-3 bg-canvas border-t border-border">
            <ViewTabs />
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background gap-3">
            <ZoomControls />

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

            <button
              className="px-8 py-2 text-sm font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={handleSaveClick}
            >
              Save / Add to Cart
            </button>
          </div>
        </div>
      </div>

      <SaveProductDialog open={saveOpen} onOpenChange={setSaveOpen} />
    </div>
  );
}
