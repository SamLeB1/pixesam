import { create } from "zustand";
import {
  getBaseIndex,
  isValidIndex,
  getPixelColor,
  setPixelColor,
  isEqualColor,
} from "../utils/canvas";
import { DEFAULT_GRID_SIZE } from "../constants";
import type { RGBA } from "../types";

type Tool = "pencil" | "eraser" | "color-picker" | "bucket";

type EditorState = {
  pixelData: Uint8ClampedArray;
  gridSize: { x: number; y: number };
  zoomLevel: number;
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  setPixelData: (pixelData: Uint8ClampedArray) => void;
  setGridSize: (gridSize: { x: number; y: number }) => void;
  setZoomLevel: (n: number) => void;
  selectTool: (tool: Tool) => void;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
  getPixelColor: (x: number, y: number) => RGBA;
  setPixelColor: (x: number, y: number, color: RGBA) => void;
  erasePixel: (x: number, y: number) => void;
  floodFill: (x: number, y: number, color: RGBA) => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  pixelData: new Uint8ClampedArray(
    DEFAULT_GRID_SIZE.x * DEFAULT_GRID_SIZE.y * 4,
  ),
  gridSize: DEFAULT_GRID_SIZE,
  zoomLevel: 1,
  selectedTool: "pencil",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  setPixelData: (pixelData) => set({ pixelData }),
  setGridSize: (gridSize) => set({ gridSize }),
  setZoomLevel: (n) => set({ zoomLevel: n }),
  selectTool: (tool) => set({ selectedTool: tool }),
  setPrimaryColor: (hex) => set({ primaryColor: hex }),
  setSecondaryColor: (hex) => set({ secondaryColor: hex }),
  getPixelColor: (x, y) => {
    const { pixelData, gridSize } = get();
    const baseIndex = getBaseIndex(x, y, gridSize.x);
    return {
      r: pixelData[baseIndex],
      g: pixelData[baseIndex + 1],
      b: pixelData[baseIndex + 2],
      a: pixelData[baseIndex + 3],
    };
  },
  setPixelColor: (x, y, color) =>
    set((state) => {
      const newData = new Uint8ClampedArray(state.pixelData);
      const baseIndex = getBaseIndex(x, y, state.gridSize.x);
      newData[baseIndex] = color.r;
      newData[baseIndex + 1] = color.g;
      newData[baseIndex + 2] = color.b;
      newData[baseIndex + 3] = color.a;
      return { pixelData: newData };
    }),
  erasePixel: (x, y) =>
    set((state) => {
      const newData = new Uint8ClampedArray(state.pixelData);
      const baseIndex = getBaseIndex(x, y, state.gridSize.x);
      newData[baseIndex] = 0;
      newData[baseIndex + 1] = 0;
      newData[baseIndex + 2] = 0;
      newData[baseIndex + 3] = 0;
      return { pixelData: newData };
    }),
  floodFill: (x, y, color) =>
    set((state) => {
      const { pixelData, gridSize } = state;
      const targetColor = getPixelColor(x, y, gridSize.x, pixelData);
      if (isEqualColor(targetColor, color)) return {};

      const newData = new Uint8ClampedArray(pixelData);
      const queue: { x: number; y: number }[] = [];
      queue.push({ x, y });
      while (queue.length > 0) {
        const { x, y } = queue.shift()!;
        const currentColor = getPixelColor(x, y, gridSize.x, newData);

        if (isEqualColor(currentColor, targetColor)) {
          setPixelColor(x, y, gridSize.x, color, newData);
          if (isValidIndex(x + 1, y, gridSize)) queue.push({ x: x + 1, y });
          if (isValidIndex(x - 1, y, gridSize)) queue.push({ x: x - 1, y });
          if (isValidIndex(x, y + 1, gridSize)) queue.push({ x, y: y + 1 });
          if (isValidIndex(x, y - 1, gridSize)) queue.push({ x, y: y - 1 });
        }
      }
      return { pixelData: newData };
    }),
}));
