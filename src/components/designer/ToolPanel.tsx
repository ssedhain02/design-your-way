import { useDesignerStore } from '@/store/designerStore';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Upload, X, Trash2, Type, Bold, Italic, Underline, Copy, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter,
  ArrowUp, ArrowDown, Eye, EyeOff, Layers, MoveUp, MoveDown,
} from 'lucide-react';
import { FONT_OPTIONS, GARMENT_COLORS } from '@/types/designer';

export default function ToolPanel() {
  const store = useDesignerStore();
  const {
    activeTool, setActiveTool, addElement, activeView, selectedElementId, elements,
    updateElement, removeElement, duplicateElement, garmentColor, setGarmentColor,
    moveElementOrder, alignElement,
  } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeTool && !selectedElementId) return null;

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxW = 160;
      const ratio = img.height / img.width;
      addElement({
        id: uuidv4(), type: 'image', x: 10, y: 10, width: maxW, height: maxW * ratio,
        rotation: 0, content: url, view: activeView, opacity: 100, visible: true, name: file.name,
      });
      setActiveTool(null);
    };
    img.src = url;
    e.target.value = '';
  };

  const handleAddText = (preset?: string) => {
    const configs: Record<string, { fontSize: number; fontWeight: string; content: string }> = {
      heading: { fontSize: 36, fontWeight: 'bold', content: 'Heading' },
      subheading: { fontSize: 24, fontWeight: '600', content: 'Subheading' },
      body: { fontSize: 16, fontWeight: 'normal', content: 'Body text' },
    };
    const cfg = configs[preset || 'body'] || configs.body;
    addElement({
      id: uuidv4(), type: 'text', x: 20, y: 20, width: 160, height: 60,
      rotation: 0, content: cfg.content, fontSize: cfg.fontSize, fontFamily: 'Arial',
      color: '#333333', fontWeight: cfg.fontWeight, textAlign: 'center',
      view: activeView, opacity: 100, visible: true, name: cfg.content,
    });
    setActiveTool(null);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'line') => {
    addElement({
      id: uuidv4(), type: 'shape', x: 30, y: 30,
      width: shapeType === 'line' ? 120 : 80,
      height: shapeType === 'line' ? 10 : 80,
      rotation: 0, content: '', view: activeView, opacity: 100, visible: true,
      shapeType, fill: '#333333', strokeColor: 'none', strokeWidth: 0,
      name: shapeType,
    });
    setActiveTool(null);
  };

  const viewElements = elements.filter((el) => el.view === activeView);

  return (
    <div className="w-72 border-r border-border bg-background flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {selectedElementId ? (selectedElement?.name || 'Element') : activeTool?.replace('-', ' ')}
        </h3>
        <button
          onClick={() => { setActiveTool(null); store.selectElement(null); }}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Upload */}
        {activeTool === 'upload' && !selectedElementId && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-muted-foreground"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Upload image</span>
              <span className="text-xs">PNG, JPG, SVG · Max 10MB</span>
            </button>
          </div>
        )}

        {/* Text presets */}
        {activeTool === 'text' && !selectedElementId && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Click to add text</p>
            {[
              { id: 'heading', label: 'Add a heading', style: 'text-xl font-bold' },
              { id: 'subheading', label: 'Add a subheading', style: 'text-base font-semibold' },
              { id: 'body', label: 'Add body text', style: 'text-sm' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleAddText(t.id)}
                className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Type className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className={t.style}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Graphics / shapes */}
        {activeTool === 'graphics' && !selectedElementId && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Basic shapes</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { type: 'rectangle' as const, label: '■' },
                { type: 'circle' as const, label: '●' },
                { type: 'triangle' as const, label: '▲' },
                { type: 'star' as const, label: '★' },
                { type: 'heart' as const, label: '♥' },
                { type: 'line' as const, label: '—' },
              ]).map((s) => (
                <button
                  key={s.type}
                  onClick={() => handleAddShape(s.type)}
                  className="flex flex-col items-center gap-1 p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{s.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Garment color */}
        {activeTool === 'custom' && !selectedElementId && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Garment color</p>
            <div className="grid grid-cols-5 gap-2">
              {GARMENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setGarmentColor(c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${garmentColor === c ? 'border-primary scale-110' : 'border-border hover:border-muted-foreground'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted-foreground mb-1 block">Custom color</label>
              <input
                type="color"
                value={garmentColor}
                onChange={(e) => setGarmentColor(e.target.value)}
                className="w-full h-10 rounded-lg border border-input cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Layers */}
        {activeTool === 'layers' && !selectedElementId && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">{viewElements.length} element{viewElements.length !== 1 ? 's' : ''} on this view</p>
            {viewElements.length === 0 && (
              <p className="text-sm text-muted-foreground/60 text-center py-6">No elements yet</p>
            )}
            <div className="space-y-1">
              {[...viewElements].reverse().map((el) => (
                <button
                  key={el.id}
                  onClick={() => store.selectElement(el.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors text-left text-sm"
                >
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {el.type === 'text' ? 'T' : el.type === 'image' ? '🖼' : '◆'}
                  </span>
                  <span className="flex-1 truncate text-foreground">{el.name || el.type}</span>
                  {el.visible === false && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  {el.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Other tools placeholder */}
        {activeTool && !['upload', 'text', 'graphics', 'custom', 'layers'].includes(activeTool) && !selectedElementId && (
          <p className="text-sm text-muted-foreground text-center py-8">Coming soon...</p>
        )}

        {/* ===== ELEMENT PROPERTIES ===== */}
        {selectedElement && (
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => duplicateElement(selectedElement.id)} className="p-2 rounded border border-input hover:bg-accent" title="Duplicate (Ctrl+D)">
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
                className={`p-2 rounded border ${selectedElement.locked ? 'bg-accent border-primary' : 'border-input hover:bg-accent'}`}
                title={selectedElement.locked ? 'Unlock' : 'Lock'}
              >
                {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <button
                onClick={() => updateElement(selectedElement.id, { visible: selectedElement.visible === false ? true : false })}
                className={`p-2 rounded border ${selectedElement.visible === false ? 'bg-accent border-primary' : 'border-input hover:bg-accent'}`}
                title={selectedElement.visible === false ? 'Show' : 'Hide'}
              >
                {selectedElement.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => moveElementOrder(selectedElement.id, 'up')} className="p-2 rounded border border-input hover:bg-accent" title="Bring forward">
                <MoveUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveElementOrder(selectedElement.id, 'down')} className="p-2 rounded border border-input hover:bg-accent" title="Send backward">
                <MoveDown className="w-4 h-4" />
              </button>
            </div>

            {/* Text properties */}
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Text</label>
                  <textarea
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Font</label>
                  <select
                    value={selectedElement.fontFamily || 'Arial'}
                    onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Size</label>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 24}
                      onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Line height</label>
                    <input
                      type="number"
                      step={0.1}
                      value={selectedElement.lineHeight || 1.4}
                      onChange={(e) => updateElement(selectedElement.id, { lineHeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Letter spacing</label>
                  <input
                    type="range" min={-2} max={10} step={0.5}
                    value={selectedElement.letterSpacing || 0}
                    onChange={(e) => updateElement(selectedElement.id, { letterSpacing: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">{selectedElement.letterSpacing || 0}px</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                  <input
                    type="color"
                    value={selectedElement.color || '#333333'}
                    onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                    className="w-full h-8 rounded border border-input cursor-pointer"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`p-2 rounded border ${selectedElement.fontWeight === 'bold' ? 'bg-accent border-primary' : 'border-input'} hover:bg-accent`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`p-2 rounded border ${selectedElement.fontStyle === 'italic' ? 'bg-accent border-primary' : 'border-input'} hover:bg-accent`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                    className={`p-2 rounded border ${selectedElement.textDecoration === 'underline' ? 'bg-accent border-primary' : 'border-input'} hover:bg-accent`}
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-border mx-1" />
                  <button
                    onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}
                    className={`p-2 rounded border ${selectedElement.textAlign === 'left' ? 'bg-accent border-primary' : 'border-input'} hover:bg-accent`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}
                    className={`p-2 rounded border ${(!selectedElement.textAlign || selectedElement.textAlign === 'center') ? 'bg-accent border-primary' : 'border-input'} hover:bg-accent`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}
                    className={`p-2 rounded border ${selectedElement.textAlign === 'right' ? 'bg-accent border-primary' : 'border-input'} hover:bg-accent`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Shape properties */}
            {selectedElement.type === 'shape' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fill color</label>
                  <input
                    type="color"
                    value={selectedElement.fill || '#333333'}
                    onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                    className="w-full h-8 rounded border border-input cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Stroke color</label>
                  <input
                    type="color"
                    value={selectedElement.strokeColor || '#000000'}
                    onChange={(e) => updateElement(selectedElement.id, { strokeColor: e.target.value })}
                    className="w-full h-8 rounded border border-input cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Stroke width</label>
                  <input
                    type="range" min={0} max={10} step={0.5}
                    value={selectedElement.strokeWidth || 0}
                    onChange={(e) => updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">{selectedElement.strokeWidth || 0}px</span>
                </div>
              </>
            )}

            {/* Common: size, position, rotation, opacity */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">X</span>
                  <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full pl-7 pr-2 py-2 text-sm border border-input rounded-md bg-background" />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Y</span>
                  <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full pl-7 pr-2 py-2 text-sm border border-input rounded-md bg-background" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Size</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">W</span>
                  <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full pl-7 pr-2 py-2 text-sm border border-input rounded-md bg-background" />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">H</span>
                  <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="w-full pl-7 pr-2 py-2 text-sm border border-input rounded-md bg-background" />
                </div>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Align in design area</label>
              <div className="flex gap-1">
                {[
                  { align: 'left' as const, icon: '⬅', title: 'Align left' },
                  { align: 'center-h' as const, icon: '↔', title: 'Center horizontal' },
                  { align: 'right' as const, icon: '➡', title: 'Align right' },
                  { align: 'top' as const, icon: '⬆', title: 'Align top' },
                  { align: 'center-v' as const, icon: '↕', title: 'Center vertical' },
                  { align: 'bottom' as const, icon: '⬇', title: 'Align bottom' },
                ].map((a) => (
                  <button key={a.align} onClick={() => alignElement(selectedElement.id, a.align)}
                    className="p-2 rounded border border-input hover:bg-accent text-xs" title={a.title}
                  >{a.icon}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rotation ({selectedElement.rotation}°)</label>
              <input type="range" min={0} max={360}
                value={selectedElement.rotation} onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                className="w-full" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Opacity ({selectedElement.opacity ?? 100}%)</label>
              <input type="range" min={0} max={100}
                value={selectedElement.opacity ?? 100} onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                className="w-full" />
            </div>

            <button onClick={() => removeElement(selectedElement.id)}
              className="w-full flex items-center justify-center gap-2 p-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
