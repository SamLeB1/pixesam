import { MdAdd, MdEdit } from "react-icons/md";
import { usePaletteStore } from "../store/paletteStore";
import PaletteColors from "./PaletteColors";
import ModalNewPalette from "./ModalNewPalette";
import ModalEditPalette from "./ModalEditPalette";

export default function ColorPaletteMenu() {
  const { palettes, selectedPaletteId, selectPalette, getSelectedPalette } =
    usePaletteStore();
  const selectedPalette = getSelectedPalette();

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
      </div>
      <PaletteColors colors={selectedPalette.colors} />
      <ModalNewPalette />
      <ModalEditPalette />
    </div>
  );
}
