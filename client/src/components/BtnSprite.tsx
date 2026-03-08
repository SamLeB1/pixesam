import { useState, useRef } from "react";
import useClickOutside from "../hooks/useClickOutside";

export default function BtnSprite() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button
        className={`${isOpen && "bg-zinc-600"} cursor-pointer px-3 py-2 hover:bg-zinc-600`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        Sprite
      </button>
      {isOpen && (
        <div className="absolute z-1 w-40 bg-zinc-600">
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Resize
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Crop
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Trim
          </button>
        </div>
      )}
    </div>
  );
}
