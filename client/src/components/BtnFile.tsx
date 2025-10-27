import { useState } from "react";
import ModalResize from "./ModalResize";

export default function BtnFile() {
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
        <div className="absolute w-40 bg-neutral-600">
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
          >
            2
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
          >
            3
          </button>
        </div>
      )}
      <ModalResize />
    </div>
  );
}
