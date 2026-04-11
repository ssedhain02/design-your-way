import { DesignElement } from '@/types/designer';
import { cn } from '@/lib/utils';

interface Props {
  element: DesignElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  isPreview: boolean;
}

export default function DesignElementComponent({ element, isSelected, onMouseDown, isPreview }: Props) {
  return (
    <div
      className={cn('design-element absolute', isSelected && !isPreview && 'selected')}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        cursor: isPreview ? 'default' : 'move',
      }}
      onMouseDown={isPreview ? undefined : onMouseDown}
    >
      {element.type === 'image' ? (
        <img src={element.content} alt="design" className="w-full h-full object-contain" draggable={false} />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            fontSize: element.fontSize || 24,
            fontFamily: element.fontFamily || 'sans-serif',
            color: element.color || 'hsl(30, 5%, 15%)',
            fontWeight: element.fontWeight || 'normal',
            fontStyle: element.fontStyle || 'normal',
          }}
        >
          {element.content}
        </div>
      )}
    </div>
  );
}
