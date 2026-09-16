import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2, RotateCw, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import MockupScene, { GARMENT_STYLE_OPTIONS } from './MannequinPreview';
import { useDesignerStore } from '@/store/designerStore';
import { useDesignTextures } from '@/lib/designTexture';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function CameraDistance({ distance }: { distance: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const portraitAdjustment = Math.max(1, 0.82 / Math.max(size.width / size.height, 0.3));
    camera.position.set(0, 0.1, distance * portraitAdjustment);
    camera.updateProjectionMatrix();
  }, [camera, distance, size.height, size.width]);
  return null;
}

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
  const [distance, setDistance] = useState(4.8);
  const [fullscreen, setFullscreen] = useState(false);

  const requestView = (angle: number) => {
    setAutoRotate(false);
    setViewRequest({ angle, token: Date.now() });
  };

  const reset = () => {
    setDistance(4.8);
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
            <Button
              key={v.label}
              variant="outline"
              size="sm"
              onClick={() => requestView(v.angle)}
              className="h-7 px-2.5 text-xs text-muted-foreground"
            >
              {v.label}
            </Button>
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDistance((d) => Math.max(3.2, d - 0.4))}
            className="h-7 w-7 text-muted-foreground"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDistance((d) => Math.min(7.5, d + 0.4))}
            className="h-7 w-7 text-muted-foreground"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAutoRotate(!autoRotate)}
            className={cn(
              'h-7 w-7 text-muted-foreground',
              autoRotate && 'bg-accent text-foreground'
            )}
            title="Auto-rotate"
            aria-label="Toggle auto-rotate"
            aria-pressed={autoRotate}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={reset} className="h-7 w-7 text-muted-foreground" title="Reset view" aria-label="Reset view">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen((f) => !f)}
            className="h-7 w-7 text-muted-foreground"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Canvas
          camera={{ position: [0, 0.1, distance], fov: 36 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          shadows
        >
          <Suspense fallback={null}>
            <CameraDistance distance={distance} />
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
              minDistance={3.2}
              maxDistance={10}
              onStart={() => setAutoRotate(false)}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
