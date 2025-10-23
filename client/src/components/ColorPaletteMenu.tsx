import { useState } from "react";
import PaletteColors from "./PaletteColors";

const defaultPalette = [
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
];

const sunsetPalette = [
  "#0d2b45",
  "#203c56",
  "#544e68",
  "#8d697a",
  "#d08159",
  "#ffaa5e",
  "#ffd4a3",
  "#ffecd6",
];

export default function ColorPaletteMenu() {
  const [selectedPalette, setSelectedPalette] = useState("default");

  return (
    <div>
      <select
        className="select select-sm mb-2 w-1/2"
        id="palette-select"
        value={selectedPalette}
        onChange={(e) => setSelectedPalette(e.target.value)}
      >
        <option value="default">Default</option>
        <option value="sunset">Sunset</option>
      </select>
      <PaletteColors
        colors={selectedPalette === "default" ? defaultPalette : sunsetPalette}
      />
    </div>
  );
}
