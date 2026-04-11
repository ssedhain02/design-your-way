export type GarmentView = 'front' | 'back' | 'sleeve-right' | 'sleeve-left' | 'neck-label';

export interface DesignElement {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string; // URL for image, text string for text
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  view: GarmentView;
}

export interface GarmentConfig {
  id: string;
  name: string;
  color: string;
  views: GarmentView[];
}

export const GARMENT_VIEWS: { id: GarmentView; label: string }[] = [
  { id: 'front', label: 'Front side' },
  { id: 'back', label: 'Back side' },
  { id: 'sleeve-right', label: 'Sleeve right' },
  { id: 'sleeve-left', label: 'Sleeve left' },
  { id: 'neck-label', label: 'Neck label inner' },
];
