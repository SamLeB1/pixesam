import { useEditorStore } from "../store/editorStore";
import Tooltip from "./Tooltip";

export default function ShadeToolOptions() {
  const {
    switchDarkenAndLighten,
    shadeStrength,
    setSwitchDarkenAndLighten,
    setShadeStrength,
  } = useEditorStore();

  return (
    <div className="flex h-full items-center">
      <Tooltip content="Switch left and right buttons" side="bottom">
        <label className="label mr-4 text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${!switchDarkenAndLighten && "border-neutral-500"}`}
            type="checkbox"
            checked={switchDarkenAndLighten}
            onChange={() => setSwitchDarkenAndLighten(!switchDarkenAndLighten)}
          />
          Switch darken/lighten
        </label>
      </Tooltip>
      <label className="mr-2 text-sm text-white" htmlFor="shade-strength">
        Strength
      </label>
      <Tooltip
        content={
          <>
            <p>Amount to darken/lighten</p>
            <p className="text-center text-neutral-300">{shadeStrength}%</p>
          </>
        }
        side="bottom"
      >
        <input
          className="range range-primary range-xs w-32 bg-neutral-600"
          type="range"
          id="shade-strength"
          min="1"
          max="100"
          value={shadeStrength}
          onChange={(e) => setShadeStrength(+e.target.value)}
        />
      </Tooltip>
    </div>
  );
}
