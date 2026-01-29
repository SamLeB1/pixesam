import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { MAX_BRUSH_SIZE } from "../constants";

export default function BrushSizeInput() {
  const { brushSize, setBrushSize } = useEditorStore();
  const [isEmptyBrushSizeInput, setIsEmptyBrushSizeInput] = useState(false);

  function handleChangeBrushSize(e: React.ChangeEvent<HTMLInputElement>) {
    let value = parseInt(e.target.value);
    if (isNaN(value)) {
      setBrushSize(1);
      setIsEmptyBrushSizeInput(true);
    } else {
      if (value < 1) value = 1;
      if (value > MAX_BRUSH_SIZE) value = MAX_BRUSH_SIZE;
      setBrushSize(value);
      setIsEmptyBrushSizeInput(false);
    }
  }

  return (
    <label className="label text-sm text-white" title="Brush size in pixels">
      Brush size
      <input
        className="input input-xs ml-1 w-12 pl-2"
        type="number"
        min="1"
        max={MAX_BRUSH_SIZE}
        value={isEmptyBrushSizeInput ? "" : brushSize}
        onChange={handleChangeBrushSize}
        onBlur={() => {
          if (isEmptyBrushSizeInput) {
            setBrushSize(1);
            setIsEmptyBrushSizeInput(false);
          }
        }}
      />
    </label>
  );
}
