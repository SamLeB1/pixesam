import { useRef } from "react";
import { MdAdd, MdEdit, MdFileUpload, MdFileDownload } from "react-icons/md";
import { toast } from "sonner";
import { usePaletteStore } from "../store/paletteStore";
import { paletteToGpl, parseGpl } from "../utils/gplConverter";
import PaletteColors from "./PaletteColors";
import ModalNewPalette from "./ModalNewPalette";
import ModalEditPalette from "./ModalEditPalette";

export default function ColorPaletteMenu() {
  const {
    palettes,
    selectedPaletteId,
    selectPalette,
    getSelectedPalette,
    addPalette,
  } = usePaletteStore();
  const selectedPalette = getSelectedPalette();
  const gplFileInputRef = useRef<HTMLInputElement>(null);

  function handleExportGpl() {
    const gplContent = paletteToGpl(selectedPalette);
    const blob = new Blob([gplContent], { type: "application/x-gimp-palette" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPalette.name}.gpl`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleGplFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedData = parseGpl(fileContent);
        if (!parsedData || parsedData.colors.length === 0) {
          toast.error("Failed to import the palette.");
          return;
        }

        addPalette({
          id: Math.random().toString(36).substring(2, 15),
          name: parsedData.name.trim() || "Imported palette",
          colors: parsedData.colors,
          isDefault: false,
        });
        toast.success("Palette imported successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to import the palette.");
      } finally {
        if (gplFileInputRef.current) gplFileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      console.error(reader.error);
      toast.error("Error reading the file.");
      if (gplFileInputRef.current) gplFileInputRef.current.value = "";
    };

    reader.readAsText(file);
  }

  return (
    <div>
      <div className="mb-2 flex items-center">
        <select
          className="select select-sm mr-auto w-1/2"
          id="palette-select"
          value={selectedPaletteId}
          onChange={(e) => selectPalette(e.target.value)}
        >
          {palettes.map((palette) => (
            <option key={palette.id} value={palette.id}>
              {palette.name}
            </option>
          ))}
        </select>
        <button
          className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
          type="button"
          title="New palette"
          onClick={() => {
            const modal = document.getElementById(
              "modal-new-palette",
            ) as HTMLDialogElement;
            if (modal) modal.showModal();
          }}
        >
          <MdAdd size={20} color="oklch(87% 0 0)" />
        </button>
        {selectedPalette.isDefault ? (
          <button
            className="cursor-not-allowed rounded-lg p-1"
            type="button"
            title="Cannot edit default palettes"
          >
            <MdEdit size={20} color="oklch(55.6% 0 0)" />
          </button>
        ) : (
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
            title="Edit palette"
            onClick={() => {
              const modal = document.getElementById(
                "modal-edit-palette",
              ) as HTMLDialogElement;
              if (modal) modal.showModal();
            }}
          >
            <MdEdit size={20} color="oklch(87% 0 0)" />
          </button>
        )}
        <button
          className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
          type="button"
          title="Import palette (.gpl)"
          onClick={() => gplFileInputRef.current?.click()}
        >
          <MdFileDownload size={20} color="oklch(87% 0 0)" />
        </button>
        <button
          className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
          type="button"
          title="Export palette (.gpl)"
          onClick={handleExportGpl}
        >
          <MdFileUpload size={20} color="oklch(87% 0 0)" />
        </button>
      </div>
      <PaletteColors colors={selectedPalette.colors} />
      <ModalNewPalette />
      <ModalEditPalette />
      <input
        ref={gplFileInputRef}
        className="hidden"
        type="file"
        accept=".gpl"
        onChange={handleGplFileChange}
      />
    </div>
  );
}
