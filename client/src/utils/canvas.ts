import type { RGBA } from "../types";

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
