import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { MIN_GRID_SIZE, MAX_GRID_SIZE } from "../constants";
import type { Side } from "../types";

export default function ModalResize() {
  const { gridSize, resizeCanvas } = useEditorStore();
  const [widthInput, setWidthInput] = useState(gridSize.x);
  const [heightInput, setHeightInput] = useState(gridSize.y);
  const [selectedAnchor, setSelectedAnchor] = useState<Side>("top-left");
  const [isCheckedResizeContent, setIsCheckedResizeContent] = useState(false);

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
    resizeCanvas(
      { x: clampedWidth, y: clampedHeight },
      selectedAnchor,
      isCheckedResizeContent,
    );
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
        <div className="mb-4 flex">
          <div className="mr-8 flex-grow">
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
              className="input mb-4 w-full"
              type="number"
              id="height-input"
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              placeholder="Enter height"
              value={heightInput ? heightInput : ""}
              onChange={handleChangeHeight}
            />
            <label className="label" htmlFor="resize-content">
              <input
                className={`checkbox checkbox-primary mr-2 ${!isCheckedResizeContent && "border-none bg-white"}`}
                type="checkbox"
                id="resize-content"
                checked={isCheckedResizeContent}
                onChange={(e) => setIsCheckedResizeContent(e.target.checked)}
              />
              Resize content
            </label>
          </div>
          <div>
            <div className="label mb-1 block select-none">Anchor</div>
            <div className="grid grid-cols-3 gap-1">
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "top-left" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent) setSelectedAnchor("top-left");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "top-center" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent) setSelectedAnchor("top-center");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "top-right" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent) setSelectedAnchor("top-right");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "middle-left" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent) setSelectedAnchor("middle-left");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "middle-center" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent)
                    setSelectedAnchor("middle-center");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "middle-right" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent)
                    setSelectedAnchor("middle-right");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "bottom-left" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent) setSelectedAnchor("bottom-left");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "bottom-center" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent)
                    setSelectedAnchor("bottom-center");
                }}
              ></div>
              <div
                className="h-8 w-8 cursor-pointer bg-neutral-600 hover:bg-neutral-500"
                style={{
                  ...(selectedAnchor === "bottom-right" && {
                    backgroundColor: "white",
                  }),
                  ...(isCheckedResizeContent && {
                    backgroundColor: "oklch(37.1% 0 0)",
                    cursor: "default",
                  }),
                }}
                onClick={() => {
                  if (!isCheckedResizeContent)
                    setSelectedAnchor("bottom-right");
                }}
              ></div>
            </div>
          </div>
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
