import { useState } from "react";
import { MdArrowRight } from "react-icons/md";

type BtnEditProps = {
  isOpen: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onClose: () => void;
};

export default function BtnEdit({
  isOpen,
  onToggle,
  onHoverOpen,
}: BtnEditProps) {
  const [isRotateOpen, setIsRotateOpen] = useState(false);

  return (
    <div>
      <button
        className={`${isOpen && "bg-zinc-600"} cursor-pointer px-3 py-2 hover:bg-zinc-600`}
        type="button"
        onClick={onToggle}
        onMouseEnter={onHoverOpen}
      >
        Edit
      </button>
      {isOpen && (
        <div className="absolute z-1 w-40 bg-zinc-600">
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Undo
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Redo
          </button>
          <hr className="my-1 text-zinc-400" />
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Cut
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Copy
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Paste
          </button>
          <hr className="my-1 text-zinc-400" />
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Clear
          </button>
          <div
            className="relative"
            onMouseEnter={() => setIsRotateOpen(true)}
            onMouseLeave={() => setIsRotateOpen(false)}
          >
            <button
              className="flex w-full cursor-pointer items-center justify-between py-1 pl-2 text-start text-sm hover:bg-zinc-500"
              type="button"
            >
              Rotate
              <MdArrowRight size={20} />
            </button>
            {isRotateOpen && (
              <div className="absolute top-0 left-full w-32 bg-zinc-600">
                <button
                  className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                  type="button"
                >
                  180°
                </button>
                <button
                  className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                  type="button"
                >
                  90° CW
                </button>
                <button
                  className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
                  type="button"
                >
                  90° CCW
                </button>
              </div>
            )}
          </div>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Flip horizontal
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Flip vertical
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Transform
          </button>
          <hr className="my-1 text-zinc-400" />
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Replace color
          </button>
          <button
            className="w-full cursor-pointer px-2 py-1 text-start text-sm hover:bg-zinc-500"
            type="button"
          >
            Invert
          </button>
        </div>
      )}
    </div>
  );
}
