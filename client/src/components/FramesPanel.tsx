import {
  MdPlayArrow,
  MdChevronLeft,
  MdChevronRight,
  MdSkipPrevious,
  MdSkipNext,
  MdArrowDropUp,
} from "react-icons/md";
import Tooltip from "./Tooltip";

export default function FramesPanel() {
  return (
    <div className="bg-main-semi-light flex h-10 cursor-pointer items-center justify-between border-t border-neutral-400 px-4 hover:bg-neutral-700">
      <div className="flex items-center">
        <span className="mr-2 text-sm text-neutral-300">Frame: 1/1</span>
        <Tooltip content="Go to first frame" side="top">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdSkipPrevious size={20} />
          </button>
        </Tooltip>
        <Tooltip content="Go to previous frame" side="top">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdChevronLeft size={20} />
          </button>
        </Tooltip>
        <Tooltip content="Play animation" side="top">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdPlayArrow size={20} />
          </button>
        </Tooltip>
        <Tooltip content="Go to next frame" side="top">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdChevronRight size={20} />
          </button>
        </Tooltip>
        <Tooltip content="Go to last frame" side="top">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdSkipNext size={20} />
          </button>
        </Tooltip>
      </div>
      <div className="flex items-center" title="Toggle frames panel">
        <span className="mr-1 text-sm font-medium">Frames</span>
        <MdArrowDropUp size={20} />
      </div>
    </div>
  );
}
