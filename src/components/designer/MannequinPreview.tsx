import { Suspense, useMemo, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignerStore } from '@/store/designerStore';

/**
 * Realistic mannequin: human-like body (skin) wearing a t-shirt with the user's design.
 * Includes torso, neck, head silhouette, and arms beneath the garment.
 */

// Skin-toned body underneath
function HumanBody() {
  const skinMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: '#d4a574',
      roughness: 0.7,
      metalness: 0.0,
      clearcoat: 0.1,
    }),
    []
  );

  // Torso - elongated sphere
  const torsoGeo = useMemo(() => {
    const geo = new THREE.CapsuleGeometry(0.38, 0.9, 12, 24);
    geo.scale(1, 1, 0.75);
    return geo;
  }, []);

  // Neck
  const neckGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.12, 0.2, 16), []);

  // Head - sphere
  const headGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.18, 24, 24);
    geo.scale(1, 1.1, 0.95);
    return geo;
  }, []);

  // Upper arm
  const upperArmGeo = useMemo(() => new THREE.CapsuleGeometry(0.09, 0.35, 8, 12), []);
  // Forearm
  const forearmGeo = useMemo(() => new THREE.CapsuleGeometry(0.07, 0.32, 8, 12), []);

  return (
    <group>
      {/* Torso */}
      <mesh geometry={torsoGeo} material={skinMat} position={[0, -0.15, 0]} />

      {/* Neck */}
      <mesh geometry={neckGeo} material={skinMat} position={[0, 0.65, 0]} />

      {/* Head */}
      <mesh geometry={headGeo} material={skinMat} position={[0, 0.88, 0]} />

      {/* Left arm */}
      <group position={[-0.48, 0.25, 0]}>
        <mesh geometry={upperArmGeo} material={skinMat} rotation={[0, 0, 0.2]} position={[-0.12, -0.05, 0]} />
        <mesh geometry={forearmGeo} material={skinMat} rotation={[0, 0, 0.15]} position={[-0.22, -0.45, 0]} />
      </group>

      {/* Right arm */}
      <group position={[0.48, 0.25, 0]}>
        <mesh geometry={upperArmGeo} material={skinMat} rotation={[0, 0, -0.2]} position={[0.12, -0.05, 0]} />
        <mesh geometry={forearmGeo} material={skinMat} rotation={[0, 0, -0.15]} position={[0.22, -0.45, 0]} />
      </group>
    </group>
  );
}

// T-shirt garment layered on body
function TShirtGarment({ color, designTexture }: { color: string; designTexture: THREE.Texture | null }) {
  const garmentMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.88,
      metalness: 0.0,
      clearcoat: 0.03,
      side: THREE.FrontSide,
    }),
    [color]
  );

  // Main torso shell - slightly larger than body
  const torsoGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Bottom hem
    shape.moveTo(-0.48, -0.7);
    // Left side with slight waist curve
    shape.quadraticCurveTo(-0.5, -0.2, -0.52, 0.1);
    // Left shoulder area widening
    shape.quadraticCurveTo(-0.54, 0.35, -0.5, 0.45);
    // Left shoulder top
    shape.lineTo(-0.42, 0.52);
    // Neckline curve
    shape.quadraticCurveTo(-0.2, 0.58, 0, 0.5);
    shape.quadraticCurveTo(0.2, 0.58, 0.42, 0.52);
    // Right shoulder
    shape.lineTo(0.5, 0.45);
    shape.quadraticCurveTo(0.54, 0.35, 0.52, 0.1);
    // Right side
    shape.quadraticCurveTo(0.5, -0.2, 0.48, -0.7);
    // Bottom close
    shape.quadraticCurveTo(0, -0.73, -0.48, -0.7);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 5,
    });
  }, []);

  // Sleeve geometry
  const sleeveGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.12);
    shape.quadraticCurveTo(0.08, 0.14, 0.32, 0.05);
    shape.quadraticCurveTo(0.42, 0.0, 0.48, -0.18);
    shape.lineTo(0.45, -0.28);
    shape.quadraticCurveTo(0.38, -0.22, 0.25, -0.15);
    shape.quadraticCurveTo(0.1, -0.08, 0, -0.1);
    shape.lineTo(0, 0.12);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.38,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
  }, []);

  // Collar ring
  const collarGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, 0.2, 0.12, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, 0.17, 0.1, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
  }, []);

  return (
    <group>
      {/* Main torso shell */}
      <mesh geometry={torsoGeo} material={garmentMat} position={[0, -0.1, -0.275]} />

      {/* Left sleeve */}
      <mesh geometry={sleeveGeo} material={garmentMat} position={[-0.48, 0.22, -0.19]} rotation={[0, 0, 0.1]} />

      {/* Right sleeve (mirrored) */}
      <group position={[0.48, 0.22, 0.19]} rotation={[0, Math.PI, -0.1]}>
        <mesh geometry={sleeveGeo} material={garmentMat} />
      </group>

      {/* Collar */}
      <mesh geometry={collarGeo} material={garmentMat} position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Design overlay on front */}
      {designTexture && (
        <mesh position={[0, -0.12, 0.31]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshBasicMaterial map={designTexture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
    </group>
  );
}

function FullMannequin({ color, designTexture }: { color: string; designTexture: THREE.Texture | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      <HumanBody />
      <TShirtGarment color={color} designTexture={designTexture} />
    </group>
  );
}

function useDesignTexture() {
  const { elements } = useDesignerStore();
  const [imageLoadKey, setImageLoadKey] = useState(0);

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
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 5, 5]} intensity={1.0} castShadow />
          <directionalLight position={[-3, 3, -2]} intensity={0.3} />
          <directionalLight position={[0, -2, 3]} intensity={0.15} />
          <FullMannequin color={garmentColor} designTexture={designTexture} />
          <OrbitControls enableZoom enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} minDistance={2} maxDistance={5} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
