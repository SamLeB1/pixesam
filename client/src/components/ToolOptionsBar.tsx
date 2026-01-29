import { useEditorStore } from "../store/editorStore";
import PencilToolOptions from "./PencilToolOptions";
import EraserToolOptions from "./EraserToolOptions";
import ColorPickerToolOptions from "./ColorPickerToolOptions";
import BucketToolOptions from "./BucketToolOptions";
import LineToolOptions from "./LineToolOptions";
import SelectToolOptions from "./SelectToolOptions";
import MoveToolOptions from "./MoveToolOptions";

export default function ToolOptionsBar() {
  const { selectedTool } = useEditorStore();

  return (
    <div className="min-h-10 bg-neutral-800 px-8">
      {selectedTool === "pencil" && <PencilToolOptions />}
      {selectedTool === "eraser" && <EraserToolOptions />}
      {selectedTool === "color-picker" && <ColorPickerToolOptions />}
      {selectedTool === "bucket" && <BucketToolOptions />}
      {selectedTool === "line" && <LineToolOptions />}
      {selectedTool === "select" && <SelectToolOptions />}
      {selectedTool === "move" && <MoveToolOptions />}
    </div>
  );
}
