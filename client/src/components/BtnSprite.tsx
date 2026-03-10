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
  const { showSelectionPreview, cropToSelection } = useEditorStore();
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
            >
              Trim
            </button>
          </div>
        )}
      </div>
      <ModalResize />
    </>
  );
}
