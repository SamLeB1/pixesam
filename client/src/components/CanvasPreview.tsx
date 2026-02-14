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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw checkerboard
    const pxSize = canvasSize.width / gridSize.x;
    ctx.fillStyle = CHECKER_LIGHT;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.fillStyle = CHECKER_DARK;
    for (let y = 0; y < gridSize.y; y++)
      for (let x = 0; x < gridSize.x; x++)
        if (y % 2 === x % 2)
          ctx.fillRect(x * pxSize, y * pxSize, pxSize, pxSize);

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
  }, [pixelData, gridSize, canvasSize]);

  return (
    <div
      className="mb-4 flex items-center justify-center bg-black"
      style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </div>
  );
}
