import type { BlendMode } from "../types";

export function blendColors(
  srcR: number,
  srcG: number,
  srcB: number,
  dstR: number,
  dstG: number,
  dstB: number,
  mode: BlendMode,
): [number, number, number] {
  switch (mode) {
    case "multiply":
      return [(srcR * dstR) / 255, (srcG * dstG) / 255, (srcB * dstB) / 255];
    case "screen":
      return [
        srcR + dstR - (srcR * dstR) / 255,
        srcG + dstG - (srcG * dstG) / 255,
        srcB + dstB - (srcB * dstB) / 255,
      ];
    case "overlay":
      return [
        dstR < 128
          ? (2 * srcR * dstR) / 255
          : 255 - (2 * (255 - srcR) * (255 - dstR)) / 255,
        dstG < 128
          ? (2 * srcG * dstG) / 255
          : 255 - (2 * (255 - srcG) * (255 - dstG)) / 255,
        dstB < 128
          ? (2 * srcB * dstB) / 255
          : 255 - (2 * (255 - srcB) * (255 - dstB)) / 255,
      ];
    case "darken":
      return [Math.min(srcR, dstR), Math.min(srcG, dstG), Math.min(srcB, dstB)];
    case "lighten":
      return [Math.max(srcR, dstR), Math.max(srcG, dstG), Math.max(srcB, dstB)];
    default:
      return [srcR, srcG, srcB];
  }
}
