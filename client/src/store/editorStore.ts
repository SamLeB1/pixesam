import { create } from "zustand";

type Tool = "pencil" | "eraser";

type EditorState = {
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  selectTool: (tool: Tool) => void;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  selectedTool: "pencil",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  selectTool: (tool) => set({ selectedTool: tool }),
  setPrimaryColor: (hex) => set({ primaryColor: hex }),
  setSecondaryColor: (hex) => set({ secondaryColor: hex }),
}));
