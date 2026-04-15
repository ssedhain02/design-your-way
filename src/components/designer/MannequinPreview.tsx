import { Suspense, useMemo, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignerStore } from '@/store/designerStore';

/**
 * Photoroom-style invisible/ghost mannequin T-shirt.
 * The garment is a smooth, rounded torso shape with realistic sleeves.
 * There is NO head/neck — just the garment floating in space (invisible mannequin effect).
 * The user's design is projected onto the chest area.
 */

function GhostTShirt({ color, designTexture }: { color: string; designTexture: THREE.Texture | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const garmentMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.85,
        metalness: 0.0,
        clearcoat: 0.05,
        side: THREE.DoubleSide,
      }),
    [color]
  );

  // Inner shadow material — dark, semi-transparent to fake depth inside collar/sleeves
  const innerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity: 0.6,
        side: THREE.BackSide,
      }),
    []
  );

  // --- TORSO (front panel — ExtrudeGeometry) ---
  const torsoGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Bottom hem
    shape.moveTo(-0.72, -1.15);
    // Left side up
    shape.lineTo(-0.72, 0.35);
    // Left shoulder slope
    shape.quadraticCurveTo(-0.72, 0.72, -0.48, 0.82);
    // Neckline curve (V/crew style)
    shape.quadraticCurveTo(-0.25, 0.88, 0, 0.72);
    shape.quadraticCurveTo(0.25, 0.88, 0.48, 0.82);
    // Right shoulder slope
    shape.quadraticCurveTo(0.72, 0.72, 0.72, 0.35);
    // Right side down
    shape.lineTo(0.72, -1.15);
    // Bottom hem close
    shape.lineTo(-0.72, -1.15);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 6,
    });
    geo.center();
    return geo;
  }, []);

  // --- SLEEVE geometry ---
  const sleeveGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.05);
    shape.quadraticCurveTo(0.15, 0.08, 0.48, -0.05);
    shape.lineTo(0.55, -0.48);
    shape.quadraticCurveTo(0.5, -0.52, 0.42, -0.48);
    shape.lineTo(0.08, -0.38);
    shape.lineTo(0, 0.05);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.42,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
  }, []);

  // --- COLLAR ring ---
  const collarGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, 0.28, 0.15, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, 0.24, 0.12, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* Main torso */}
      <mesh geometry={torsoGeo} material={garmentMat} />
      {/* Inner darkness for hollow effect */}
      <mesh geometry={torsoGeo} material={innerMat} />

      {/* Left sleeve */}
      <mesh geometry={sleeveGeo} material={garmentMat} position={[-0.66, 0.28, -0.2]} rotation={[0, 0, 0.12]} />
      <mesh geometry={sleeveGeo} material={innerMat} position={[-0.66, 0.28, -0.2]} rotation={[0, 0, 0.12]} />

      {/* Right sleeve (mirrored) */}
      <group position={[0.66, 0.28, 0.22]} rotation={[0, Math.PI, -0.12]} scale={[1, 1, 1]}>
        <mesh geometry={sleeveGeo} material={garmentMat} />
        <mesh geometry={sleeveGeo} material={innerMat} />
      </group>

      {/* Collar ring */}
      <mesh geometry={collarGeo} material={garmentMat} position={[0, 0.72, -0.01]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Inner collar shadow (dark ring inside neck) */}
      <mesh position={[0, 0.68, 0.02]}>
        <cylinderGeometry args={[0.22, 0.24, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#111" transparent opacity={0.5} side={THREE.BackSide} />
      </mesh>

      {/* Design overlay on front */}
      {designTexture && (
        <mesh position={[0, -0.08, 0.33]}>
          <planeGeometry args={[0.95, 1.2]} />
          <meshBasicMaterial map={designTexture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
    </group>
  );
}

function useDesignTexture() {
  const { elements } = useDesignerStore();
  const [imageLoadKey, setImageLoadKey] = useState(0);

  // Load images and trigger re-render
  useEffect(() => {
    const imageElements = elements.filter(el => el.type === 'image' && el.view === 'front');
    if (imageElements.length === 0) return;
    let loaded = 0;
    imageElements.forEach(el => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loaded++;
        if (loaded === imageElements.length) setImageLoadKey(k => k + 1);
      };
      img.src = el.content;
    });
  }, [elements]);

  return useMemo(() => {
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
        if (el.shapeType === 'rectangle') ctx.fillRect(sx, sy, sw, sh);
        else if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (el.type === 'image' && el.content) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = el.content;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, sx, sy, sw, sh);
        }
      }
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, imageLoadKey]);
}

export default function MannequinPreview() {
  const { garmentColor } = useDesignerStore();
  const designTexture = useDesignTexture();

  return (
    <div className="w-full h-full bg-gradient-to-b from-muted to-muted/50 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0.3, 3.2], fov: 32 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 5]} intensity={1.0} castShadow />
          <directionalLight position={[-3, 3, -2]} intensity={0.35} />
          <directionalLight position={[0, -2, 3]} intensity={0.15} />
          <GhostTShirt color={garmentColor} designTexture={designTexture} />
          <OrbitControls enableZoom enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} minDistance={2} maxDistance={5} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
