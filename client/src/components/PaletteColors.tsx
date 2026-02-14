import { useEditorStore } from "../store/editorStore";

type PaletteColorsProps = {
  colors: string[];
};

export default function PaletteColors({ colors }: PaletteColorsProps) {
  const { setPrimaryColor, setSecondaryColor } = useEditorStore();

  return (
    <div className="grid max-h-32 grid-cols-6 gap-1 overflow-x-hidden overflow-y-scroll">
      {colors.map((color, i) => (
        <div
          key={i}
          className="h-9 w-9 cursor-pointer hover:border hover:border-white"
          style={{ backgroundColor: color }}
          title={color}
          onClick={() => setPrimaryColor(color)}
          onContextMenu={(e) => {
            e.preventDefault();
            setSecondaryColor(color);
          }}
        ></div>
      ))}
    </div>
  );
}
