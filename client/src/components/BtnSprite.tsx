import { useState } from "react";
import { MdArrowRight } from "react-icons/md";
import { useEditorStore } from "../store/editorStore";
import ModalResize from "./ModalResize";

type BtnSpriteProps = {
  isOpen: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onClose: () => void;
};

export default function BtnSprite({
  isOpen,
  onToggle,
  onHoverOpen,
  onClose,
}: BtnSpriteProps) {
  const {
    showSelectionPreview,
    cropToSelection,
    trimCanvas,
    rotateCanvas,
    flipCanvas,
  } = useEditorStore();
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const cropEnabled = showSelectionPreview;

  return (
    <>
      <div>
        <button
          className={`${isOpen && "bg-zinc-600"} cursor-pointer px-3 py-2 hover:bg-zinc-600`}
          type="button"
          onClick={onToggle}
          onMouseEnter={onHoverOpen}
        >
          Sprite
        </button>
        {isOpen && (
          <div className="absolute z-1 w-40 bg-zinc-600">
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                const modal = document.getElementById(
                  "modal-resize",
                ) as HTMLDialogElement;
                if (modal) modal.showModal();
              }}
            >
              Resize
            </button>
            {cropEnabled ? (
              <button
                className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                type="button"
                onClick={() => {
                  onClose();
                  cropToSelection();
                }}
              >
                Crop
              </button>
            ) : (
              <button
                className="w-full px-2 py-1 text-start text-sm text-zinc-400"
                type="button"
                disabled
              >
                Crop
              </button>
            )}
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                trimCanvas();
              }}
            >
              Trim
            </button>
            <hr className="my-1 text-zinc-400" />
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
                      rotateCanvas(180);
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
                      rotateCanvas(90);
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
                      rotateCanvas(270);
                    }}
                  >
                    90° CCW
                  </button>
                </div>
              )}
            </div>
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                flipCanvas("horizontal");
              }}
            >
              Flip horizontal
            </button>
            <button
              className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
              type="button"
              onClick={() => {
                onClose();
                flipCanvas("vertical");
              }}
            >
              Flip vertical
            </button>
          </div>
        )}
      </div>
      <ModalResize />
    </>
  );
}
