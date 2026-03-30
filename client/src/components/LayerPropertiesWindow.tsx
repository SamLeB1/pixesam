import { useEffect, useRef, useState } from "react";
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
  const {
    layers,
    activeLayerId,
    getActiveLayer,
    renameLayer,
    setLayerOpacity,
  } = useEditorStore();
  const layer = getActiveLayer();
  const [name, setName] = useState(layer.name);
  const [opacity, setOpacity] = useState(layer.opacity);
  const [blendMode, setBlendMode] = useState("Normal");
  const cancelRef = useRef(false);
  const opacityBeforeDrag = useRef(layer.opacity);

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
            onBlur={() => {
              if (!cancelRef.current) {
                const trimmed = name.trim();
                if (trimmed && trimmed !== layer.name)
                  renameLayer(layer.id, trimmed);
                else setName(layer.name);
              }
              cancelRef.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              else if (e.key === "Escape") {
                cancelRef.current = true;
                setName(layer.name);
                (e.target as HTMLInputElement).blur();
              }
            }}
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
            onPointerDown={() => (opacityBeforeDrag.current = layer.opacity)}
            onChange={(e) => {
              const value = Number(e.target.value);
              setOpacity(value);
              useEditorStore.setState((state) => ({
                layers: state.layers.map((l) =>
                  l.id === layer.id ? { ...l, opacity: value } : l,
                ),
              }));
            }}
            onPointerUp={() => {
              if (opacity !== opacityBeforeDrag.current) {
                useEditorStore.setState((state) => ({
                  layers: state.layers.map((l) =>
                    l.id === layer.id
                      ? { ...l, opacity: opacityBeforeDrag.current }
                      : l,
                  ),
                }));
                setLayerOpacity(layer.id, opacity);
              }
            }}
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
