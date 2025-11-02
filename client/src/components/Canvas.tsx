import { useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { useEditorStore } from "../store/editorStore";
import { hexToRgba } from "../utils/convertColor";
import {
  BASE_PX_SIZE,
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  ZOOM_FACTOR,
} from "../constants";

const lightCheckerboardColor = "#ffffff";
const darkCheckerboardColor = "#e5e5e5";

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
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
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
    ctx.fillStyle = darkCheckerboardColor;
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

  function updateHoveredPixel(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize());
    const y = Math.floor((e.clientY - rect.top) / getPxSize());

    if (!hoveredPixel || hoveredPixel.x !== x || hoveredPixel.y !== y)
      setHoveredPixel({ x, y });
  }

  function getHoverColor(r: number, g: number, b: number, a: number) {
    const originalColor = tinycolor({ r, g, b, a: a / 255 });
    const hoverColor =
      originalColor.getLuminance() < 0.5
        ? originalColor.lighten(15)
        : originalColor.darken(15);
    return hoverColor.toHexString();
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
    setHoveredPixel(null);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    activeMouseButton.current = null;
    updateHoveredPixel(e);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (activeMouseButton.current !== null) handleAction(e);
    else updateHoveredPixel(e);
  }

  function handleMouseLeave() {
    activeMouseButton.current = null;
    setHoveredPixel(null);
  }

  function handleMouseWheel(e: WheelEvent) {
    e.preventDefault();
    const scrollContainer = scrollContainerRef.current;
    const canvas = canvasRef.current;
    if (!scrollContainer || !canvas) return;

    const mouseX = e.clientX - scrollContainer.getBoundingClientRect().left;
    const mouseY = e.clientY - scrollContainer.getBoundingClientRect().top;
    const currentScrollLeft = scrollContainer.scrollLeft;
    const currentScrollTop = scrollContainer.scrollTop;
    const canvasMouseX = mouseX + currentScrollLeft - canvas.offsetLeft;
    const canvasMouseY = mouseY + currentScrollTop - canvas.offsetTop;

    let newZoomLevel = zoomLevel;
    if (e.deltaY < 0)
      newZoomLevel = Math.min(MAX_ZOOM_LEVEL, newZoomLevel * ZOOM_FACTOR);
    else if (e.deltaY > 0)
      newZoomLevel = Math.max(MIN_ZOOM_LEVEL, newZoomLevel / ZOOM_FACTOR);
    if (newZoomLevel === zoomLevel) return;

    const zoomRatio = newZoomLevel / zoomLevel;
    const newScrollLeft = canvasMouseX * zoomRatio - mouseX + canvas.offsetLeft;
    const newScrollTop = canvasMouseY * zoomRatio - mouseY + canvas.offsetTop;

    setZoomLevel(newZoomLevel);
    scrollContainer.scrollLeft = newScrollLeft;
    scrollContainer.scrollTop = newScrollTop;
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

    if (hoveredPixel) {
      const pxSize = getPxSize();
      const baseIndex = getIndex(hoveredPixel.x, hoveredPixel.y);
      const r = pixelData[baseIndex];
      const g = pixelData[baseIndex + 1];
      const b = pixelData[baseIndex + 2];
      const a = pixelData[baseIndex + 3];

      let hoverColor;
      if (a === 0) {
        if (hoveredPixel.y % 2 === hoveredPixel.x % 2)
          hoverColor = tinycolor(darkCheckerboardColor)
            .darken(15)
            .toHexString();
        else
          hoverColor = tinycolor(lightCheckerboardColor)
            .darken(15)
            .toHexString();
      } else hoverColor = getHoverColor(r, g, b, a);

      ctx.fillStyle = hoverColor;
      ctx.fillRect(
        hoveredPixel.x * pxSize,
        hoveredPixel.y * pxSize,
        pxSize,
        pxSize,
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
  }, [pixelData, gridSize, zoomLevel, hoveredPixel]);

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
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      ></canvas>
    </div>
  );
}
