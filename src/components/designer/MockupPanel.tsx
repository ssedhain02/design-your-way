import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2, RotateCw, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import MockupScene, { GARMENT_STYLE_OPTIONS } from './MannequinPreview';
import { useDesignerStore } from '@/store/designerStore';
import { useDesignTextures } from '@/lib/designTexture';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const VIEW_ANGLES: { label: string; angle: number }[] = [
  { label: 'Front', angle: 0 },
  { label: 'Right', angle: -Math.PI / 2 },
  { label: 'Back', angle: Math.PI },
  { label: 'Left', angle: Math.PI / 2 },
];

export default function MockupPanel({ className }: { className?: string }) {
  const { elements, garmentColor, garmentStyle, setGarmentStyle, autoRotate, setAutoRotate } = useDesignerStore();
  const textures = useDesignTextures(elements);

  const [viewRequest, setViewRequest] = useState<{ angle: number; token: number } | null>(null);
  const [distance, setDistance] = useState(3.2);
  const [fullscreen, setFullscreen] = useState(false);

  const requestView = (angle: number) => {
    setAutoRotate(false);
    setViewRequest({ angle, token: Date.now() });
  };

  const reset = () => {
    setDistance(3.2);
    requestView(0);
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-gradient-to-b from-muted/70 to-background overflow-hidden',
        fullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/80 flex-wrap">
        <div className="flex items-center gap-1">
          {VIEW_ANGLES.map((v) => (
            <button
              key={v.label}
              onClick={() => requestView(v.angle)}
              className="px-2.5 py-1 text-xs rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Select value={garmentStyle} onValueChange={(v) => setGarmentStyle(v as typeof garmentStyle)}>
            <SelectTrigger className="h-7 w-[132px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GARMENT_STYLE_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setDistance((d) => Math.max(2, d - 0.35))}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDistance((d) => Math.min(5.5, d + 0.35))}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground',
              autoRotate && 'bg-accent text-foreground'
            )}
            title="Auto-rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={reset} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title="Reset view">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Canvas
          key={fullscreen ? 'fs' : 'inline'}
          camera={{ position: [0, 0.25, distance], fov: 32 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          shadows
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 5, 5]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <directionalLight position={[-3, 3, -2]} intensity={0.35} />
            <directionalLight position={[0, -2, 3]} intensity={0.15} />

            <MockupScene
              color={garmentColor}
              style={garmentStyle}
              textures={textures}
              autoRotate={autoRotate}
              viewRequest={viewRequest}
            />

            <ContactShadows position={[0, -1.15, 0]} opacity={0.35} scale={4} blur={2.4} far={2} />

            <Environment>
              <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[8, 8, 1]} />
              <Lightformer intensity={1} color="#bcd4e6" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[16, 2, 1]} />
              <Lightformer intensity={1} color="#ffe8d6" position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[16, 2, 1]} />
            </Environment>

            <OrbitControls
              enableZoom
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.6}
              minDistance={2}
              maxDistance={5.5}
              onStart={() => setAutoRotate(false)}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
