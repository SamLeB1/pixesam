import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { DEFAULT_GRID_SIZE, MIN_GRID_SIZE, MAX_GRID_SIZE } from "../constants";

export default function ModalNew() {
  const { newCanvas } = useEditorStore();
  const [widthInput, setWidthInput] = useState(DEFAULT_GRID_SIZE.x);
  const [heightInput, setHeightInput] = useState(DEFAULT_GRID_SIZE.y);

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

  function handleNewDrawing() {
    let clampedWidth = widthInput;
    if (clampedWidth < MIN_GRID_SIZE) clampedWidth = MIN_GRID_SIZE;
    else if (clampedWidth > MAX_GRID_SIZE) clampedWidth = MAX_GRID_SIZE;
    let clampedHeight = heightInput;
    if (clampedHeight < MIN_GRID_SIZE) clampedHeight = MIN_GRID_SIZE;
    else if (clampedHeight > MAX_GRID_SIZE) clampedHeight = MAX_GRID_SIZE;
    newCanvas({ x: clampedWidth, y: clampedHeight });
  }

  return (
    <dialog id="modal-new" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>
        <div className="mb-4">
          <h3 className="text-2xl font-medium text-white">New Canvas</h3>
          <p className="text-neutral-400">
            Start a new drawing! Max size: {MAX_GRID_SIZE}x{MAX_GRID_SIZE}
          </p>
        </div>
        <div className="mb-4">
          <label className="label mb-1 block" htmlFor="width-input">
            Width
          </label>
          <input
            className="input mb-2 w-full"
            type="number"
            id="width-input"
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            placeholder="Enter width"
            value={widthInput ? widthInput : ""}
            onChange={handleChangeWidth}
          />
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
            <button className="btn btn-primary" onClick={handleNewDrawing}>
              New drawing
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
