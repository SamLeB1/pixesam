import type { RGBA, Rect } from "../types";

export function getBaseIndex(x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

export function isValidIndex(
  x: number,
  y: number,
  size: { x: number; y: number },
) {
  return x >= 0 && x < size.x && y >= 0 && y < size.y;
}

export function getPixelColor(
  x: number,
  y: number,
  width: number,
  data: Uint8ClampedArray,
): RGBA {
  const baseIndex = getBaseIndex(x, y, width);
  return {
    r: data[baseIndex],
    g: data[baseIndex + 1],
    b: data[baseIndex + 2],
    a: data[baseIndex + 3],
  };
}

export function setPixelColor(
  x: number,
  y: number,
  width: number,
  color: RGBA,
  data: Uint8ClampedArray,
) {
  const baseIndex = getBaseIndex(x, y, width);
  data[baseIndex] = color.r;
  data[baseIndex + 1] = color.g;
  data[baseIndex + 2] = color.b;
  data[baseIndex + 3] = color.a;
}

export function isEqualColor(color1: RGBA, color2: RGBA) {
  return (
    color1.r === color2.r &&
    color1.g === color2.g &&
    color1.b === color2.b &&
    color1.a === color2.a
  );
}

export function drawRectContent(
  rect: Rect,
  pixels: RGBA[],
  data: Uint8ClampedArray,
  dataSize: { x: number; y: number },
  full = true,
) {
  let currPixelIndex = 0;
  for (let i = 0; i < rect.height; i++) {
    for (let j = 0; j < rect.width; j++) {
      const px = rect.x + j;
      const py = rect.y + i;
      if (isValidIndex(px, py, dataSize)) {
        if (currPixelIndex >= pixels.length) return;
        setPixelColor(px, py, dataSize.x, pixels[currPixelIndex], data);
        if (!full) currPixelIndex++;
      }
      if (full) currPixelIndex++;
    }
  }
}

export function clearRectContent(
  rect: Rect,
  data: Uint8ClampedArray,
  dataSize: { x: number; y: number },
) {
  for (let i = 0; i < rect.height; i++) {
    for (let j = 0; j < rect.width; j++) {
      const px = rect.x + j;
      const py = rect.y + i;
      if (isValidIndex(px, py, dataSize))
        setPixelColor(px, py, dataSize.x, { r: 0, g: 0, b: 0, a: 0 }, data);
    }
  }
}

export function resizeWithNearestNeighbor(
  pixels: RGBA[],
  sw: number,
  sh: number,
  dw: number,
  dh: number,
) {
  const newPixels: RGBA[] = [];
  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const sx = Math.floor((dx * sw) / dw);
      const sy = Math.floor((dy * sh) / dh);
      const index = sy * sw + sx;
      newPixels.push(pixels[index]);
    }
  }
  return newPixels;
}
