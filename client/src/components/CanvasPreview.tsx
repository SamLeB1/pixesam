import { useEffect, useMemo, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { CHECKER_LIGHT, CHECKER_DARK } from "../constants";

const CONTAINER_WIDTH = 256;
const CONTAINER_HEIGHT = 128;

export default function CanvasPreview() {
  const { pixelData, gridSize } = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasSize = useMemo(() => {
    const aspect = gridSize.x / gridSize.y;
    const containerAspect = CONTAINER_WIDTH / CONTAINER_HEIGHT;
    if (containerAspect > aspect) {
      return {
        width: Math.floor(CONTAINER_HEIGHT * aspect),
        height: CONTAINER_HEIGHT,
      };
    } else {
      return {
        width: CONTAINER_WIDTH,
        height: Math.floor(CONTAINER_WIDTH / aspect),
      };
    }
  }, [gridSize]);

  const checkerPattern = useMemo(() => {
    const pxSize = canvasSize.width / gridSize.x;
    const tileSize = pxSize * 2;
    const tile = document.createElement("canvas");
    tile.width = Math.max(1, Math.round(tileSize));
    tile.height = Math.max(1, Math.round(tileSize));
    const tCtx = tile.getContext("2d")!;
    tCtx.fillStyle = CHECKER_LIGHT;
    tCtx.fillRect(0, 0, tileSize, tileSize);
    tCtx.fillStyle = CHECKER_DARK;
    tCtx.fillRect(0, 0, pxSize, pxSize);
    tCtx.fillRect(pxSize, pxSize, pxSize, pxSize);
    return tile;
  }, [gridSize, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw checkerboard
    const pattern = ctx.createPattern(checkerPattern, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    // Draw pixel data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = gridSize.x;
    tempCanvas.height = gridSize.y;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      const imageData = new ImageData(
        pixelData as ImageDataArray,
        gridSize.x,
        gridSize.y,
      );
      tempCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, canvasSize.width, canvasSize.height);
    }
  }, [pixelData, gridSize, canvasSize, checkerPattern]);

  return (
    <div
      className="mb-4 flex items-center justify-center bg-black"
      style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
    >
      <canvas
        className="bg-white"
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </div>
  );
}
