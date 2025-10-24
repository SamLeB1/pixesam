import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { hexToRgba } from "../utils/convertColor";

const MIN_PX_SIZE = 8;
const MAX_PX_SIZE = 512;

type CanvasProps = {
  gridSize: { x: number; y: number };
};

export default function Canvas({ gridSize }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeMouseButton = useRef<number>(null);
  const [pixelData, setPixelData] = useState<Uint8ClampedArray>(
    new Uint8ClampedArray(gridSize.x * gridSize.y * 4),
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const { selectedTool, primaryColor, secondaryColor } = useEditorStore();
  const canvasSize = {
    x: getPxSize() * gridSize.x,
    y: getPxSize() * gridSize.y,
  };

  function drawCheckerboard(ctx: CanvasRenderingContext2D) {
    const pxSize = getPxSize();
    ctx.fillStyle = "oklch(92.2% 0 0)";
    for (let i = 0; i < gridSize.y; i++)
      for (let j = 0; j < gridSize.x; j++)
        if (i % 2 === j % 2)
          ctx.fillRect(j * pxSize, i * pxSize, pxSize, pxSize);
  }

  function getPxSize() {
    let pxSize = MAX_PX_SIZE / Math.max(gridSize.x, gridSize.y);
    if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
    if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
    return pxSize;
  }

  function getIndex(x: number, y: number) {
    return (y * gridSize.x + x) * 4;
  }

  function handlePencilAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    if (activeMouseButton.current !== 0 && activeMouseButton.current !== 2)
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize());
    const y = Math.floor((e.clientY - rect.top) / getPxSize());
    const baseIndex = getIndex(x, y);
    const [r, g, b, a] =
      activeMouseButton.current === 0
        ? hexToRgba(primaryColor)
        : hexToRgba(secondaryColor);

    setPixelData((prevData) => {
      const newData = new Uint8ClampedArray(prevData);
      newData[baseIndex] = r;
      newData[baseIndex + 1] = g;
      newData[baseIndex + 2] = b;
      newData[baseIndex + 3] = a;
      return newData;
    });
  }

  function handleEraserAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    if (activeMouseButton.current !== 0 && activeMouseButton.current !== 2)
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize());
    const y = Math.floor((e.clientY - rect.top) / getPxSize());
    const baseIndex = getIndex(x, y);

    setPixelData((prevData) => {
      const newData = new Uint8ClampedArray(prevData);
      newData[baseIndex] = 0;
      newData[baseIndex + 1] = 0;
      newData[baseIndex + 2] = 0;
      newData[baseIndex + 3] = 0;
      return newData;
    });
  }

  function handleAction(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    switch (selectedTool) {
      case "pencil":
        handlePencilAction(e);
        break;
      case "eraser":
        handleEraserAction(e);
        break;
      default:
        console.error("Selected tool is invalid.");
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    setIsDrawing(true);
    activeMouseButton.current = e.button;
    handleAction(e);
  }

  function handleMouseUp() {
    setIsDrawing(false);
    activeMouseButton.current = null;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (isDrawing) handleAction(e);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
    drawCheckerboard(ctx);

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
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        gridSize.x,
        gridSize.y,
        0,
        0,
        canvasSize.x,
        canvasSize.y,
      );
    }
  }, [pixelData, gridSize]);

  return (
    <canvas
      className="bg-white"
      ref={canvasRef}
      id="canvas"
      width={canvasSize.x}
      height={canvasSize.y}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    ></canvas>
  );
}
