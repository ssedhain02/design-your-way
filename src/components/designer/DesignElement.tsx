import { DesignElement } from '@/types/designer';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface Props {
  element: DesignElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResize: (id: string, handle: string, e: React.MouseEvent) => void;
  isPreview: boolean;
}

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_CURSORS: Record<string, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
};
const HANDLE_POS: Record<string, { top?: string; bottom?: string; left?: string; right?: string; transform: string }> = {
  nw: { top: '-4px', left: '-4px', transform: '' },
  n:  { top: '-4px', left: '50%', transform: 'translateX(-50%)' },
  ne: { top: '-4px', right: '-4px', transform: '' },
  e:  { top: '50%', right: '-4px', transform: 'translateY(-50%)' },
  se: { bottom: '-4px', right: '-4px', transform: '' },
  s:  { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' },
  sw: { bottom: '-4px', left: '-4px', transform: '' },
  w:  { top: '50%', left: '-4px', transform: 'translateY(-50%)' },
};

export default function DesignElementComponent({ element, isSelected, onMouseDown, onResize, isPreview }: Props) {
  const opacity = element.opacity ?? 100;

  const renderShape = () => {
    const fill = element.fill || '#333333';
    const stroke = element.strokeColor || 'none';
    const sw = element.strokeWidth || 0;
    switch (element.shapeType) {
      case 'rectangle':
        return <svg className="w-full h-full"><rect x={sw} y={sw} width="100%" height="100%" fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
      case 'circle':
        return <svg className="w-full h-full" viewBox="0 0 100 100"><circle cx="50" cy="50" r={48 - sw} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
      case 'triangle':
        return <svg className="w-full h-full" viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
      case 'star':
        return <svg className="w-full h-full" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
      case 'heart':
        return <svg className="w-full h-full" viewBox="0 0 100 100"><path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C40 5 48 12 50 18 C52 12 60 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
      case 'line':
        return <svg className="w-full h-full" viewBox="0 0 100 10"><line x1="0" y1="5" x2="100" y2="5" stroke={fill} strokeWidth={sw || 2} /></svg>;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn('design-element absolute group', isSelected && !isPreview && 'selected')}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        cursor: isPreview || element.locked ? 'default' : 'move',
        opacity: opacity / 100,
        pointerEvents: element.visible === false ? 'none' : 'auto',
        display: element.visible === false && !isPreview ? 'block' : element.visible === false ? 'none' : 'block',
      }}
      onMouseDown={isPreview || element.locked ? undefined : onMouseDown}
    >
      {element.type === 'image' ? (
        <img src={element.content} alt="design" className="w-full h-full object-contain" draggable={false} />
      ) : element.type === 'shape' ? (
        renderShape()
      ) : (
        <div
          className="w-full h-full flex items-start overflow-hidden whitespace-pre-wrap break-words"
          style={{
            fontSize: element.fontSize || 24,
            fontFamily: element.fontFamily || 'Arial',
            color: element.color || 'hsl(30, 5%, 15%)',
            fontWeight: element.fontWeight || 'normal',
            fontStyle: element.fontStyle || 'normal',
            textAlign: element.textAlign || 'center',
            justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textDecoration: element.textDecoration || 'none',
          }}
        >
          {element.content}
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !isPreview && !element.locked && (
        <>
          {HANDLES.map((h) => (
            <div
              key={h}
              className="absolute w-2 h-2 bg-primary border border-primary-foreground rounded-sm z-10"
              style={{ ...HANDLE_POS[h], cursor: HANDLE_CURSORS[h] }}
              onMouseDown={(e) => { e.stopPropagation(); onResize(element.id, h, e); }}
            />
          ))}
        </>
      )}
    </div>
  );
}
