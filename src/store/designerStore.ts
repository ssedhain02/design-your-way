import { create } from 'zustand';
import { DesignElement, GarmentView } from '@/types/designer';

interface DesignerState {
  activeView: GarmentView;
  elements: DesignElement[];
  selectedElementId: string | null;
  zoom: number;
  mode: 'edit' | 'preview';
  garmentColor: string;
  activeTool: string | null;

  setActiveView: (view: GarmentView) => void;
  addElement: (element: DesignElement) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setMode: (mode: 'edit' | 'preview') => void;
  setGarmentColor: (color: string) => void;
  setActiveTool: (tool: string | null) => void;
}

export const useDesignerStore = create<DesignerState>((set) => ({
  activeView: 'front',
  elements: [],
  selectedElementId: null,
  zoom: 100,
  mode: 'edit',
  garmentColor: '#ffffff',
  activeTool: null,

  setActiveView: (view) => set({ activeView: view, selectedElementId: null }),
  addElement: (element) => set((s) => ({ elements: [...s.elements, element] })),
  updateElement: (id, updates) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    })),
  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    })),
  selectElement: (id) => set({ selectedElementId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(200, zoom)) }),
  setMode: (mode) => set({ mode }),
  setGarmentColor: (color) => set({ garmentColor: color }),
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
