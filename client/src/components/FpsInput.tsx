import { useState } from "react";
import Tooltip from "./Tooltip";
import { useEditorStore } from "../store/editorStore";
import { MIN_FPS, MAX_FPS } from "../constants";

type FpsInputProps = {
  className?: string;
};

export default function FpsInput({ className }: FpsInputProps) {
  const { fps, setFps } = useEditorStore();
  const [isEmptyFpsInput, setIsEmptyFpsInput] = useState(false);

  function handleChangeFps(e: React.ChangeEvent<HTMLInputElement>) {
    let value = parseInt(e.target.value);
    if (isNaN(value)) {
      setFps(MIN_FPS);
      setIsEmptyFpsInput(true);
    } else {
      if (value < MIN_FPS) value = MIN_FPS;
      if (value > MAX_FPS) value = MAX_FPS;
      setFps(value);
      setIsEmptyFpsInput(false);
    }
  }

  return (
    <Tooltip content="Frames per second" side="top">
      <label className={`label text-sm text-white ${className && className}`}>
        FPS
        <input
          className="input input-xs ml-1 w-12 pl-2"
          type="number"
          min={MIN_FPS}
          max={MAX_FPS}
          value={isEmptyFpsInput ? "" : fps}
          onChange={handleChangeFps}
          onBlur={() => {
            if (isEmptyFpsInput) {
              setFps(MIN_FPS);
              setIsEmptyFpsInput(false);
            }
          }}
        />
      </label>
    </Tooltip>
  );
}
