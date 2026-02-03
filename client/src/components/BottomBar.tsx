import { FaMinus, FaPlus } from "react-icons/fa";
import { MdUndo, MdRedo } from "react-icons/md";
import Tooltip from "./Tooltip";
import { useEditorStore } from "../store/editorStore";
import useCanvasZoom from "../hooks/useCanvasZoom";
import { MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL } from "../constants";

export default function BottomBar() {
  const {
    gridSize,
    zoomLevel,
    undoHistory,
    redoHistory,
    mousePos,
    undo,
    redo,
  } = useEditorStore();
  const { zoomStepTowardsCenter, resetZoom } = useCanvasZoom();
  const isEmptyUndoHistory = undoHistory.length === 0;
  const isEmptyRedoHistory = redoHistory.length === 0;

  return (
    <div className="flex h-10 items-center bg-neutral-800 p-2">
      <div className="mr-4 flex items-center">
        <div className="mr-2 h-5 w-5 bg-neutral-300" />
        <span className="text-sm text-neutral-300 select-none">
          {mousePos.x}, {mousePos.y}
        </span>
      </div>
      <div className="flex items-center">
        <div className="mr-2 h-5 w-5 bg-neutral-300" />
        <span className="text-sm text-neutral-300 select-none">
          {gridSize.x} x {gridSize.y}
        </span>
      </div>
      <div className="mr-2 ml-auto flex items-center">
        {zoomLevel > MIN_ZOOM_LEVEL ? (
          <Tooltip content="Zoom out (-)" side="top">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
              onClick={() => zoomStepTowardsCenter(false)}
            >
              <FaMinus size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Zoom out (-)" side="top">
            <button className="rounded-lg p-1" type="button">
              <FaMinus size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Reset zoom (Ctrl + 0)" side="top">
          <span
            className="cursor-pointer rounded-lg p-1 text-sm text-neutral-300 hover:bg-neutral-600"
            onClick={resetZoom}
          >
            {Math.round(zoomLevel * 100)}%
          </span>
        </Tooltip>
        {zoomLevel < MAX_ZOOM_LEVEL ? (
          <Tooltip content="Zoom in (+)" side="top">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
              onClick={() => zoomStepTowardsCenter(true)}
            >
              <FaPlus size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Zoom in (+)" side="top">
            <button className="rounded-lg p-1" type="button">
              <FaPlus size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        )}
      </div>
      <div>
        {isEmptyUndoHistory ? (
          <Tooltip content="Undo (Ctrl + Z)" side="top">
            <button className="rounded-lg p-1" type="button">
              <MdUndo size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Undo (Ctrl + Z)" side="top">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
              onClick={undo}
            >
              <MdUndo size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
        {isEmptyRedoHistory ? (
          <Tooltip content="Redo (Ctrl + Y)" side="top">
            <button className="rounded-lg p-1" type="button">
              <MdRedo size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Redo (Ctrl + Y)" side="top">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
              onClick={redo}
            >
              <MdRedo size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
