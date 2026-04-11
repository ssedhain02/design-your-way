import { useRef, useState, useCallback, useEffect } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import GarmentSVG from './GarmentSVG';
import DesignElementComponent from './DesignElement';
import { GarmentView } from '@/types/designer';

const DESIGN_BOUNDS: Record<GarmentView, { x: number; y: number; w: number; h: number }> = {
  front: { x: 30, y: 22, w: 40, h: 50 },
  back: { x: 30, y: 20, w: 40, h: 52 },
  'sleeve-right': { x: 25, y: 15, w: 50, h: 45 },
  'sleeve-left': { x: 25, y: 15, w: 50, h: 45 },
  'neck-label': { x: 28, y: 22, w: 44, h: 55 },
};

export default function DesignCanvas() {
  const {
    activeView, elements, selectedElementId, selectElement, zoom, mode, garmentColor,
    updateElement, removeElement, undo, redo, duplicateElement, copyElement, pasteElement,
  } = useDesignerStore();

  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string; handle: string; startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
  } | null>(null);
  const [showCenterGuides, setShowCenterGuides] = useState<{ h: boolean; v: boolean }>({ h: false, v: false });

  const viewElements = elements.filter((el) => el.view === activeView);
  const bounds = DESIGN_BOUNDS[activeView];
  const scale = zoom / 100;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) { removeElement(selectedElementId); e.preventDefault(); }
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        if (e.key === 'c') { e.preventDefault(); copyElement(); }
        if (e.key === 'v') { e.preventDefault(); pasteElement(); }
        if (e.key === 'd') { e.preventDefault(); if (selectedElementId) duplicateElement(selectedElementId); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElementId, removeElement, undo, redo, copyElement, pasteElement, duplicateElement]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.garment-svg')) {
      selectElement(null);
    }
  };

  const handleMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectElement(id);
      const el = elements.find((el) => el.id === id);
      if (!el) return;
      setDragging({ id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
    },
    [elements, selectElement]
  );

  const handleResizeStart = useCallback(
    (id: string, handle: string, e: React.MouseEvent) => {
      const el = elements.find((el) => el.id === id);
      if (!el) return;
      setResizing({
        id, handle, startX: e.clientX, startY: e.clientY,
        origX: el.x, origY: el.y, origW: el.width, origH: el.height,
      });
    },
    [elements]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        const newX = dragging.origX + dx;
        const newY = dragging.origY + dy;

        // Snap to center guides
        const el = elements.find((el) => el.id === dragging.id);
        if (el) {
          const areaW = 200; const areaH = 290;
          const centerX = (areaW - el.width) / 2;
          const centerY = (areaH - el.height) / 2;
          const snapThreshold = 5;
          const snappedX = Math.abs(newX - centerX) < snapThreshold ? centerX : newX;
          const snappedY = Math.abs(newY - centerY) < snapThreshold ? centerY : newY;
          setShowCenterGuides({
            h: Math.abs(newX - centerX) < snapThreshold,
            v: Math.abs(newY - centerY) < snapThreshold,
          });
          updateElement(dragging.id, { x: snappedX, y: snappedY });
          return;
        }
        updateElement(dragging.id, { x: newX, y: newY });
      }

      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        let { origX: x, origY: y, origW: w, origH: h } = resizing;

        const handle = resizing.handle;
        if (handle.includes('e')) w = Math.max(20, w + dx);
        if (handle.includes('w')) { w = Math.max(20, w - dx); x = x + (resizing.origW - Math.max(20, w - dx + dx)); x = resizing.origX + dx; if (w <= 20) x = resizing.origX + resizing.origW - 20; }
        if (handle.includes('s')) h = Math.max(20, h + dy);
        if (handle.includes('n')) { h = Math.max(20, h - dy); y = resizing.origY + dy; if (h <= 20) y = resizing.origY + resizing.origH - 20; }

        // Simplified resize
        const updates: Record<string, number> = {};
        if (handle.includes('e')) { updates.width = Math.max(20, resizing.origW + dx); }
        if (handle.includes('w')) {
          const newW = Math.max(20, resizing.origW - dx);
          updates.width = newW;
          updates.x = resizing.origX + resizing.origW - newW;
        }
        if (handle.includes('s')) { updates.height = Math.max(20, resizing.origH + dy); }
        if (handle.includes('n')) {
          const newH = Math.max(20, resizing.origH - dy);
          updates.height = newH;
          updates.y = resizing.origY + resizing.origH - newH;
        }

        updateElement(resizing.id, updates);
      }
    },
    [dragging, resizing, scale, updateElement, elements]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setShowCenterGuides({ h: false, v: false });
  }, []);

  return (
    <div
      className="flex-1 flex items-center justify-center bg-canvas overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <div
        className="relative"
        style={{
          width: 500, height: 580,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="garment-svg absolute inset-0 pointer-events-none">
          <GarmentSVG view={activeView} color={garmentColor} />
        </div>

        {mode === 'edit' && (
          <div
            className="design-area absolute pointer-events-none"
            style={{ left: `${bounds.x}%`, top: `${bounds.y}%`, width: `${bounds.w}%`, height: `${bounds.h}%` }}
          />
        )}

        {/* Center guides */}
        {mode === 'edit' && (showCenterGuides.h || showCenterGuides.v) && (
          <div
            className="absolute pointer-events-none"
            style={{ left: `${bounds.x}%`, top: `${bounds.y}%`, width: `${bounds.w}%`, height: `${bounds.h}%` }}
          >
            {showCenterGuides.h && (
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/60" />
            )}
            {showCenterGuides.v && (
              <div className="absolute left-0 right-0 top-1/2 h-px bg-primary/60" />
            )}
          </div>
        )}

        <div
          className="absolute"
          style={{ left: `${bounds.x}%`, top: `${bounds.y}%`, width: `${bounds.w}%`, height: `${bounds.h}%` }}
        >
          {viewElements.map((el) => (
            <DesignElementComponent
              key={el.id}
              element={el}
              isSelected={el.id === selectedElementId}
              onMouseDown={(e) => handleMouseDown(el.id, e)}
              onResize={handleResizeStart}
              isPreview={mode === 'preview'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
