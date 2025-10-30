import { useEffect, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { hexToRgba } from "../utils/convertColor";
import {
  BASE_PX_SIZE,
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  ZOOM_FACTOR,
} from "../constants";

export default function Canvas() {
  const {
    pixelData,
    gridSize,
    zoomLevel,
    selectedTool,
    primaryColor,
    secondaryColor,
    setPixelData,
    setZoomLevel,
  } = useEditorStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeMouseButton = useRef<number>(null);
  const prevPanMousePos = useRef({ x: 0, y: 0 });
  const canvasSize = {
    x: getPxSize() * gridSize.x,
    y: getPxSize() * gridSize.y,
  };
  const parentSize = scrollContainerRef.current
    ? {
        x: scrollContainerRef.current.clientWidth,
        y: scrollContainerRef.current.clientHeight,
      }
    : { x: Infinity, y: Infinity };

  function drawCheckerboard(ctx: CanvasRenderingContext2D) {
    const pxSize = getPxSize();
    ctx.fillStyle = "oklch(92.2% 0 0)";
    for (let i = 0; i < gridSize.y; i++)
      for (let j = 0; j < gridSize.x; j++)
        if (i % 2 === j % 2)
          ctx.fillRect(j * pxSize, i * pxSize, pxSize, pxSize);
  }

  function getPxSize() {
    return BASE_PX_SIZE * zoomLevel;
  }

  function getIndex(x: number, y: number) {
    return (y * gridSize.x + x) * 4;
  }

  function handlePencilAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
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

    const newData = new Uint8ClampedArray(pixelData);
    newData[baseIndex] = r;
    newData[baseIndex + 1] = g;
    newData[baseIndex + 2] = b;
    newData[baseIndex + 3] = a;
    setPixelData(newData);
  }

  function handleEraserAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize());
    const y = Math.floor((e.clientY - rect.top) / getPxSize());
    const baseIndex = getIndex(x, y);

    const newData = new Uint8ClampedArray(pixelData);
    newData[baseIndex] = 0;
    newData[baseIndex + 1] = 0;
    newData[baseIndex + 2] = 0;
    newData[baseIndex + 3] = 0;
    setPixelData(newData);
  }

  function handlePanAction(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const dx = e.clientX - prevPanMousePos.current.x;
    const dy = e.clientY - prevPanMousePos.current.y;
    scrollContainer.scrollLeft -= dx;
    scrollContainer.scrollTop -= dy;
    prevPanMousePos.current = { x: e.clientX, y: e.clientY };
  }

  function handleAction(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const btn = activeMouseButton.current;
    if (btn === 1) {
      handlePanAction(e);
      return;
    }
    switch (selectedTool) {
      case "pencil":
        if (btn === 0 || btn === 2) handlePencilAction(e);
        break;
      case "eraser":
        if (btn === 0 || btn === 2) handleEraserAction(e);
        break;
      default:
        console.error("Selected tool is invalid.");
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    activeMouseButton.current = e.button;
    if (activeMouseButton.current === 1) {
      e.preventDefault();
      prevPanMousePos.current = { x: e.clientX, y: e.clientY };
    }
    handleAction(e);
  }

  function handleMouseUp() {
    activeMouseButton.current = null;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (activeMouseButton.current !== null) handleAction(e);
  }

  function handleMouseWheel(e: WheelEvent) {
    e.preventDefault();
    let newZoomLevel = zoomLevel;
    if (e.deltaY < 0)
      newZoomLevel = Math.min(MAX_ZOOM_LEVEL, newZoomLevel * ZOOM_FACTOR);
    else if (e.deltaY > 0)
      newZoomLevel = Math.max(MIN_ZOOM_LEVEL, newZoomLevel / ZOOM_FACTOR);
    if (newZoomLevel === zoomLevel) return;
    setZoomLevel(newZoomLevel);
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

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer)
      scrollContainer.addEventListener("wheel", handleMouseWheel, {
        passive: false,
      });
    return () => {
      if (scrollContainer)
        scrollContainer.removeEventListener("wheel", handleMouseWheel);
    };
  }, [pixelData, gridSize, zoomLevel]);

  return (
    <div
      className="relative flex flex-grow items-center justify-center overflow-auto"
      ref={scrollContainerRef}
    >
      <canvas
        className={`${canvasSize.x > parentSize.x && "left-0"} ${canvasSize.y > parentSize.y && "top-0"} absolute bg-white`}
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
    </div>
  );
}
