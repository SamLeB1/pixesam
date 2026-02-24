import type { Layer } from "../types";

export function compositeLayers(
  layers: Layer[],
  width: number,
  height: number,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(width * height * 4);
  const visibleLayers = layers.filter((l) => l.visible);
  if (visibleLayers.length === 0) return result;
  if (visibleLayers.length === 1 && visibleLayers[0].opacity === 1.0) {
    result.set(visibleLayers[0].data);
    return result;
  }

  const pixelCount = width * height;
  const outR = new Float32Array(pixelCount);
  const outG = new Float32Array(pixelCount);
  const outB = new Float32Array(pixelCount);
  const outA = new Float32Array(pixelCount);

  for (const layer of visibleLayers) {
    for (let p = 0; p < pixelCount; p++) {
      const i = p * 4;
      const srcA = (layer.data[i + 3] / 255) * layer.opacity;
      if (srcA === 0) continue;
      const dstA = outA[p];
      const newA = srcA + dstA * (1 - srcA);
      if (newA > 0) {
        outR[p] = (layer.data[i] * srcA + outR[p] * dstA * (1 - srcA)) / newA;
        outG[p] =
          (layer.data[i + 1] * srcA + outG[p] * dstA * (1 - srcA)) / newA;
        outB[p] =
          (layer.data[i + 2] * srcA + outB[p] * dstA * (1 - srcA)) / newA;
      }
      outA[p] = newA;
    }
  }

  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    result[i] = Math.round(outR[p]);
    result[i + 1] = Math.round(outG[p]);
    result[i + 2] = Math.round(outB[p]);
    result[i + 3] = Math.round(outA[p] * 255);
  }

  return result;
}

export function createNewLayer(
  width: number,
  height: number,
  name: string,
  data?: Uint8ClampedArray,
): Layer {
  return {
    id: crypto.randomUUID(),
    data: data || new Uint8ClampedArray(width * height * 4),
    name,
    visible: true,
    locked: false,
    opacity: 1.0,
  };
}
