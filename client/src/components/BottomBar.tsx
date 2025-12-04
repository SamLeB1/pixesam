import { MdUndo, MdRedo } from "react-icons/md";
import { useEditorStore } from "../store/editorStore";

export default function BottomBar() {
  const { undoHistory, redoHistory, undo, redo } = useEditorStore();
  const isEmptyUndoHistory = undoHistory.length === 0;
  const isEmptyRedoHistory = redoHistory.length === 0;

  return (
    <div className="flex h-10 items-center bg-neutral-800 p-2">
      <div className="ml-auto">
        {isEmptyUndoHistory ? (
          <button
            className="rounded-lg p-1"
            type="button"
            title="Undo (Ctrl + Z)"
          >
            <MdUndo size={24} color="oklch(55.6% 0 0)" />
          </button>
        ) : (
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Undo (Ctrl + Z)"
            onClick={undo}
          >
            <MdUndo size={24} color="oklch(87% 0 0)" />
          </button>
        )}
        {isEmptyRedoHistory ? (
          <button
            className="rounded-lg p-1"
            type="button"
            title="Redo (Ctrl + Y)"
          >
            <MdRedo size={24} color="oklch(55.6% 0 0)" />
          </button>
        ) : (
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Redo (Ctrl + Y)"
            onClick={redo}
          >
            <MdRedo size={24} color="oklch(87% 0 0)" />
          </button>
        )}
      </div>
    </div>
  );
}
