import { blendColors } from "./colors";
import type { Layer } from "../types";

export function compositeLayers(
  layers: Layer[],
  width: number,
  height: number,
  includeInvisible = false,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(width * height * 4);
  const filteredLayers = includeInvisible
    ? layers
    : layers.filter((l) => l.visible);
  if (filteredLayers.length === 0) return result;
  if (filteredLayers.length === 1 && filteredLayers[0].opacity === 1.0) {
    result.set(filteredLayers[0].data);
    return result;
  }

  const pixelCount = width * height;
  const outR = new Float32Array(pixelCount);
  const outG = new Float32Array(pixelCount);
  const outB = new Float32Array(pixelCount);
  const outA = new Float32Array(pixelCount);

  for (const layer of filteredLayers) {
    const mode = layer.blendMode;
    for (let p = 0; p < pixelCount; p++) {
      const i = p * 4;
      const srcA = (layer.data[i + 3] / 255) * layer.opacity;
      if (srcA === 0) continue;
      const dstA = outA[p];

      const [blendR, blendG, blendB] =
        mode === "normal" || dstA === 0
          ? [layer.data[i], layer.data[i + 1], layer.data[i + 2]]
          : blendColors(
              layer.data[i],
              layer.data[i + 1],
              layer.data[i + 2],
              outR[p],
              outG[p],
              outB[p],
              mode,
            );

      const newA = srcA + dstA * (1 - srcA);
      if (newA > 0) {
        outR[p] = (blendR * srcA + outR[p] * dstA * (1 - srcA)) / newA;
        outG[p] = (blendG * srcA + outG[p] * dstA * (1 - srcA)) / newA;
        outB[p] = (blendB * srcA + outB[p] * dstA * (1 - srcA)) / newA;
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

export function compositeLayersWithOverride(
  layers: Layer[],
  width: number,
  height: number,
  overrideLayerId: string,
  overrideData: Uint8ClampedArray,
): Uint8ClampedArray {
  const overriddenLayers = layers.map((l) =>
    l.id === overrideLayerId ? { ...l, data: overrideData } : l,
  );
  return compositeLayers(overriddenLayers, width, height);
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
    blendMode: "normal",
  };
}

export function duplicateLayer(layer: Layer): Layer {
  return {
    id: crypto.randomUUID(),
    data: new Uint8ClampedArray(layer.data),
    name: `${layer.name} copy`,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
  };
}

export function getAutoLayerName(layers: Layer[]) {
  const max = layers.reduce((acc, layer) => {
    const match = layer.name.match(/^Layer (\d+)$/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `Layer ${max + 1}`;
}
