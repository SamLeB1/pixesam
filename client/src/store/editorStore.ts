import { create } from "zustand";
import { DEFAULT_GRID_SIZE } from "../constants";

type Tool = "pencil" | "eraser";

type EditorState = {
  pixelData: Uint8ClampedArray;
  gridSize: { x: number; y: number };
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  setPixelData: (pixelData: Uint8ClampedArray) => void;
  setGridSize: (gridSize: { x: number; y: number }) => void;
  selectTool: (tool: Tool) => void;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  pixelData: new Uint8ClampedArray(
    DEFAULT_GRID_SIZE.x * DEFAULT_GRID_SIZE.y * 4,
  ),
  gridSize: DEFAULT_GRID_SIZE,
  selectedTool: "pencil",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  setPixelData: (pixelData) => set({ pixelData }),
  setGridSize: (gridSize) => set({ gridSize }),
  selectTool: (tool) => set({ selectedTool: tool }),
  setPrimaryColor: (hex) => set({ primaryColor: hex }),
  setSecondaryColor: (hex) => set({ secondaryColor: hex }),
}));
