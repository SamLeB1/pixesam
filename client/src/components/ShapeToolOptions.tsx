import { useEditorStore } from "../store/editorStore";
import Tooltip from "./Tooltip";
import BrushSizeInput from "./BrushSizeInput";

export default function ShapeToolOptions() {
  const { shapeMode, shapeFill, setShapeMode, setShapeFill } = useEditorStore();

  function handleChangeShapeMode(mode: "rectangle" | "ellipse") {
    if (shapeMode !== mode) setShapeMode(mode);
  }

  return (
    <div className="flex h-full items-center">
      <Tooltip content="Set shape mode" side="bottom">
        <label className="label mr-4 text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${shapeMode !== "rectangle" && "border-neutral-500"}`}
            type="checkbox"
            checked={shapeMode === "rectangle"}
            onChange={() => handleChangeShapeMode("rectangle")}
          />
          Rectangle
        </label>
      </Tooltip>
      <Tooltip content="Set shape mode" side="bottom">
        <label className="label mr-4 text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${shapeMode !== "ellipse" && "border-neutral-500"}`}
            type="checkbox"
            checked={shapeMode === "ellipse"}
            onChange={() => handleChangeShapeMode("ellipse")}
          />
          Ellipse
        </label>
      </Tooltip>
      <Tooltip content="Fill inside shape" side="bottom">
        <label className="label mr-4 text-sm text-white">
          <input
            className={`checkbox checkbox-primary checkbox-xs rounded-none border-2 ${!shapeFill && "border-neutral-500"}`}
            type="checkbox"
            checked={shapeFill}
            onChange={() => setShapeFill(!shapeFill)}
          />
          Fill
        </label>
      </Tooltip>
      <BrushSizeInput />
    </div>
  );
}
