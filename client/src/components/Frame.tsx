import { useEditorStore } from "../store/editorStore";
import type { Frame } from "../types";

type FrameProps = {
  frame: Frame;
  number: number;
};

export default function Frame({ frame, number }: FrameProps) {
  const { activeFrameId, selectFrame } = useEditorStore();

  return (
    <div
      className={`relative h-24 min-w-24 cursor-pointer rounded-lg border-2 bg-white ${
        frame.id === activeFrameId
          ? "border-blue-500"
          : "border-neutral-600 hover:border-neutral-400"
      }`}
      onClick={() => selectFrame(frame.id)}
    >
      <div
        className={`absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-lg text-xs font-medium ${
          frame.id === activeFrameId
            ? "bg-blue-500 text-white"
            : "bg-neutral-200 text-black"
        }`}
      >
        {number}
      </div>
    </div>
  );
}
