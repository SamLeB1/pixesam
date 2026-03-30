import { useEffect, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import FloatingWindow from "./FloatingWindow";

type LayerPropertiesProps = {
  onClose: () => void;
};

const BLEND_MODES = [
  "Normal",
  "Multiply",
  "Screen",
  "Overlay",
  "Darken",
  "Lighten",
];

export default function LayerPropertiesWindow({
  onClose,
}: LayerPropertiesProps) {
  const { layers, activeLayerId, getActiveLayer } = useEditorStore();
  const layer = getActiveLayer();
  const [name, setName] = useState(layer.name);
  const [opacity, setOpacity] = useState(layer.opacity);
  const [blendMode, setBlendMode] = useState("Normal");

  useEffect(() => {
    setName(layer.name);
    setOpacity(layer.opacity);
    setBlendMode("Normal");
  }, [layers, activeLayerId]);

  return (
    <FloatingWindow title="Layer Properties" onClose={onClose}>
      <>
        <div className="mb-3">
          <label className="label mb-1 text-sm" htmlFor="layer-properties-name">
            Name
          </label>
          <input
            className="input input-sm"
            id="layer-properties-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <label className="label text-sm" htmlFor="layer-properties-opacity">
              Opacity
            </label>
            <span className="text-sm">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            className="range range-xs range-primary"
            id="layer-properties-opacity"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </div>
        <div>
          <label
            className="label mb-1 text-sm"
            htmlFor="layer-properties-blend-mode"
          >
            Blend Mode
          </label>
          <select
            className="select select-sm"
            id="layer-properties-blend-mode"
            value={blendMode}
            onChange={(e) => setBlendMode(e.target.value)}
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
      </>
    </FloatingWindow>
  );
}
