import { useState } from "react";
import { MdArrowRight } from "react-icons/md";
import { useEditorStore } from "../store/editorStore";

type BtnEditProps = {
  isOpen: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onClose: () => void;
};

export default function BtnEdit({
  isOpen,
  onToggle,
  onHoverOpen,
  onClose,
}: BtnEditProps) {
  const {
    showSelectionPreview,
    undoHistory,
    redoHistory,
    clipboard,
    getActiveLayer,
    undo,
    redo,
    cut,
    copy,
    paste,
    clearEdit,
    rotateEdit,
  } = useEditorStore();
  const [isRotateOpen, setIsRotateOpen] = useState(false);

  const layer = getActiveLayer();
  const undoEnabled = undoHistory.length > 0;
  const redoEnabled = redoHistory.length > 0;
  const cutEnabled = showSelectionPreview && !layer.locked;
  const copyEnabled = showSelectionPreview;
  const pasteEnabled = clipboard && !layer.locked;
  const clearEnabled = !layer.locked;
  const rotateEnabled = !layer.locked;

  return (
    <div>
      <button
        className={`${isOpen && "bg-zinc-600"} cursor-pointer px-3 py-2 hover:bg-zinc-600`}
        type="button"
        onClick={onToggle}
        onMouseEnter={onHoverOpen}
      >
        Edit
      </button>
      {isOpen && (
        <div className="absolute z-1 w-40 bg-zinc-600">
          {undoEnabled ? (
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                undo();
              }}
            >
              Undo
            </button>
          ) : (
            <button
              className="w-full px-2 py-1 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Undo
            </button>
          )}
          {redoEnabled ? (
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                redo();
              }}
            >
              Redo
            </button>
          ) : (
            <button
              className="w-full px-2 py-1 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Redo
            </button>
          )}
          <hr className="my-1 text-zinc-400" />
          {cutEnabled ? (
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                cut();
              }}
            >
              Cut
            </button>
          ) : (
            <button
              className="w-full px-2 py-1 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Cut
            </button>
          )}
          {copyEnabled ? (
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                copy();
              }}
            >
              Copy
            </button>
          ) : (
            <button
              className="w-full px-2 py-1 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Copy
            </button>
          )}
          {pasteEnabled ? (
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                paste();
              }}
            >
              Paste
            </button>
          ) : (
            <button
              className="w-full px-2 py-1 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Paste
            </button>
          )}
          <hr className="my-1 text-zinc-400" />
          {clearEnabled ? (
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                clearEdit();
              }}
            >
              Clear
            </button>
          ) : (
            <button
              className="w-full px-2 py-1 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Clear
            </button>
          )}
          {rotateEnabled ? (
            <div
              className="relative"
              onMouseEnter={() => setIsRotateOpen(true)}
              onMouseLeave={() => setIsRotateOpen(false)}
            >
              <button
                className="flex w-full cursor-pointer items-center justify-between py-1 pl-2 text-start text-sm hover:bg-zinc-500"
                type="button"
              >
                Rotate
                <MdArrowRight size={20} />
              </button>
              {isRotateOpen && (
                <div className="absolute top-0 left-full w-32 bg-zinc-600">
                  <button
                    className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsRotateOpen(false);
                      rotateEdit(180);
                    }}
                  >
                    180°
                  </button>
                  <button
                    className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsRotateOpen(false);
                      rotateEdit(90);
                    }}
                  >
                    90° CW
                  </button>
                  <button
                    className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsRotateOpen(false);
                      rotateEdit(270);
                    }}
                  >
                    90° CCW
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="flex w-full items-center justify-between py-1 pl-2 text-start text-sm text-zinc-400"
              type="button"
              disabled
            >
              Rotate
              <MdArrowRight size={20} color="oklch(70.5% 0.015 286.067)" />
            </button>
          )}
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Flip horizontal
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Flip vertical
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Transform
          </button>
          <hr className="my-1 text-zinc-400" />
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Replace color
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Invert
          </button>
        </div>
      )}
    </div>
  );
}
