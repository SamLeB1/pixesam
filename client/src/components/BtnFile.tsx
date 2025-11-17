import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import ModalNew from "./ModalNew";
import ModalResize from "./ModalResize";

export default function BtnFile() {
  const { clearCanvas, exportToPxsm } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className={`${isOpen && "bg-neutral-600"} cursor-pointer p-2 hover:bg-neutral-600`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        File
      </button>
      {isOpen && (
        <div className="absolute z-1 w-40 bg-neutral-600">
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
            onClick={() => {
              setIsOpen(false);
              const modal = document.getElementById(
                "modal-new",
              ) as HTMLDialogElement;
              if (modal) modal.showModal();
            }}
          >
            New
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (window.confirm("Are you sure you want to clear the canvas?"))
                clearCanvas();
            }}
          >
            Clear
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
            onClick={() => {
              setIsOpen(false);
              const modal = document.getElementById(
                "modal-resize",
              ) as HTMLDialogElement;
              if (modal) modal.showModal();
            }}
          >
            Resize
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
            onClick={() => {
              setIsOpen(false);
              exportToPxsm();
            }}
          >
            Save as .pxsm
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
          >
            Import .pxsm
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
          >
            Import image
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
          >
            Export
          </button>
        </div>
      )}
      <ModalNew />
      <ModalResize />
    </div>
  );
}
