import { useRef, useState, useCallback } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import GarmentSVG from './GarmentSVG';
import DesignElementComponent from './DesignElement';
import { GarmentView } from '@/types/designer';

// Design area bounds relative to garment (percentage)
const DESIGN_BOUNDS: Record<GarmentView, { x: number; y: number; w: number; h: number }> = {
  front: { x: 30, y: 22, w: 40, h: 50 },
  back: { x: 30, y: 20, w: 40, h: 52 },
  'sleeve-right': { x: 25, y: 15, w: 50, h: 45 },
  'sleeve-left': { x: 25, y: 15, w: 50, h: 45 },
  'neck-label': { x: 28, y: 22, w: 44, h: 55 },
};

export default function DesignCanvas() {
  const { activeView, elements, selectedElementId, selectElement, zoom, mode, garmentColor, updateElement } =
    useDesignerStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const viewElements = elements.filter((el) => el.view === activeView);
  const bounds = DESIGN_BOUNDS[activeView];
  const scale = zoom / 100;

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;
      updateElement(dragging.id, { x: dragging.origX + dx, y: dragging.origY + dy });
    },
    [dragging, scale, updateElement]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  return (
    <div
      className="flex-1 flex items-center justify-center bg-canvas overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <div
        ref={canvasRef}
        className="relative"
        style={{
          width: 500,
          height: 580,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Garment */}
        <div className="garment-svg absolute inset-0 pointer-events-none">
          <GarmentSVG view={activeView} color={garmentColor} />
        </div>

        {/* Design area overlay */}
        {mode === 'edit' && (
          <div
            className="design-area absolute pointer-events-none"
            style={{
              left: `${bounds.x}%`,
              top: `${bounds.y}%`,
              width: `${bounds.w}%`,
              height: `${bounds.h}%`,
            }}
          />
        )}

        {/* Design elements */}
        <div
          className="absolute"
          style={{
            left: `${bounds.x}%`,
            top: `${bounds.y}%`,
            width: `${bounds.w}%`,
            height: `${bounds.h}%`,
          }}
        >
          {viewElements.map((el) => (
            <DesignElementComponent
              key={el.id}
              element={el}
              isSelected={el.id === selectedElementId}
              onMouseDown={(e) => handleMouseDown(el.id, e)}
              isPreview={mode === 'preview'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
