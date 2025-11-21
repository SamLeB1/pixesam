import { useState } from "react";
import { useEditorStore } from "../store/editorStore";

const MAX_IMAGE_SIZE = 4096;

export default function ModalExportToImage() {
  const { gridSize, exportToImage } = useEditorStore();
  const [scale, setScale] = useState(1);
  const [isEmptyScaleInput, setIsEmptyScaleInput] = useState(false);
  const maxScale = Math.floor(
    MAX_IMAGE_SIZE / Math.max(gridSize.x, gridSize.y),
  );

  function onClose() {
    setScale(1);
    setIsEmptyScaleInput(false);
  }

  function handleChangeScale(e: React.ChangeEvent<HTMLInputElement>) {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setScale(0);
      setIsEmptyScaleInput(true);
    } else {
      if (value < 0) value = 0;
      if (value > maxScale) value = maxScale;
      setScale(value);
      setIsEmptyScaleInput(false);
    }
  }

  return (
    <dialog id="modal-export-to-image" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
            onClick={onClose}
          >
            ✕
          </button>
        </form>
        <h3 className="mb-4 text-2xl font-medium text-white">
          Export to Image
        </h3>
        <label className="label mb-1 block" htmlFor="export-scale">
          Scale
        </label>
        <div className="mb-2 flex items-center">
          <input
            className="range range-primary range-xs mr-4 bg-neutral-600"
            type="range"
            id="export-scale"
            min="1"
            max={maxScale}
            value={scale}
            onChange={handleChangeScale}
          />
          <label className="input input-sm w-20 gap-1">
            x
            <input
              type="number"
              min="1"
              max={maxScale}
              value={isEmptyScaleInput ? "" : scale}
              onChange={handleChangeScale}
            />
          </label>
        </div>
        <p className="mb-4">
          Dimensions: {Math.floor(gridSize.x * scale)} x{" "}
          {Math.floor(gridSize.y * scale)}
        </p>
        <div className="modal-action">
          <form method="dialog">
            <button
              className="btn btn-primary"
              onClick={() => {
                exportToImage(scale);
                onClose();
              }}
            >
              Download .png
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
