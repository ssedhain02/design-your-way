import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GarmentStyle } from '@/store/designerStore';
import { DesignTextures } from '@/lib/designTexture';

/**
 * Ghost-mannequin garment scene. Rendered inside the Canvas owned by MockupPanel.
 */

export interface GarmentProfile {
  bodyWidth: number;
  bodyLength: number;
  depth: number;
  sleeveLength: number;
  sleeveDepth: number;
  hood: boolean;
}

export const GARMENT_PROFILES: Record<GarmentStyle, GarmentProfile> = {
  regular: { bodyWidth: 0.52, bodyLength: 0.7, depth: 0.55, sleeveLength: 0.48, sleeveDepth: 0.38, hood: false },
  oversized: { bodyWidth: 0.62, bodyLength: 0.82, depth: 0.66, sleeveLength: 0.62, sleeveDepth: 0.46, hood: false },
  longsleeve: { bodyWidth: 0.54, bodyLength: 0.74, depth: 0.56, sleeveLength: 0.95, sleeveDepth: 0.34, hood: false },
  hoodie: { bodyWidth: 0.64, bodyLength: 0.8, depth: 0.72, sleeveLength: 0.95, sleeveDepth: 0.42, hood: true },
};

export const GARMENT_STYLE_OPTIONS: { id: GarmentStyle; label: string }[] = [
  { id: 'regular', label: 'Regular Tee' },
  { id: 'oversized', label: 'Oversized Tee' },
  { id: 'longsleeve', label: 'Long Sleeve' },
  { id: 'hoodie', label: 'Hoodie' },
];

function HumanBody({ profile }: { profile: GarmentProfile }) {
  const skinMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#d8b294', roughness: 0.75, metalness: 0, clearcoat: 0.08 }),
    []
  );

  const torsoGeo = useMemo(() => {
    const geo = new THREE.CapsuleGeometry(profile.bodyWidth * 0.72, profile.bodyLength * 1.25, 12, 24);
    geo.scale(1, 1, 0.75);
    return geo;
  }, [profile]);

  const neckGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.12, 0.22, 16), []);
  const headGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.18, 24, 24);
    geo.scale(1, 1.12, 0.95);
    return geo;
  }, []);
  const armGeo = useMemo(() => new THREE.CapsuleGeometry(0.085, 0.62, 8, 12), []);

  const armX = profile.bodyWidth + 0.02;

  return (
    <group>
      <mesh geometry={torsoGeo} material={skinMat} position={[0, -0.15, 0]} />
      <mesh geometry={neckGeo} material={skinMat} position={[0, 0.66, 0]} />
      <mesh geometry={headGeo} material={skinMat} position={[0, 0.9, 0]} />
      <mesh geometry={armGeo} material={skinMat} position={[-armX, -0.16, 0]} rotation={[0, 0, 0.12]} />
      <mesh geometry={armGeo} material={skinMat} position={[armX, -0.16, 0]} rotation={[0, 0, -0.12]} />
    </group>
  );
}

function Garment({
  color,
  profile,
  textures,
}: {
  color: string;
  profile: GarmentProfile;
  textures: DesignTextures;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.9,
        metalness: 0,
        sheen: 0.5,
        sheenRoughness: 0.9,
        clearcoat: 0.02,
        side: THREE.DoubleSide,
      }),
    [color]
  );

  const bodyGeo = useMemo(() => {
    const w = profile.bodyWidth;
    const l = profile.bodyLength;
    const shape = new THREE.Shape();
    shape.moveTo(-w * 0.94, -l);
    shape.quadraticCurveTo(-w * 0.98, -l * 0.3, -w, l * 0.14);
    shape.quadraticCurveTo(-w * 1.04, l * 0.5, -w * 0.96, l * 0.64);
    shape.lineTo(-w * 0.8, l * 0.74);
    shape.quadraticCurveTo(-w * 0.38, l * 0.84, 0, l * 0.71);
    shape.quadraticCurveTo(w * 0.38, l * 0.84, w * 0.8, l * 0.74);
    shape.lineTo(w * 0.96, l * 0.64);
    shape.quadraticCurveTo(w * 1.04, l * 0.5, w, l * 0.14);
    shape.quadraticCurveTo(w * 0.98, -l * 0.3, w * 0.94, -l);
    shape.quadraticCurveTo(0, -l * 1.04, -w * 0.94, -l);

    return new THREE.ExtrudeGeometry(shape, {
      depth: profile.depth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 6,
      curveSegments: 24,
    });
  }, [profile]);

  const sleeveGeo = useMemo(() => {
    const len = profile.sleeveLength;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.14);
    shape.quadraticCurveTo(len * 0.35, 0.12, len * 0.78, 0.02);
    shape.quadraticCurveTo(len * 0.95, -0.04, len, -0.22);
    shape.lineTo(len * 0.9, -0.34);
    shape.quadraticCurveTo(len * 0.6, -0.24, len * 0.4, -0.16);
    shape.quadraticCurveTo(len * 0.18, -0.1, 0, -0.12);
    shape.lineTo(0, 0.14);

    return new THREE.ExtrudeGeometry(shape, {
      depth: profile.sleeveDepth,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.028,
      bevelSegments: 4,
      curveSegments: 18,
    });
  }, [profile]);

  const collarGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, 0.23, 0.14, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, 0.19, 0.11, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 20,
    });
  }, []);

  const hoodGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.34, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62);
    geo.scale(1.05, 1, 0.9);
    return geo;
  }, []);

  const half = profile.depth / 2;
  const printW = profile.bodyWidth * 1.35;
  const printH = printW * 1.3;
  const printY = -profile.bodyLength * 0.2;

  return (
    <group>
      <mesh geometry={bodyGeo} material={mat} position={[0, -0.06, -half]} castShadow receiveShadow />

      <mesh
        geometry={sleeveGeo}
        material={mat}
        position={[-profile.bodyWidth * 0.94, profile.bodyLength * 0.36, -profile.sleeveDepth / 2]}
        rotation={[0, 0, Math.PI - 0.15]}
        scale={[1, 1, 1]}
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        position={[profile.bodyWidth * 0.94, profile.bodyLength * 0.36, -profile.sleeveDepth / 2]}
        rotation={[0, 0, -0.15]}
      />

      <mesh geometry={collarGeo} material={mat} position={[0, profile.bodyLength * 0.66, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {profile.hood && (
        <mesh
          geometry={hoodGeo}
          material={mat}
          position={[0, profile.bodyLength * 0.64, -0.12]}
          rotation={[-0.5, 0, 0]}
        />
      )}

      {textures.front && (
        <mesh position={[0, printY, half + 0.012]}>
          <planeGeometry args={[printW, printH]} />
          <meshBasicMaterial map={textures.front} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      )}

      {textures.back && (
        <mesh position={[0, printY, -half - 0.012]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[printW, printH]} />
          <meshBasicMaterial map={textures.back} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      )}
    </group>
  );
}

export interface MockupSceneProps {
  color: string;
  style: GarmentStyle;
  textures: DesignTextures;
  autoRotate: boolean;
  /** Increment to request a camera move; angle is in radians around Y. */
  viewRequest: { angle: number; token: number } | null;
}

export default function MockupScene({ color, style, textures, autoRotate, viewRequest }: MockupSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetY = useRef<number | null>(null);
  const lastToken = useRef(0);
  const profile = GARMENT_PROFILES[style];
  const { camera } = useThree();

  if (viewRequest && viewRequest.token !== lastToken.current) {
    lastToken.current = viewRequest.token;
    targetY.current = viewRequest.angle;
  }

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = groupRef.current;
    if (!g) return;

    if (targetY.current !== null) {
      const diff = targetY.current - g.rotation.y;
      if (Math.abs(diff) < 0.01) {
        g.rotation.y = targetY.current;
        targetY.current = null;
      } else {
        g.rotation.y += diff * (1 - Math.exp(-8 * delta));
      }
      return;
    }

    if (autoRotate) g.rotation.y += delta * 0.35;
    camera.updateProjectionMatrix();
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      <HumanBody profile={profile} />
      <Garment color={color} profile={profile} textures={textures} />
    </group>
  );
}
