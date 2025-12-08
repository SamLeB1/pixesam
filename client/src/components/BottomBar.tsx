import { FaMinus, FaPlus } from "react-icons/fa";
import { MdUndo, MdRedo } from "react-icons/md";
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
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Zoom out (-)"
            onClick={() => zoomStepTowardsCenter(false)}
          >
            <FaMinus size={20} color="oklch(87% 0 0)" />
          </button>
        ) : (
          <button className="rounded-lg p-1" type="button" title="Zoom out (-)">
            <FaMinus size={20} color="oklch(55.6% 0 0)" />
          </button>
        )}
        <span
          className="cursor-pointer rounded-lg p-1 text-sm text-neutral-300 hover:bg-neutral-600"
          title="Reset zoom (Ctrl + 0)"
          onClick={resetZoom}
        >
          {Math.round(zoomLevel * 100)}%
        </span>
        {zoomLevel < MAX_ZOOM_LEVEL ? (
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Zoom in (+)"
            onClick={() => zoomStepTowardsCenter(true)}
          >
            <FaPlus size={20} color="oklch(87% 0 0)" />
          </button>
        ) : (
          <button className="rounded-lg p-1" type="button" title="Zoom in (+)">
            <FaPlus size={20} color="oklch(55.6% 0 0)" />
          </button>
        )}
      </div>
      <div>
        {isEmptyUndoHistory ? (
          <button
            className="rounded-lg p-1"
            type="button"
            title="Undo (Ctrl + Z)"
          >
            <MdUndo size={20} color="oklch(55.6% 0 0)" />
          </button>
        ) : (
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Undo (Ctrl + Z)"
            onClick={undo}
          >
            <MdUndo size={20} color="oklch(87% 0 0)" />
          </button>
        )}
        {isEmptyRedoHistory ? (
          <button
            className="rounded-lg p-1"
            type="button"
            title="Redo (Ctrl + Y)"
          >
            <MdRedo size={20} color="oklch(55.6% 0 0)" />
          </button>
        ) : (
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Redo (Ctrl + Y)"
            onClick={redo}
          >
            <MdRedo size={20} color="oklch(87% 0 0)" />
          </button>
        )}
      </div>
    </div>
  );
}
