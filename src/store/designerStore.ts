import { create } from 'zustand';
import { DesignElement, GarmentView } from '@/types/designer';
import { v4 as uuidv4 } from 'uuid';

interface HistoryEntry {
  elements: DesignElement[];
}

export interface SelectedProduct {
  id: string;
  name: string;
  colors: string[];
  sizes: string[];
  basePrice: number;
  imageUrl: string | null;
}

interface DesignerState {
  activeView: GarmentView;
  elements: DesignElement[];
  selectedElementId: string | null;
  zoom: number;
  mode: 'edit' | 'preview';
  garmentColor: string;
  activeTool: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  clipboard: DesignElement | null;
  selectedProduct: SelectedProduct | null;
  selectedSize: string | null;

  setActiveView: (view: GarmentView) => void;
  addElement: (element: DesignElement) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setMode: (mode: 'edit' | 'preview') => void;
  setGarmentColor: (color: string) => void;
  setActiveTool: (tool: string | null) => void;
  setSelectedProduct: (product: SelectedProduct | null) => void;
  setSelectedSize: (size: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  duplicateElement: (id: string) => void;
  copyElement: () => void;
  pasteElement: () => void;
  moveElementOrder: (id: string, direction: 'up' | 'down') => void;
  alignElement: (id: string, alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
}

const pushHistory = (state: { elements: DesignElement[]; history: HistoryEntry[]; historyIndex: number }) => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({ elements: JSON.parse(JSON.stringify(state.elements)) });
  return { history: newHistory, historyIndex: newHistory.length - 1 };
};

export const useDesignerStore = create<DesignerState>((set, get) => ({
  activeView: 'front',
  elements: [],
  selectedElementId: null,
  zoom: 100,
  mode: 'edit',
  garmentColor: '#ffffff',
  activeTool: null,
  history: [{ elements: [] }],
  historyIndex: 0,
  clipboard: null,
  selectedProduct: null,
  selectedSize: null,

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  clipboard: null,

  setActiveView: (view) => set({ activeView: view, selectedElementId: null }),

  addElement: (element) =>
    set((s) => {
      const newElements = [...s.elements, element];
      const h = pushHistory({ ...s, elements: newElements });
      return { elements: newElements, ...h, selectedElementId: element.id };
    }),

  updateElement: (id, updates) =>
    set((s) => {
      const newElements = s.elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
      return { elements: newElements };
    }),

  removeElement: (id) =>
    set((s) => {
      const newElements = s.elements.filter((el) => el.id !== id);
      const h = pushHistory({ ...s, elements: newElements });
      return {
        elements: newElements,
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
        ...h,
      };
    }),

  selectElement: (id) => set({ selectedElementId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(200, zoom)) }),
  setMode: (mode) => set({ mode }),
  setGarmentColor: (color) => set({ garmentColor: color }),
  setActiveTool: (tool) => set((s) => ({ activeTool: s.activeTool === tool ? null : tool })),

  undo: () =>
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const newIndex = s.historyIndex - 1;
      return {
        elements: JSON.parse(JSON.stringify(s.history[newIndex].elements)),
        historyIndex: newIndex,
        selectedElementId: null,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      return {
        elements: JSON.parse(JSON.stringify(s.history[newIndex].elements)),
        historyIndex: newIndex,
        selectedElementId: null,
      };
    }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  duplicateElement: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id);
      if (!el) return s;
      const newEl = { ...el, id: uuidv4(), x: el.x + 15, y: el.y + 15, name: (el.name || el.type) + ' copy' };
      const newElements = [...s.elements, newEl];
      const h = pushHistory({ ...s, elements: newElements });
      return { elements: newElements, selectedElementId: newEl.id, ...h };
    }),

  copyElement: () =>
    set((s) => {
      const el = s.elements.find((e) => e.id === s.selectedElementId);
      return { clipboard: el ? { ...el } : null };
    }),

  pasteElement: () =>
    set((s) => {
      if (!s.clipboard) return s;
      const newEl = { ...s.clipboard, id: uuidv4(), x: s.clipboard.x + 15, y: s.clipboard.y + 15, view: s.activeView };
      const newElements = [...s.elements, newEl];
      const h = pushHistory({ ...s, elements: newElements });
      return { elements: newElements, selectedElementId: newEl.id, ...h };
    }),

  moveElementOrder: (id, direction) =>
    set((s) => {
      const idx = s.elements.findIndex((e) => e.id === id);
      if (idx === -1) return s;
      const newElements = [...s.elements];
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= newElements.length) return s;
      [newElements[idx], newElements[targetIdx]] = [newElements[targetIdx], newElements[idx]];
      return { elements: newElements };
    }),

  alignElement: (id, alignment) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id);
      if (!el) return s;
      // Design area is roughly 200x290 for front view
      const areaW = 200;
      const areaH = 290;
      let updates: Partial<DesignElement> = {};
      switch (alignment) {
        case 'left': updates = { x: 0 }; break;
        case 'center-h': updates = { x: (areaW - el.width) / 2 }; break;
        case 'right': updates = { x: areaW - el.width }; break;
        case 'top': updates = { y: 0 }; break;
        case 'center-v': updates = { y: (areaH - el.height) / 2 }; break;
        case 'bottom': updates = { y: areaH - el.height }; break;
      }
      const newElements = s.elements.map((e) => (e.id === id ? { ...e, ...updates } : e));
      return { elements: newElements };
    }),
}));
