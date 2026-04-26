import { useEffect, useMemo, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { compositeLayers } from "../utils/layers";
import { CHECKER_LIGHT, CHECKER_DARK } from "../constants";
import type { Frame, LayerWithCel } from "../types";

const THUMB_SIZE = 96;

type FrameProps = {
  frame: Frame;
  number: number;
};

export default function Frame({ frame, number }: FrameProps) {
  const { activeFrameId, layers, cels, gridSize, getCel, selectFrame } =
    useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasSize = useMemo(() => {
    const aspect = gridSize.x / gridSize.y;
    if (aspect >= 1) {
      return {
        width: THUMB_SIZE,
        height: Math.max(1, Math.floor(THUMB_SIZE / aspect)),
      };
    }
    return {
      width: Math.max(1, Math.floor(THUMB_SIZE * aspect)),
      height: THUMB_SIZE,
    };
  }, [gridSize]);

  const checkerPattern = useMemo(() => {
    const pxSize = canvasSize.width / gridSize.x;
    const tileSize = Math.max(1, Math.round(pxSize * 2));
    const tile = document.createElement("canvas");
    tile.width = tileSize;
    tile.height = tileSize;
    const tCtx = tile.getContext("2d")!;
    tCtx.fillStyle = CHECKER_LIGHT;
    tCtx.fillRect(0, 0, tileSize, tileSize);
    tCtx.fillStyle = CHECKER_DARK;
    tCtx.fillRect(0, 0, pxSize, pxSize);
    tCtx.fillRect(pxSize, pxSize, pxSize, pxSize);
    return tile;
  }, [gridSize, canvasSize]);

  const composited = useMemo(() => {
    const layersToComposite: LayerWithCel[] = layers.map((layer) => ({
      ...layer,
      cel: getCel(layer.id, frame.id),
    }));
    return compositeLayers(layersToComposite, gridSize.x, gridSize.y);
  }, [layers, cels, frame.id, gridSize.x, gridSize.y, getCel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const pattern = ctx.createPattern(checkerPattern, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = gridSize.x;
    tempCanvas.height = gridSize.y;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      const imageData = new ImageData(
        composited as ImageDataArray,
        gridSize.x,
        gridSize.y,
      );
      tempCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, canvasSize.width, canvasSize.height);
    }
  }, [gridSize, canvasSize, checkerPattern, composited]);

  return (
    <div
      className={`relative flex h-24 min-w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 bg-black ${
        frame.id === activeFrameId
          ? "border-blue-500"
          : "border-neutral-600 hover:border-neutral-400"
      }`}
      onClick={() => selectFrame(frame.id)}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
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
