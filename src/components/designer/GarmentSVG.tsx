import { GarmentView } from '@/types/designer';

interface Props {
  view: GarmentView;
  color: string;
}

export default function GarmentSVG({ view, color }: Props) {
  if (view === 'front') {
    return (
      <svg viewBox="0 0 500 580" className="w-full h-full">
        {/* T-shirt front */}
        <path
          d="M150 80 Q150 40 200 30 Q220 25 250 50 Q280 25 300 30 Q350 40 350 80 L400 120 L420 200 L360 180 L360 530 L140 530 L140 180 L80 200 L100 120 Z"
          fill={color}
          stroke="hsl(30, 5%, 15%)"
          strokeWidth="2"
        />
        {/* Collar */}
        <ellipse cx="250" cy="55" rx="45" ry="22" fill="hsl(0,0%,85%)" stroke="hsl(30,5%,15%)" strokeWidth="1.5" />
        <ellipse cx="250" cy="50" rx="35" ry="15" fill={color} />
        {/* Stitch lines */}
        <path d="M145 180 L145 525" stroke="hsl(0,0%,80%)" strokeWidth="0.5" strokeDasharray="4 3" />
        <path d="M355 180 L355 525" stroke="hsl(0,0%,80%)" strokeWidth="0.5" strokeDasharray="4 3" />
      </svg>
    );
  }

  if (view === 'back') {
    return (
      <svg viewBox="0 0 500 580" className="w-full h-full">
        <path
          d="M150 80 Q150 40 200 30 Q220 28 250 40 Q280 28 300 30 Q350 40 350 80 L400 120 L420 200 L360 180 L360 530 L140 530 L140 180 L80 200 L100 120 Z"
          fill={color}
          stroke="hsl(30, 5%, 15%)"
          strokeWidth="2"
        />
        <path d="M200 30 Q250 45 300 30" fill="none" stroke="hsl(30,5%,15%)" strokeWidth="1.5" />
        <path d="M145 180 L145 525" stroke="hsl(0,0%,80%)" strokeWidth="0.5" strokeDasharray="4 3" />
        <path d="M355 180 L355 525" stroke="hsl(0,0%,80%)" strokeWidth="0.5" strokeDasharray="4 3" />
      </svg>
    );
  }

  if (view === 'sleeve-right' || view === 'sleeve-left') {
    const flip = view === 'sleeve-left';
    return (
      <svg viewBox="0 0 300 400" className="w-full h-full">
        <g transform={flip ? 'translate(300,0) scale(-1,1)' : ''}>
          <path
            d="M80 50 Q120 30 180 50 L220 180 Q200 200 160 200 L60 200 Q40 180 40 160 Z"
            fill={color}
            stroke="hsl(30, 5%, 15%)"
            strokeWidth="2"
          />
        </g>
      </svg>
    );
  }

  // Neck label
  return (
    <svg viewBox="0 0 300 200" className="w-full h-full">
      <rect x="80" y="40" width="140" height="120" rx="4" fill={color} stroke="hsl(30,5%,15%)" strokeWidth="1.5" />
      <path d="M80 40 Q150 20 220 40" fill="none" stroke="hsl(30,5%,15%)" strokeWidth="1.5" />
    </svg>
  );
}
