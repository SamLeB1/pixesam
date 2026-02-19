import { useState } from "react";
import {
  MdSettings,
  MdVisibility,
  MdVisibilityOff,
  MdLock,
  MdLockOpen,
  MdAdd,
  MdContentCopy,
  MdArrowUpward,
  MdArrowDownward,
  MdKeyboardArrowDown,
  MdKeyboardDoubleArrowDown,
  MdDelete,
} from "react-icons/md";
import Tooltip from "./Tooltip";

type Layer = {
  id: number;
  name: string;
  visible: boolean;
  locked: boolean;
};

const initialLayers: Layer[] = [
  { id: 1, name: "Layer 1", visible: true, locked: false },
];

export default function LayersMenu() {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState(
    initialLayers[initialLayers.length - 1].id,
  );

  function toggleVisibility(id: number) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    );
  }

  function toggleLock(id: number) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    );
  }

  function isTopLayer(id: number) {
    return layers.length > 0 && layers[layers.length - 1].id === id;
  }

  function isBottomLayer(id: number) {
    return layers.length > 0 && layers[0].id === id;
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center">
        <span className="mr-auto text-sm select-none">
          Layers ({layers.length})
        </span>
        {layers.length < 2 ? (
          <Tooltip content="Flatten layers" side="top">
            <button className="rounded-lg p-1" type="button" disabled>
              <MdKeyboardDoubleArrowDown size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Flatten layers" side="top">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
            >
              <MdKeyboardDoubleArrowDown size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Layer properties" side="top">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdSettings size={20} color="oklch(87% 0 0)" />
          </button>
        </Tooltip>
      </div>
      <div
        className={`mb-2 max-h-24 overflow-x-hidden bg-neutral-900 ${layers.length > 3 && "overflow-y-scroll"}`}
      >
        <div className="min-h-24">
          {[...layers].reverse().map((layer) => (
            <div
              key={layer.id}
              className={`flex cursor-pointer items-center ${selectedLayerId === layer.id ? "bg-neutral-700" : "hover:bg-main-semi-dark"}`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <button
                className={`mr-2 cursor-pointer p-2 ${selectedLayerId === layer.id ? "hover:bg-neutral-600" : "hover:bg-main-semi-light"}`}
                type="button"
                title="Visibility"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(layer.id);
                }}
              >
                {layer.visible ? (
                  <MdVisibility size={16} color="oklch(87% 0 0)" />
                ) : (
                  <MdVisibilityOff size={16} color="oklch(55.6% 0 0)" />
                )}
              </button>
              <p
                className="mr-auto text-sm text-neutral-300 select-none"
                title={layer.name}
              >
                {layer.name}
              </p>
              <button
                className={`cursor-pointer p-2 ${selectedLayerId === layer.id ? "hover:bg-neutral-600" : "hover:bg-main-semi-light"}`}
                type="button"
                title="Lock/unlock"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(layer.id);
                }}
              >
                {layer.locked ? (
                  <MdLock size={16} color="oklch(87% 0 0)" />
                ) : (
                  <MdLockOpen size={16} color="oklch(55.6% 0 0)" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center">
        <Tooltip content="New layer" side="bottom">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdAdd size={20} color="oklch(87% 0 0)" />
          </button>
        </Tooltip>
        <Tooltip content="Duplicate layer" side="bottom">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
            type="button"
          >
            <MdContentCopy size={20} color="oklch(87% 0 0)" />
          </button>
        </Tooltip>
        {isTopLayer(selectedLayerId) ? (
          <Tooltip content="Move layer up" side="bottom">
            <button className="rounded-lg p-1" type="button" disabled>
              <MdArrowUpward size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Move layer up" side="bottom">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
            >
              <MdArrowUpward size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
        {isBottomLayer(selectedLayerId) ? (
          <Tooltip content="Move layer down" side="bottom">
            <button className="rounded-lg p-1" type="button" disabled>
              <MdArrowDownward size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Move layer down" side="bottom">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
            >
              <MdArrowDownward size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
        {isBottomLayer(selectedLayerId) ? (
          <Tooltip content="Merge layer down" side="bottom">
            <button className="rounded-lg p-1" type="button" disabled>
              <MdKeyboardArrowDown size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Merge layer down" side="bottom">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
            >
              <MdKeyboardArrowDown size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
        {layers.length < 2 ? (
          <Tooltip content="Delete layer" side="bottom">
            <button className="rounded-lg p-1" type="button" disabled>
              <MdDelete size={20} color="oklch(55.6% 0 0)" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Delete layer" side="bottom">
            <button
              className="cursor-pointer rounded-lg p-1 hover:bg-neutral-600"
              type="button"
            >
              <MdDelete size={20} color="oklch(87% 0 0)" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
