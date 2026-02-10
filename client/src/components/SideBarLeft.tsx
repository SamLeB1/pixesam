import { useEditorStore } from "../store/editorStore";
import Tooltip from "./Tooltip";

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
      <div className="mb-2 grid grid-cols-2">
        <Tooltip content="Pencil tool (P)" side="right">
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("pencil")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip content="Eraser tool (E)" side="right">
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("eraser")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip content="Color picker tool (C)" side="right">
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("color-picker")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip content="Bucket tool (B)" side="right">
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("bucket")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip
          content={
            <>
              <h3>Line tool (L)</h3>
              <ul className="list-inside list-disc">
                <li className="text-neutral-300">Shift: Constrain angle</li>
              </ul>
            </>
          }
          side="right"
        >
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("line")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip
          content={
            <>
              <h3>Shape tool (H)</h3>
              <ul className="list-inside list-disc">
                <li className="text-neutral-300">Shift: Keep 1:1 ratio</li>
                <li className="text-neutral-300">Ctrl: Keep centered</li>
              </ul>
            </>
          }
          side="right"
        >
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("shape")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip
          content={
            <>
              <h3>Shade tool (D)</h3>
              <ul className="list-inside list-disc">
                <li className="text-neutral-300">Left-button: Darken</li>
                <li className="text-neutral-300">Right-button: Lighten</li>
              </ul>
            </>
          }
          side="right"
        >
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("shade")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip content="Select tool (S)" side="right">
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("select")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
        <Tooltip content="Move tool (M)" side="right">
          <button
            className="cursor-pointer p-2 hover:bg-neutral-600"
            type="button"
            onClick={() => selectTool("move")}
          >
            <div className="h-8 w-8 bg-white"></div>
          </button>
        </Tooltip>
      </div>
      <div className="relative mx-auto h-18 w-18">
        <Tooltip content="Primary color - Left-button to use" side="right">
          <input
            className="absolute top-0 left-0 z-1 h-2/3 w-2/3 cursor-pointer"
            type="color"
            id="color-primary"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
        </Tooltip>
        <Tooltip content="Secondary color - Right-button to use" side="right">
          <input
            className="absolute right-0 bottom-0 z-0 h-2/3 w-2/3 cursor-pointer"
            type="color"
            id="color-secondary"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
          />
        </Tooltip>
      </div>
    </div>
  );
}
