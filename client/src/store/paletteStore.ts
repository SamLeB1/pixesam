import { create } from "zustand";
import type { ColorPalette } from "../types";

const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: "default",
    name: "Default",
    colors: [
      "#be4a2f",
      "#d77643",
      "#ead4aa",
      "#e4a672",
      "#b86f50",
      "#733e39",
      "#3e2731",
      "#a22633",
      "#e43b44",
      "#f77622",
      "#feae34",
      "#fee761",
      "#63c74d",
      "#3e8948",
      "#265c42",
      "#193c3e",
      "#124e89",
      "#0099db",
      "#2ce8f5",
      "#ffffff",
      "#c0cbdc",
      "#8b9bb4",
      "#5a6988",
      "#3a4466",
      "#262b44",
      "#181425",
      "#ff0044",
      "#68386c",
      "#b55088",
      "#f6757a",
      "#e8b796",
      "#c28569",
    ],
    isDefault: true,
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: [
      "#0d2b45",
      "#203c56",
      "#544e68",
      "#8d697a",
      "#d08159",
      "#ffaa5e",
      "#ffd4a3",
      "#ffecd6",
    ],
    isDefault: true,
  },
];

type PaletteState = {
  palettes: ColorPalette[];
  selectedPaletteId: string;
  addPalette: (palette: ColorPalette) => void;
  updatePalette: (
    id: string,
    updates: Partial<Pick<ColorPalette, "name" | "colors">>,
  ) => void;
  deletePalette: (id: string) => void;
  selectPalette: (id: string) => void;
  getSelectedPalette: () => ColorPalette;
};

export const usePaletteStore = create<PaletteState>((set, get) => ({
  palettes: DEFAULT_PALETTES,
  selectedPaletteId: "default",

  addPalette: (palette) =>
    set((state) => ({
      palettes: [...state.palettes, palette],
      selectedPaletteId: palette.id,
    })),

  updatePalette: (id, updates) =>
    set((state) => {
      const palette = state.palettes.find((p) => p.id === id);
      if (!palette || palette.isDefault) return {};

      return {
        palettes: state.palettes.map((p) =>
          p.id === id ? { ...p, ...updates } : p,
        ),
      };
    }),

  deletePalette: (id) =>
    set((state) => {
      const palette = state.palettes.find((p) => p.id === id);
      if (!palette || palette.isDefault) return {};

      const newPalettes = state.palettes.filter((p) => p.id !== id);
      const newSelectedId =
        state.selectedPaletteId === id ? "default" : state.selectedPaletteId;

      return {
        palettes: newPalettes,
        selectedPaletteId: newSelectedId,
      };
    }),

  selectPalette: (id) => set({ selectedPaletteId: id }),

  getSelectedPalette: () => {
    const { palettes, selectedPaletteId } = get();
    return palettes.find((p) => p.id === selectedPaletteId) as ColorPalette;
  },
}));
