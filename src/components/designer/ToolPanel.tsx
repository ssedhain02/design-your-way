import { useDesignerStore } from '@/store/designerStore';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Upload, X, Trash2, Type, Bold, Italic } from 'lucide-react';

export default function ToolPanel() {
  const { activeTool, setActiveTool, addElement, activeView, selectedElementId, elements, updateElement, removeElement } =
    useDesignerStore();
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
        id: uuidv4(),
        type: 'image',
        x: 10,
        y: 10,
        width: maxW,
        height: maxW * ratio,
        rotation: 0,
        content: url,
        view: activeView,
      });
      setActiveTool(null);
    };
    img.src = url;
  };

  const handleAddText = () => {
    addElement({
      id: uuidv4(),
      type: 'text',
      x: 20,
      y: 20,
      width: 150,
      height: 50,
      rotation: 0,
      content: 'Your text',
      fontSize: 24,
      fontFamily: 'sans-serif',
      color: '#333333',
      view: activeView,
    });
    setActiveTool(null);
  };

  return (
    <div className="w-64 border-r border-border bg-background p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {selectedElementId ? 'Element' : activeTool}
        </h3>
        <button onClick={() => { setActiveTool(null); }} className="p-1 rounded hover:bg-accent text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload panel */}
      {activeTool === 'upload' && !selectedElementId && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 p-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-muted-foreground"
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">Click to upload image</span>
          </button>
          <p className="text-xs text-muted-foreground mt-3">Supports PNG, JPG, SVG. Max 10MB.</p>
        </div>
      )}

      {/* Text panel */}
      {activeTool === 'text' && !selectedElementId && (
        <div>
          <button
            onClick={handleAddText}
            className="w-full flex items-center gap-2 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Type className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Add a text layer</span>
          </button>
        </div>
      )}

      {/* Element properties */}
      {selectedElement && (
        <div className="space-y-4">
          {selectedElement.type === 'text' && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Text</label>
                <input
                  value={selectedElement.content}
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Font size</label>
                <input
                  type="number"
                  value={selectedElement.fontSize || 24}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                />
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
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`p-2 rounded border ${selectedElement.fontWeight === 'bold' ? 'bg-accent border-primary' : 'border-input'}`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`p-2 rounded border ${selectedElement.fontStyle === 'italic' ? 'bg-accent border-primary' : 'border-input'}`}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Size</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                className="px-3 py-2 text-sm border border-input rounded-md bg-background"
                placeholder="W"
              />
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                className="px-3 py-2 text-sm border border-input rounded-md bg-background"
                placeholder="H"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Rotation</label>
            <input
              type="range"
              min={0}
              max={360}
              value={selectedElement.rotation}
              onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <button
            onClick={() => removeElement(selectedElement.id)}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Placeholder for other tools */}
      {activeTool && !['upload', 'text'].includes(activeTool) && !selectedElementId && (
        <p className="text-sm text-muted-foreground">Coming soon...</p>
      )}
    </div>
  );
}
