import { useEditorStore } from "../store/editorStore";

export default function SideBarLeft() {
  const {
    primaryColor,
    secondaryColor,
    selectTool,
    setPrimaryColor,
    setSecondaryColor,
  } = useEditorStore();

  return (
    <div className="min-w-28 bg-neutral-800 p-2">
      <div className="mb-2">
        <button
          className="cursor-pointer p-2 hover:bg-neutral-600"
          type="button"
          title="Pencil tool"
          onClick={() => selectTool("pencil")}
        >
          <div className="h-8 w-8 bg-white"></div>
        </button>
        <button
          className="cursor-pointer p-2 hover:bg-neutral-600"
          type="button"
          title="Eraser tool"
          onClick={() => selectTool("eraser")}
        >
          <div className="h-8 w-8 bg-white"></div>
        </button>
      </div>
      <div className="relative mx-auto h-18 w-18">
        <input
          className="absolute top-0 left-0 z-1 h-2/3 w-2/3 cursor-pointer"
          type="color"
          id="color-primary"
          title="Primary color - Left mouse button"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
        />
        <input
          className="absolute right-0 bottom-0 z-0 h-2/3 w-2/3 cursor-pointer"
          type="color"
          id="color-secondary"
          title="Secondary color - Right mouse button"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
        />
      </div>
    </div>
  );
}
