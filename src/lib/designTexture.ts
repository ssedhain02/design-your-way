import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DesignElement, GarmentView } from '@/types/designer';

/** Pixel size of each view's design area inside the 2D editor (500x580 stage). */
const VIEW_AREA: Record<GarmentView, { w: number; h: number }> = {
  front: { w: 500 * 0.4, h: 580 * 0.5 },
  back: { w: 500 * 0.4, h: 580 * 0.52 },
  'sleeve-right': { w: 500 * 0.5, h: 580 * 0.45 },
  'sleeve-left': { w: 500 * 0.5, h: 580 * 0.45 },
  'neck-label': { w: 500 * 0.44, h: 580 * 0.55 },
};

const TEX_W = 768;

const imageCache = new Map<string, HTMLImageElement>();

function getImage(src: string, onLoad: () => void): HTMLImageElement {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = onLoad;
  img.src = src;
  imageCache.set(src, img);
  return img;
}

/** Draws all elements of one view onto a transparent canvas, or returns null when empty. */
export function buildDesignCanvas(
  elements: DesignElement[],
  view: GarmentView,
  onImageLoad: () => void
): HTMLCanvasElement | null {
  const viewElements = elements.filter((el) => el.view === view && el.visible !== false);
  if (viewElements.length === 0) return null;

  const area = VIEW_AREA[view];
  const scale = TEX_W / area.w;
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = Math.round(area.h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  for (const el of viewElements) {
    const sx = el.x * scale;
    const sy = el.y * scale;
    const sw = el.width * scale;
    const sh = el.height * scale;

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    ctx.translate(sx + sw / 2, sy + sh / 2);
    if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-sw / 2, -sh / 2);

    if (el.type === 'text') {
      const fontSize = (el.fontSize || 24) * scale;
      ctx.fillStyle = el.color || '#000000';
      ctx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${fontSize}px ${el.fontFamily || 'Arial'}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
      const tx = el.textAlign === 'center' ? sw / 2 : el.textAlign === 'right' ? sw : 0;
      const lines = String(el.content).split('\n');
      const lineH = fontSize * (el.lineHeight || 1.2);
      lines.forEach((line, i) => ctx.fillText(line, tx, i * lineH));
    } else if (el.type === 'shape') {
      ctx.fillStyle = el.fill || el.color || '#000000';
      if (el.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(sw / 2, sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.shapeType === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(sw / 2, 0);
        ctx.lineTo(sw, sh);
        ctx.lineTo(0, sh);
        ctx.closePath();
        ctx.fill();
      } else if (el.shapeType === 'line') {
        ctx.fillRect(0, sh / 2 - (el.strokeWidth || 2) * scale * 0.5, sw, Math.max(1, (el.strokeWidth || 2) * scale));
      } else {
        ctx.fillRect(0, 0, sw, sh);
      }
    } else if (el.type === 'image' && el.content) {
      const img = getImage(el.content, onImageLoad);
      if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, sw, sh);
    }

    ctx.restore();
  }

  return canvas;
}

export interface DesignTextures {
  front: THREE.Texture | null;
  back: THREE.Texture | null;
}

/** Debounced textures for the 3D mockup, disposed whenever they are replaced. */
export function useDesignTextures(elements: DesignElement[], delay = 120): DesignTextures {
  const [textures, setTextures] = useState<DesignTextures>({ front: null, back: null });
  const [imageTick, setImageTick] = useState(0);
  const liveRef = useRef<DesignTextures>({ front: null, back: null });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const make = (view: GarmentView) => {
        const canvas = buildDesignCanvas(elements, view, () => setImageTick((t) => t + 1));
        if (!canvas) return null;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        return tex;
      };

      const next = { front: make('front'), back: make('back') };
      liveRef.current.front?.dispose();
      liveRef.current.back?.dispose();
      liveRef.current = next;
      setTextures(next);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [elements, imageTick, delay]);

  useEffect(
    () => () => {
      liveRef.current.front?.dispose();
      liveRef.current.back?.dispose();
    },
    []
  );

  return textures;
}
