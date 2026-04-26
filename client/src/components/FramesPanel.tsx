import { useState } from "react";
import {
  MdPlayArrow,
  MdPause,
  MdChevronLeft,
  MdChevronRight,
  MdSkipPrevious,
  MdSkipNext,
  MdArrowDropUp,
  MdArrowDropDown,
  MdAdd,
  MdContentCopy,
  MdDelete,
  MdArrowBack,
  MdArrowForward,
} from "react-icons/md";
import { useEditorStore } from "../store/editorStore";
import Frame from "./Frame";
import Tooltip from "./Tooltip";
import { DEFAULT_FPS } from "../constants";

export default function FramesPanel() {
  const {
    frames,
    activeFrameId,
    selectFrame,
    newFrame,
    duplicateFrame,
    deleteFrame,
    moveFrameLeft,
    moveFrameRight,
  } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeFrameIndex = frames.findIndex(
    (frame) => frame.id === activeFrameId,
  );

  return (
    <>
      <div className={`w-full ${isOpen && "absolute bottom-0"}`}>
        <div
          className="bg-main-semi-light flex h-10 cursor-pointer items-center justify-between border-t border-neutral-400 px-4 hover:bg-neutral-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <span className="mr-2 text-sm text-neutral-300">
              Frame: {activeFrameIndex + 1}/{frames.length}
            </span>
            <Tooltip content="Go to first frame" side="top">
              <button
                className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectFrame(frames[0].id);
                }}
              >
                <MdSkipPrevious size={20} />
              </button>
            </Tooltip>
            <Tooltip content="Go to previous frame" side="top">
              <button
                className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeFrameIndex > 0)
                    selectFrame(frames[activeFrameIndex - 1].id);
                }}
              >
                <MdChevronLeft size={20} />
              </button>
            </Tooltip>
            {isPlaying ? (
              <Tooltip content="Pause animation" side="top">
                <button
                  className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(false);
                  }}
                >
                  <MdPause size={20} />
                </button>
              </Tooltip>
            ) : (
              <Tooltip content="Play animation" side="top">
                <button
                  className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(true);
                  }}
                >
                  <MdPlayArrow size={20} />
                </button>
              </Tooltip>
            )}
            <Tooltip content="Go to next frame" side="top">
              <button
                className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeFrameIndex < frames.length - 1)
                    selectFrame(frames[activeFrameIndex + 1].id);
                }}
              >
                <MdChevronRight size={20} />
              </button>
            </Tooltip>
            <Tooltip content="Go to last frame" side="top">
              <button
                className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectFrame(frames[frames.length - 1].id);
                }}
              >
                <MdSkipNext size={20} />
              </button>
            </Tooltip>
          </div>
          <div className="flex items-center" title="Toggle frames panel">
            <span className="mr-1 text-sm font-medium">Frames</span>
            {isOpen ? (
              <MdArrowDropDown size={20} />
            ) : (
              <MdArrowDropUp size={20} />
            )}
          </div>
        </div>
        {isOpen && (
          <div className="bg-neutral-900">
            <div className="flex h-10 items-center p-2">
              <Tooltip content="New frame" side="top">
                <button
                  className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                  type="button"
                  onClick={() => newFrame()}
                >
                  <MdAdd size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Duplicate frame" side="top">
                <button
                  className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                  type="button"
                  onClick={duplicateFrame}
                >
                  <MdContentCopy size={20} />
                </button>
              </Tooltip>
              {frames.length > 1 ? (
                <Tooltip content="Delete frame" side="top">
                  <button
                    className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                    type="button"
                    onClick={deleteFrame}
                  >
                    <MdDelete size={20} />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip content="Delete frame" side="top">
                  <button className="rounded-lg p-1" type="button" disabled>
                    <MdDelete size={20} color="oklch(55.6% 0 0)" />
                  </button>
                </Tooltip>
              )}
              {activeFrameIndex > 0 ? (
                <Tooltip content="Move frame left" side="top">
                  <button
                    className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                    type="button"
                    onClick={moveFrameLeft}
                  >
                    <MdArrowBack size={20} />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip content="Move frame left" side="top">
                  <button className="rounded-lg p-1" type="button" disabled>
                    <MdArrowBack size={20} color="oklch(55.6% 0 0)" />
                  </button>
                </Tooltip>
              )}
              {activeFrameIndex < frames.length - 1 ? (
                <Tooltip content="Move frame right" side="top">
                  <button
                    className="mr-auto cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                    type="button"
                    onClick={moveFrameRight}
                  >
                    <MdArrowForward size={20} />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip content="Move frame right" side="top">
                  <button
                    className="mr-auto rounded-lg p-1"
                    type="button"
                    disabled
                  >
                    <MdArrowForward size={20} color="oklch(55.6% 0 0)" />
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Frames per second" side="top">
                <label className="label mr-2 flex items-center text-sm text-white">
                  FPS
                  <input
                    className="input input-xs ml-1 w-12 pl-2"
                    type="number"
                    min="1"
                    max="60"
                    defaultValue={DEFAULT_FPS}
                  />
                </label>
              </Tooltip>
              <Tooltip content="Onion skin" side="top">
                <button
                  className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
                  type="button"
                >
                  <div className="h-5 w-5 bg-white" />
                </button>
              </Tooltip>
            </div>
            <div className="flex gap-2 overflow-x-auto p-2">
              {frames.map((frame, i) => (
                <Frame key={frame.id} frame={frame} number={i + 1} />
              ))}
              <Tooltip content="New frame" side="top">
                <button
                  className="flex h-24 min-w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-600 text-neutral-400 hover:border-neutral-400 hover:text-neutral-200"
                  type="button"
                  onClick={() => newFrame(true)}
                >
                  <MdAdd size={32} />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
      {isOpen && <div className="h-10 w-full" />}
    </>
  );
}
