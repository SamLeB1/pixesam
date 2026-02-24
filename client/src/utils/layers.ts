import type { Layer } from "../types";

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
