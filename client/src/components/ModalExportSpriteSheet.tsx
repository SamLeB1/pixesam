import { useState, useMemo, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import Tooltip from "./Tooltip";

type Layout = "horizontal-strip" | "vertical-strip" | "by-rows" | "by-columns";

const MAX_FRAME_SIZE = 1024;

export default function ModalExportSpriteSheet() {
  const { frames, gridSize, exportToSpriteSheet } = useEditorStore();
  const autoRowColCount = useMemo(() => {
    let rows = 1;
    let cols = 1;
    while (rows * cols < frames.length) {
      if (rows === cols) rows++;
      else cols++;
    }
    return { rows, cols };
  }, [frames.length]);

  const [container, setContainer] = useState<HTMLDialogElement | null>(null);
  const [scale, setScale] = useState(1);
  const [isEmptyScaleInput, setIsEmptyScaleInput] = useState(false);
  const [rowCountInput, setRowCountInput] = useState(autoRowColCount.rows);
  const [isEmptyRowCountInput, setIsEmptyRowCountInput] = useState(false);
  const [colCountInput, setColCountInput] = useState(autoRowColCount.cols);
  const [isEmptyColCountInput, setIsEmptyColCountInput] = useState(false);
  const [selectedLayout, setSelectedLayout] =
    useState<Layout>("horizontal-strip");

  const maxScale = useMemo(
    () => Math.floor(MAX_FRAME_SIZE / Math.max(gridSize.x, gridSize.y)),
    [gridSize.x, gridSize.y],
  );

  const rowColCount = useMemo(() => {
    if (selectedLayout === "horizontal-strip")
      return { rows: 1, cols: frames.length };
    else if (selectedLayout === "vertical-strip")
      return { rows: frames.length, cols: 1 };
    else return { rows: rowCountInput, cols: colCountInput };
  }, [frames.length, rowCountInput, colCountInput, selectedLayout]);

  useEffect(() => {
    setRowCountInput(autoRowColCount.rows);
    setColCountInput(autoRowColCount.cols);
  }, [autoRowColCount.rows, autoRowColCount.cols]);

  function onClose() {
    setScale(1);
    setIsEmptyScaleInput(false);
    setRowCountInput(autoRowColCount.rows);
    setIsEmptyRowCountInput(false);
    setColCountInput(autoRowColCount.cols);
    setIsEmptyColCountInput(false);
    setSelectedLayout("horizontal-strip");
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

  function handleChangeRowCountInput(e: React.ChangeEvent<HTMLInputElement>) {
    let value = parseInt(e.target.value);
    if (isNaN(value)) {
      setRowCountInput(1);
      setColCountInput(frames.length);
      setIsEmptyRowCountInput(true);
    } else {
      if (value < 1) value = 1;
      if (value > frames.length) value = frames.length;
      setRowCountInput(value);
      setColCountInput(Math.ceil(frames.length / value));
      setIsEmptyRowCountInput(false);
    }
  }

  function handleChangeColCountInput(e: React.ChangeEvent<HTMLInputElement>) {
    let value = parseInt(e.target.value);
    if (isNaN(value)) {
      setColCountInput(1);
      setRowCountInput(frames.length);
      setIsEmptyColCountInput(true);
    } else {
      if (value < 1) value = 1;
      if (value > frames.length) value = frames.length;
      setColCountInput(value);
      setRowCountInput(Math.ceil(frames.length / value));
      setIsEmptyColCountInput(false);
    }
  }

  return (
    <dialog ref={setContainer} id="modal-export-sprite-sheet" className="modal">
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
          Export Sprite Sheet
        </h3>
        <div className="mb-2">
          <label
            className="label mb-1 block"
            htmlFor="export-sprite-sheet-scale"
          >
            Scale
          </label>
          <div className="flex items-center">
            <input
              className="range range-primary range-xs mr-4 bg-neutral-600"
              type="range"
              id="export-sprite-sheet-scale"
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
        </div>
        <div className="mb-4">
          <p className="mb-1 text-sm text-neutral-300">
            Frame dimensions: {Math.floor(gridSize.x * scale)} x{" "}
            {Math.floor(gridSize.y * scale)}
          </p>
          <p className="mb-1 text-sm text-neutral-300">
            Sheet dimensions:{" "}
            {Math.floor(gridSize.x * scale) * rowColCount.cols} x{" "}
            {Math.floor(gridSize.y * scale) * rowColCount.rows}
          </p>
          <p className="text-sm text-neutral-300">
            {frames.length} {frames.length === 1 ? "frame" : "frames"},{" "}
            {rowColCount.cols} {rowColCount.cols === 1 ? "column" : "columns"},{" "}
            {rowColCount.rows} {rowColCount.rows === 1 ? "row" : "rows"}
          </p>
        </div>
        <div className="mb-8">
          <div className="mb-2">
            <label className="label mr-2 text-sm" htmlFor="layout-select">
              Layout
            </label>
            <select
              className="select select-sm w-1/2"
              id="layout-select"
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value as Layout)}
            >
              <option value="horizontal-strip">Horizontal strip</option>
              <option value="vertical-strip">Vertical strip</option>
              <option value="by-rows">By rows</option>
              <option value="by-columns">By columns</option>
            </select>
          </div>
          {selectedLayout === "by-rows" && (
            <Tooltip
              content="Number of columns"
              side="right"
              container={container}
            >
              <label className="label text-sm">
                Columns
                <input
                  className="input input-xs ml-1 w-12 pl-2 text-white"
                  type="number"
                  min="1"
                  max={frames.length}
                  value={isEmptyColCountInput ? "" : colCountInput}
                  onChange={handleChangeColCountInput}
                  onBlur={() => {
                    if (isEmptyColCountInput) {
                      setColCountInput(1);
                      setIsEmptyColCountInput(false);
                    }
                  }}
                />
              </label>
            </Tooltip>
          )}
          {selectedLayout === "by-columns" && (
            <Tooltip
              content="Number of rows"
              side="right"
              container={container}
            >
              <label className="label text-sm">
                Rows
                <input
                  className="input input-xs ml-1 w-12 pl-2 text-white"
                  type="number"
                  min="1"
                  max={frames.length}
                  value={isEmptyRowCountInput ? "" : rowCountInput}
                  onChange={handleChangeRowCountInput}
                  onBlur={() => {
                    if (isEmptyRowCountInput) {
                      setRowCountInput(1);
                      setIsEmptyRowCountInput(false);
                    }
                  }}
                />
              </label>
            </Tooltip>
          )}
        </div>
        <form method="dialog">
          <span className="mr-2 text-sm">Export .png</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              exportToSpriteSheet(
                scale,
                rowColCount.rows,
                rowColCount.cols,
                selectedLayout === "by-columns" ||
                  selectedLayout === "vertical-strip",
              );
              onClose();
            }}
          >
            Download
          </button>
        </form>
      </div>
    </dialog>
  );
}
