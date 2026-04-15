import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignerStore } from '@/store/designerStore';

// T-shirt shape using LatheGeometry for realistic torso
function TShirtMannequin({ color, designTexture }: { color: string; designTexture: THREE.Texture | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  // Torso profile points for lathe geometry (half cross-section)
  const torsoGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // T-shirt front panel shape
    shape.moveTo(-0.7, -1.1);
    shape.lineTo(-0.7, 0.4);
    // shoulder curve
    shape.quadraticCurveTo(-0.7, 0.7, -0.45, 0.8);
    // neckline
    shape.quadraticCurveTo(-0.2, 0.85, 0, 0.7);
    shape.quadraticCurveTo(0.2, 0.85, 0.45, 0.8);
    // right shoulder
    shape.quadraticCurveTo(0.7, 0.7, 0.7, 0.4);
    shape.lineTo(0.7, -1.1);
    shape.lineTo(-0.7, -1.1);

    const extrudeSettings = {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, []);

  // Sleeve geometry
  const sleeveGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.45, -0.1);
    shape.lineTo(0.5, -0.5);
    shape.lineTo(0.05, -0.4);
    shape.lineTo(0, 0);

    const extrudeSettings = {
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  const garmentMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ 
      color, 
      roughness: 0.75, 
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    [color]
  );

  const ghostSkinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ 
      color: '#e8d5c4', 
      roughness: 0.5, 
      metalness: 0.0,
      transparent: true,
      opacity: 0.85,
    }),
    []
  );

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Main T-shirt body */}
      <mesh geometry={torsoGeometry} material={garmentMaterial} position={[0, 0, 0]} />

      {/* Left sleeve */}
      <mesh geometry={sleeveGeometry} material={garmentMaterial} position={[-0.65, 0.3, -0.22]} rotation={[0, 0, 0.15]} />

      {/* Right sleeve */}
      <mesh geometry={sleeveGeometry} material={garmentMaterial} position={[0.2, 0.2, -0.22]} rotation={[0, Math.PI, -0.15]} scale={[-1, 1, 1]} />

      {/* Ghost neck */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 20]} />
        <primitive object={ghostSkinMaterial} attach="material" />
      </mesh>

      {/* Ghost head (faceless) */}
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <primitive object={ghostSkinMaterial} attach="material" />
      </mesh>

      {/* Design overlay on front of t-shirt */}
      {designTexture && (
        <mesh position={[0, 0.0, 0.36]}>
          <planeGeometry args={[0.9, 1.1]} />
          <meshBasicMaterial map={designTexture} transparent depthWrite={false} />
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
      } else if (el.type === 'image' && el.content) {
        // For images, we need to load and draw them
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = el.content;
        if (img.complete) {
          ctx.drawImage(img, sx, sy, sw, sh);
        }
      }
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [elements]);

  // For image elements, we need to reload texture after images load
  const [imageLoadKey, setImageLoadKey] = useState(0);
  useEffect(() => {
    const imageElements = elements.filter(el => el.type === 'image' && el.view === 'front');
    if (imageElements.length === 0) return;

    let loaded = 0;
    imageElements.forEach(el => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loaded++;
        if (loaded === imageElements.length) {
          setImageLoadKey(k => k + 1);
        }
      };
      img.src = el.content;
    });
  }, [elements]);

  const finalTexture = useMemo(() => {
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
        const img = new Image();
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

  return (
    <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 35 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 5]} intensity={0.9} castShadow />
          <directionalLight position={[-3, 3, -2]} intensity={0.3} />
          <TShirtMannequin color={garmentColor} designTexture={finalTexture} />
          <OrbitControls enableZoom enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} minDistance={2} maxDistance={6} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
