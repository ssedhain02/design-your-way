import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignerStore } from '@/store/designerStore';

function TorsoMannequin({ color, designTexture }: { color: string; designTexture: THREE.Texture | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const garmentMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 }),
    [color]
  );

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Torso */}
      <RoundedBox args={[1.6, 2.2, 0.8]} radius={0.15} position={[0, 0.5, 0]}>
        <primitive object={garmentMaterial} attach="material" />
      </RoundedBox>

      {/* Neck */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.4, 16]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.6} />
      </mesh>

      {/* Head (ghost/faceless) */}
      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.6} />
      </mesh>

      {/* Left shoulder/sleeve */}
      <RoundedBox args={[0.5, 0.9, 0.55]} radius={0.1} position={[-1.05, 0.9, 0]}>
        <primitive object={garmentMaterial} attach="material" />
      </RoundedBox>

      {/* Right shoulder/sleeve */}
      <RoundedBox args={[0.5, 0.9, 0.55]} radius={0.1} position={[1.05, 0.9, 0]}>
        <primitive object={garmentMaterial} attach="material" />
      </RoundedBox>

      {/* Design overlay on front */}
      {designTexture && (
        <mesh position={[0, 0.6, 0.42]}>
          <planeGeometry args={[1.0, 1.2]} />
          <meshBasicMaterial map={designTexture} transparent />
        </mesh>
      )}
    </group>
  );
}

export default function MannequinPreview() {
  const { garmentColor, elements } = useDesignerStore();

  const designTexture = useMemo(() => {
    const frontElements = elements.filter(el => el.view === 'front');
    if (frontElements.length === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 614;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 512, 614);

    for (const el of frontElements) {
      const sx = (el.x / 200) * 512;
      const sy = (el.y / 290) * 614;
      const sw = (el.width / 200) * 512;
      const sh = (el.height / 290) * 614;

      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      if (el.type === 'text') {
        ctx.fillStyle = el.color || '#000';
        const fontSize = Math.round(((el.fontSize || 24) / 200) * 512);
        ctx.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${fontSize}px ${el.fontFamily || 'Arial'}`;
        ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
        const textX = el.textAlign === 'center' ? sx + sw / 2 : el.textAlign === 'right' ? sx + sw : sx;
        ctx.fillText(el.content, textX, sy + fontSize);
      } else if (el.type === 'shape') {
        ctx.fillStyle = el.fill || '#000';
        if (el.shapeType === 'rectangle') {
          ctx.fillRect(sx, sy, sw, sh);
        } else if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [elements]);

  return (
    <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 1, 4], fov: 40 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <TorsoMannequin color={garmentColor} designTexture={designTexture} />
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
