import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import FloatingWindow from "./FloatingWindow";
import type { BlendMode } from "../types";

type LayerPropertiesProps = {
  onClose: () => void;
};

const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: "Normal", value: "normal" },
  { label: "Multiply", value: "multiply" },
  { label: "Screen", value: "screen" },
  { label: "Overlay", value: "overlay" },
  { label: "Darken", value: "darken" },
  { label: "Lighten", value: "lighten" },
];

export default function LayerPropertiesWindow({
  onClose,
}: LayerPropertiesProps) {
  const {
    layers,
    activeLayerId,
    getLayer,
    renameLayer,
    setLayerOpacity,
    setLayerBlendMode,
  } = useEditorStore();
  const layer = getLayer();
  const [name, setName] = useState(layer.name);
  const [opacity, setOpacity] = useState(layer.opacity);
  const cancelRef = useRef(false);
  const opacityBeforeDrag = useRef(layer.opacity);

  useEffect(() => {
    setName(layer.name);
    setOpacity(layer.opacity);
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
            value={layer.blendMode}
            onChange={(e) =>
              setLayerBlendMode(layer.id, e.target.value as BlendMode)
            }
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </>
    </FloatingWindow>
  );
}
