import Tooltip from "./Tooltip";
import { useEditorStore } from "../store/editorStore";

export default function SelectToolOptions() {
  const { selectionMode, setSelectionMode } = useEditorStore();

  function handleChangeSelectionMode(mode: "rectangular" | "lasso" | "wand") {
    if (selectionMode !== mode) setSelectionMode(mode);
  }

  return (
    <div className="flex h-full items-center">
      <Tooltip content="Set selection mode" side="bottom">
        <label className="label mr-4 text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${selectionMode !== "rectangular" && "border-neutral-500"}`}
            type="checkbox"
            checked={selectionMode === "rectangular"}
            onChange={() => handleChangeSelectionMode("rectangular")}
          />
          Rectangular
        </label>
      </Tooltip>
      <Tooltip content="Set selection mode" side="bottom">
        <label className="label mr-4 text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${selectionMode !== "lasso" && "border-neutral-500"}`}
            type="checkbox"
            checked={selectionMode === "lasso"}
            onChange={() => handleChangeSelectionMode("lasso")}
          />
          Lasso
        </label>
      </Tooltip>
      <Tooltip content="Set selection mode" side="bottom">
        <label className="label text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${selectionMode !== "wand" && "border-neutral-500"}`}
            type="checkbox"
            checked={selectionMode === "wand"}
            onChange={() => handleChangeSelectionMode("wand")}
          />
          Wand
        </label>
      </Tooltip>
    </div>
  );
}
