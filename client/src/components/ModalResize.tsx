import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { MIN_GRID_SIZE, MAX_GRID_SIZE } from "../constants";

export default function ModalResize() {
  const { gridSize, setPixelData, setGridSize } = useEditorStore();
  const [widthInput, setWidthInput] = useState(gridSize.x);
  const [heightInput, setHeightInput] = useState(gridSize.y);

  function handleChangeWidth(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(e.target.value);
    if (isNaN(value)) setWidthInput(0);
    else setWidthInput(value);
  }

  function handleChangeHeight(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(e.target.value);
    if (isNaN(value)) setHeightInput(0);
    else setHeightInput(value);
  }

  function handleResize() {
    let clampedWidth = widthInput;
    if (clampedWidth < MIN_GRID_SIZE) clampedWidth = MIN_GRID_SIZE;
    else if (clampedWidth > MAX_GRID_SIZE) clampedWidth = MAX_GRID_SIZE;
    let clampedHeight = heightInput;
    if (clampedHeight < MIN_GRID_SIZE) clampedHeight = MIN_GRID_SIZE;
    else if (clampedHeight > MAX_GRID_SIZE) clampedHeight = MAX_GRID_SIZE;
    setPixelData(new Uint8ClampedArray(clampedWidth * clampedHeight * 4));
    setGridSize({ x: clampedWidth, y: clampedHeight });
  }

  return (
    <dialog id="modal-resize" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>
        <h3 className="mb-4 text-2xl font-medium text-white">Resize Canvas</h3>
        <div className="mb-2">
          <label className="label mb-1 block" htmlFor="width-input">
            Width
          </label>
          <input
            className="input w-full"
            type="number"
            id="width-input"
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            placeholder="Enter width"
            value={widthInput ? widthInput : ""}
            onChange={handleChangeWidth}
          />
        </div>
        <div className="mb-4">
          <label className="label mb-1 block" htmlFor="height-input">
            Height
          </label>
          <input
            className="input w-full"
            type="number"
            id="height-input"
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            placeholder="Enter height"
            value={heightInput ? heightInput : ""}
            onChange={handleChangeHeight}
          />
        </div>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-primary" onClick={handleResize}>
              Resize
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
