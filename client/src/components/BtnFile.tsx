import { useRef, useState } from "react";
import { toast } from "sonner";
import { useEditorStore } from "../store/editorStore";
import ModalNew from "./ModalNew";
import ModalResize from "./ModalResize";
import ModalExportToImage from "./ModalExportToImage";
import type { PxsmData } from "../types";

export default function BtnFile() {
  const { clearCanvas, importFromPxsm, importImage, exportToPxsm } =
    useEditorStore();
  const pxsmFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  function handlePxsmFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Your current work will be overwritten. Continue?")) {
      if (pxsmFileInputRef.current) pxsmFileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        const parsedData: PxsmData = JSON.parse(fileContent);
        importFromPxsm(parsedData);
      } catch (err) {
        console.error(err);
        toast.error(
          "The imported file is invalid and may have been corrupted.",
        );
      } finally {
        if (pxsmFileInputRef.current) pxsmFileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      console.error(reader.error);
      toast.error("Error reading the file.");
      if (pxsmFileInputRef.current) pxsmFileInputRef.current.value = "";
    };

    reader.readAsText(file);
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Your current work will be overwritten. Continue?")) {
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const dataURL = e.target?.result as string;
        importImage(dataURL);
      } catch (err) {
        console.error(err);
        toast.error("Error processing the image.");
      } finally {
        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      console.error(reader.error);
      toast.error("Error reading the file.");
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    };

    reader.readAsDataURL(file);
  }

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
            onClick={() => {
              setIsOpen(false);
              pxsmFileInputRef.current?.click();
            }}
          >
            Import .pxsm
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
            onClick={() => {
              setIsOpen(false);
              imageFileInputRef.current?.click();
            }}
          >
            Import image
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start hover:bg-neutral-500"
            type="button"
            onClick={() => {
              setIsOpen(false);
              const modal = document.getElementById(
                "modal-export-to-image",
              ) as HTMLDialogElement;
              if (modal) modal.showModal();
            }}
          >
            Export
          </button>
        </div>
      )}
      <input
        ref={pxsmFileInputRef}
        className="hidden"
        type="file"
        accept=".pxsm, application/json"
        onChange={handlePxsmFileChange}
      />
      <input
        ref={imageFileInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
      />
      <ModalNew />
      <ModalResize />
      <ModalExportToImage />
    </div>
  );
}
