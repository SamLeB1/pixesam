import { create } from "zustand";

type Tool = "pencil" | "eraser";

type EditorState = {
  selectedTool: Tool;
  selectTool: (tool: Tool) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  selectedTool: "pencil",
  selectTool: (tool) => set({ selectedTool: tool }),
}));
