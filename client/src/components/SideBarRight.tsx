import CanvasPreview from "./CanvasPreview";
import ColorPaletteMenu from "./ColorPaletteMenu";

export default function SideBarRight() {
  return (
    <div className="min-w-68 bg-neutral-800 p-2">
      <CanvasPreview />
      <ColorPaletteMenu />
    </div>
  );
}
