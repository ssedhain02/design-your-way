import * as THREE from 'three';

/**
 * Generates a procedural fabric normal map to give the garment a realistic "tooth".
 */
export function createFabricNormalMap(width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fill with base normal (pointing up: 128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, width, height);

  // Add fine grain
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Subtle variation in R and G (X and Y normals)
    const grain = (Math.random() - 0.5) * 15;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    // Blue stays high
  }
  
  // Add some "weave" patterns
  ctx.putImageData(imageData, 0, 0);
  
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = 'rgb(255, 255, 255)';
  ctx.lineWidth = 1;
  
  // Vertical threads
  for (let x = 0; x < width; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal threads
  for (let y = 0; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Large repeat for fine grain
  tex.repeat.set(12, 12);
  return tex;
}
