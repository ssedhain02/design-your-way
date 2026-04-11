export type GarmentView = 'front' | 'back' | 'sleeve-right' | 'sleeve-left' | 'neck-label';

export interface DesignElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  locked?: boolean;
  visible?: boolean;
  name?: string;
  view: GarmentView;
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'line';
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: string;
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

export const FONT_OPTIONS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Palatino',
  'Garamond', 'Bookman', 'Tahoma', 'Lucida Console',
];

export const GARMENT_COLORS = [
  '#ffffff', '#000000', '#1a1a2e', '#2d3436', '#636e72',
  '#b2bec3', '#dfe6e9', '#d63031', '#e17055', '#fdcb6e',
  '#00b894', '#0984e3', '#6c5ce7', '#e84393', '#fab1a0',
  '#55a8a2', '#2d4059', '#c0392b', '#f39c12', '#27ae60',
];
