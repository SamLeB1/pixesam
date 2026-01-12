import { useState, useRef } from "react";
import { MdAdd, MdClose, MdColorLens } from "react-icons/md";
import { usePaletteStore } from "../store/paletteStore";
import { useEditorStore } from "../store/editorStore";
import { extractColorsFromPixelData } from "../utils/colorExtractor";

const DEFAULT_COLOR_PICKER_VALUE = "#000000";

export default function ModalNewPalette() {
  const { addPalette } = usePaletteStore();
  const [name, setName] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName("");
    setColors([]);
    if (colorInputRef.current)
      colorInputRef.current.value = DEFAULT_COLOR_PICKER_VALUE;
  }

  function handleAddColor() {
    if (colorInputRef.current) {
      const newColor = colorInputRef.current.value;
      setColors([...colors, newColor]);
    }
  }

  function handleAddColorsFromDrawing() {
    const { pixelData } = useEditorStore.getState();
    const extractedColors = extractColorsFromPixelData(pixelData);
    const existingColorsLower = colors.map((c) => c.toLowerCase());
    const newColors = extractedColors.filter(
      (color) => !existingColorsLower.includes(color.toLowerCase()),
    );
    if (newColors.length > 0) {
      setColors([...colors, ...newColors]);
    }
  }

  function handleRemoveColor(index: number) {
    setColors(colors.filter((_, i) => i !== index));
  }

  function handleEditColor(index: number, newColor: string) {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
  }

  function handleSave() {
    addPalette({
      id: Math.random().toString(36).substring(2, 15),
      name: name.trim(),
      colors,
      isDefault: false,
    });
    resetForm();
    dialogRef.current?.close();
  }

  function handleClose() {
    resetForm();
  }

  return (
    <dialog ref={dialogRef} id="modal-new-palette" className="modal">
      <div className="modal-box w-fit max-w-none">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
            onClick={handleClose}
          >
            ✕
          </button>
        </form>
        <h3 className="mb-4 text-2xl font-medium text-white">
          Create a new palette
        </h3>
        <div className="mb-4">
          <label className="label mb-1 block" htmlFor="name-input">
            Name
          </label>
          <input
            className="input w-1/2"
            type="text"
            id="name-input"
            placeholder="Enter palette name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-2 flex items-center">
          <input
            className="mr-2 h-10 w-10 cursor-pointer"
            type="color"
            ref={colorInputRef}
            title="Change color"
            defaultValue={DEFAULT_COLOR_PICKER_VALUE}
          />
          <button
            className="btn btn-sm btn-primary mr-2"
            type="button"
            onClick={handleAddColor}
          >
            <MdAdd size={16} />
            Add color
          </button>
          <button
            className="btn btn-sm btn-secondary"
            type="button"
            onClick={handleAddColorsFromDrawing}
          >
            <MdColorLens size={16} />
            Add from drawing
          </button>
        </div>
        {colors.length === 0 ? (
          <p className="mb-4 w-122 rounded-lg bg-neutral-700 p-2 text-center text-neutral-300">
            No colors added
          </p>
        ) : (
          <div
            className={`mb-4 grid w-122 grid-cols-10 gap-2 overflow-x-hidden rounded-lg bg-neutral-700 p-2 ${colors.length > 30 && "max-h-32 overflow-y-auto"}`}
          >
            {colors.map((color, index) => (
              <div key={index} className="group relative">
                <label
                  className="block h-10 w-10 cursor-pointer rounded-lg border-2 border-transparent hover:border-white"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  <input
                    className="invisible absolute bottom-0"
                    type="color"
                    value={color}
                    onChange={(e) => handleEditColor(index, e.target.value)}
                  />
                </label>
                <button
                  className="absolute -top-1 -right-1 hidden h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 group-hover:flex hover:bg-red-400"
                  type="button"
                  onClick={() => handleRemoveColor(index)}
                >
                  <MdClose size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-soft mr-2" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!name.trim() || colors.length === 0}
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
