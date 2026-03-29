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
  const { getActiveLayer } = useEditorStore();
  const layer = getActiveLayer();

  return (
    <FloatingWindow title="Layer Properties" onClose={onClose}>
      <div className="flex w-48 flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Name</label>
          <input
            className="w-full rounded bg-neutral-700 px-2 py-1 text-sm text-neutral-200 outline-none focus:ring-1 focus:ring-neutral-500"
            type="text"
            value={layer.name}
            readOnly
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs text-neutral-400">Opacity</label>
            <span className="text-xs text-neutral-400">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
          <input
            className="w-full accent-neutral-400"
            type="range"
            min={0}
            max={100}
            value={Math.round(layer.opacity * 100)}
            readOnly
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">
            Blend Mode
          </label>
          <select
            className="w-full rounded bg-neutral-700 px-2 py-1 text-sm text-neutral-200 outline-none focus:ring-1 focus:ring-neutral-500"
            value="Normal"
            disabled
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FloatingWindow>
  );
}
