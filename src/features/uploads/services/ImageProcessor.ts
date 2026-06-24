export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

export function calculateDimensions(width: number, height: number, maxWidth = 1920): { w: number; h: number } {
  if (width <= maxWidth) return { w: width, h: height };
  const ratio = maxWidth / width;
  return { w: maxWidth, h: Math.round(height * ratio) };
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export error'));
    }, 'image/webp', quality);
  });
}

export async function processImageToWebp(file: File): Promise<ProcessedImage> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);
  
  const { w, h } = calculateDimensions(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, w, h);
  
  const blob = await canvasToWebpBlob(canvas);
  return { blob, width: w, height: h };
}
