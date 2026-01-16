import { useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { useEditorStore } from "../store/editorStore";
import useCanvasZoom from "../hooks/useCanvasZoom";
import { isValidIndex } from "../utils/canvas";
import { BASE_PX_SIZE } from "../constants";
import type { Direction, Rect } from "../types";

const lightCheckerboardColor = "#ffffff";
const darkCheckerboardColor = "#e5e5e5";
const RESIZE_HANDLES: { name: Direction; x: number; y: number }[] = [
  { name: "nw", x: 0, y: 0 },
  { name: "n", x: 0.5, y: 0 },
  { name: "ne", x: 1, y: 0 },
  { name: "w", x: 0, y: 0.5 },
  { name: "e", x: 1, y: 0.5 },
  { name: "sw", x: 0, y: 1 },
  { name: "s", x: 0.5, y: 1 },
  { name: "se", x: 1, y: 1 },
];
const RESIZE_HANDLE_RADIUS = 8;

export default function Canvas() {
  const {
    pixelData,
    gridSize,
    panOffset,
    zoomLevel,
    selectedTool,
    primaryColor,
    secondaryColor,
    brushSize,
    selectionAction,
    selectionStartPos,
    selectionMoveOffset,
    selectionResizeOffset,
    activeResizeHandle,
    selectedArea,
    selectedPixels,
    showSelectionPreview,
    isPasting,
    setPanOffset,
    selectTool,
    setPrimaryColor,
    setSecondaryColor,
    setSelectionAction,
    setSelectionStartPos,
    setSelectionMoveOffset,
    setSelectionResizeOffset,
    setActiveResizeHandle,
    setSelectedArea,
    setShowSelectionPreview,
    setMousePos,
    getPixelColor,
    draw,
    erase,
    floodFill,
    endSelectionAction,
    applySelectionAction,
    deleteSelection,
    undo,
    redo,
    clearDrawBuffer,
    copy,
    paste,
  } = useEditorStore();
  const parentContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeMouseButton = useRef<number>(null);
  const prevPanMousePos = useRef({ x: 0, y: 0 });
  const resizeStartOffset = useRef({ n: 0, e: 0, s: 0, w: 0 });
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] =
    useState<Direction | null>(null);
  const parentSize = parentContainerRef.current
    ? {
        x: parentContainerRef.current.clientWidth,
        y: parentContainerRef.current.clientHeight,
      }
    : { x: Infinity, y: Infinity };
  const canvasSize = {
    x: Math.min(getPxSize() * gridSize.x, parentSize.x),
    y: Math.min(getPxSize() * gridSize.y, parentSize.y),
  };
  const visibleGridSize = {
    x: canvasSize.x / getPxSize(),
    y: canvasSize.y / getPxSize(),
  };
  const showMoveCursor =
    (!selectionAction &&
      hoveredPixel &&
      isInSelectedArea(hoveredPixel.x, hoveredPixel.y)) ||
    selectionAction === "move";
  const { zoomStepTowardsCursor, zoomStepTowardsCenter, resetZoom } =
    useCanvasZoom();

  function drawCheckerboard(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = darkCheckerboardColor;
    const pxSize = getPxSize();

    const startX = Math.floor(panOffset.x);
    const startY = Math.floor(panOffset.y);
    const endX = Math.min(
      gridSize.x,
      startX + Math.ceil(visibleGridSize.x) + 1,
    );
    const endY = Math.min(
      gridSize.y,
      startY + Math.ceil(visibleGridSize.y) + 1,
    );
    for (let i = startY; i < endY; i++)
      for (let j = startX; j < endX; j++)
        if (i % 2 === j % 2)
          ctx.fillRect(
            (j - panOffset.x) * pxSize,
            (i - panOffset.y) * pxSize,
            pxSize,
            pxSize,
          );
  }

  function drawFilterRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const pxSize = getPxSize();
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const pixelX = x + j;
        const pixelY = y + i;

        if (isValidIndex(pixelX, pixelY, gridSize)) {
          const { r, g, b, a } = getPixelColor(pixelX, pixelY);
          let hoverColor;
          if (a === 0) {
            if (pixelY % 2 === pixelX % 2)
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
            (pixelX - panOffset.x) * pxSize,
            (pixelY - panOffset.y) * pxSize,
            pxSize,
            pxSize,
          );
        }
      }
    }
  }

  function drawSelectionPreview(
    ctx: CanvasRenderingContext2D,
    clearSource: boolean,
  ) {
    if (!selectedArea) return;
    const pxSize = getPxSize();
    const bounds = getEffectiveSelectionBounds();
    if (!bounds) return;

    // Clear the source area
    if (clearSource) {
      for (let i = 0; i < selectedArea.height; i++) {
        for (let j = 0; j < selectedArea.width; j++) {
          const sourceX = selectedArea.x + j;
          const sourceY = selectedArea.y + i;

          if (isValidIndex(sourceX, sourceY, gridSize)) {
            ctx.fillStyle =
              sourceY % 2 === sourceX % 2
                ? darkCheckerboardColor
                : lightCheckerboardColor;
            ctx.fillRect(
              (sourceX - panOffset.x) * pxSize,
              (sourceY - panOffset.y) * pxSize,
              pxSize,
              pxSize,
            );
          }
        }
      }
    }

    // Draw preview at destination with nearest-neighbor scaling
    const srcWidth = selectedArea.width;
    const srcHeight = selectedArea.height;
    const dstWidth = bounds.width;
    const dstHeight = bounds.height;

    for (let dy = 0; dy < dstHeight; dy++) {
      for (let dx = 0; dx < dstWidth; dx++) {
        const destX = bounds.x + dx;
        const destY = bounds.y + dy;

        if (isValidIndex(destX, destY, gridSize)) {
          // Nearest-neighbor scaling
          const srcX = Math.floor((dx * srcWidth) / dstWidth);
          const srcY = Math.floor((dy * srcHeight) / dstHeight);
          const srcIndex = srcY * srcWidth + srcX;

          if (srcIndex >= selectedPixels.length) continue;
          const { r, g, b, a } = selectedPixels[srcIndex];
          let hoverColor;
          if (a === 0) {
            if (destY % 2 === destX % 2)
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
            (destX - panOffset.x) * pxSize,
            (destY - panOffset.y) * pxSize,
            pxSize,
            pxSize,
          );
        }
      }
    }
  }

  function drawResizeHandles(ctx: CanvasRenderingContext2D) {
    const bounds = getEffectiveSelectionBounds();
    if (!bounds) return;

    const pxSize = getPxSize();
    const left = (bounds.x - panOffset.x) * pxSize;
    const top = (bounds.y - panOffset.y) * pxSize;
    const w = bounds.width * pxSize;
    const h = bounds.height * pxSize;

    RESIZE_HANDLES.forEach((handle) => {
      const hX = left + w * handle.x;
      const hY = top + h * handle.y;
      const isHovered = hoveredResizeHandle === handle.name;

      ctx.beginPath();
      ctx.arc(hX, hY, RESIZE_HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#e5e5e5" : "white";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function getPxSize() {
    return BASE_PX_SIZE * zoomLevel;
  }

  function getEffectiveSelectionBounds(): Rect | null {
    if (!selectedArea) return null;
    const moveOff = selectionMoveOffset || { x: 0, y: 0 };
    const resizeOff = selectionResizeOffset || { n: 0, e: 0, s: 0, w: 0 };

    const width = Math.max(1, selectedArea.width - resizeOff.w + resizeOff.e);
    const height = Math.max(1, selectedArea.height - resizeOff.n + resizeOff.s);

    return {
      x: selectedArea.x + resizeOff.w + moveOff.x,
      y: selectedArea.y + resizeOff.n + moveOff.y,
      width,
      height,
    };
  }

  function updateHoveredPixel(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);

    if (!hoveredPixel || hoveredPixel.x !== x || hoveredPixel.y !== y)
      setHoveredPixel({ x, y });
  }

  function updateHoveredResizeHandle(mouseX: number, mouseY: number) {
    if (!canvasRef.current || !showSelectionPreview) {
      setHoveredResizeHandle(null);
      return;
    }

    const bounds = getEffectiveSelectionBounds();
    if (!bounds) {
      setHoveredResizeHandle(null);
      return;
    }

    const pxSize = getPxSize();
    const rect = canvasRef.current.getBoundingClientRect();

    // Selection boundaries in screen pixels relative to canvas top-left
    const left = (bounds.x - panOffset.x) * pxSize;
    const top = (bounds.y - panOffset.y) * pxSize;
    const w = bounds.width * pxSize;
    const h = bounds.height * pxSize;

    // Actual mouse position relative to canvas top-left
    const localX = mouseX - rect.left;
    const localY = mouseY - rect.top;

    for (const handle of RESIZE_HANDLES) {
      const hX = left + w * handle.x;
      const hY = top + h * handle.y;

      // Pythagorean distance check
      const dist = Math.sqrt((localX - hX) ** 2 + (localY - hY) ** 2);
      if (dist <= RESIZE_HANDLE_RADIUS) {
        setHoveredResizeHandle(handle.name);
        return;
      }
    }
    setHoveredResizeHandle(null);
  }

  function updateMousePos(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    setMousePos({ x, y });
  }

  function getHoverColor(r: number, g: number, b: number, a: number) {
    const originalColor = tinycolor({ r, g, b, a: a / 255 });
    const hoverColor =
      originalColor.getLuminance() < 0.5
        ? originalColor.lighten(15)
        : originalColor.darken(15);
    return hoverColor.toHexString();
  }

  function isInSelectedArea(x: number, y: number) {
    const bounds = getEffectiveSelectionBounds();
    if (!bounds) return false;
    return (
      x >= bounds.x &&
      y >= bounds.y &&
      x < bounds.x + bounds.width &&
      y < bounds.y + bounds.height
    );
  }

  function handlePencilAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    const color =
      activeMouseButton.current === 0
        ? tinycolor(primaryColor).toRgb()
        : tinycolor(secondaryColor).toRgb();
    color.a *= 255;
    draw(x, y, color);
  }

  function handleEraserAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    erase(x, y);
  }

  function handleColorPickerAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    const rgba = getPixelColor(x, y);
    const hex = tinycolor(rgba).toHexString();
    activeMouseButton.current === 0
      ? setPrimaryColor(hex)
      : setSecondaryColor(hex);
  }

  function handleBucketAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    const color =
      activeMouseButton.current === 0
        ? tinycolor(primaryColor).toRgb()
        : tinycolor(secondaryColor).toRgb();
    color.a *= 255;
    floodFill(x, y, color);
  }

  function handleSelectAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    isInitialClick: boolean,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);

    if (isInitialClick || !selectionStartPos) {
      if (selectionAction) return;
      if (hoveredResizeHandle) {
        setSelectionAction("resize");
        setSelectionStartPos({ x, y });
        setActiveResizeHandle(hoveredResizeHandle);
        resizeStartOffset.current = selectionResizeOffset || {
          n: 0,
          e: 0,
          s: 0,
          w: 0,
        };
        return;
      } else if (isInSelectedArea(x, y)) {
        setSelectionAction("move");
        const offset = selectionMoveOffset
          ? selectionMoveOffset
          : { x: 0, y: 0 };
        setSelectionStartPos({ x: x - offset.x, y: y - offset.y });
        setShowSelectionPreview(true);
        return;
      } else {
        if (showSelectionPreview) applySelectionAction();
        setSelectionAction("select");
        setSelectionStartPos({ x, y });
        setSelectedArea(null);
        return;
      }
    }

    if (selectionAction === "select") {
      const dx = x - selectionStartPos.x;
      const dy = y - selectionStartPos.y;
      const areaX = dx >= 0 ? selectionStartPos.x : selectionStartPos.x + dx;
      const areaY = dy >= 0 ? selectionStartPos.y : selectionStartPos.y + dy;
      const areaWidth = Math.abs(dx) + 1;
      const areaHeight = Math.abs(dy) + 1;
      setSelectedArea({
        x: areaX,
        y: areaY,
        width: areaWidth,
        height: areaHeight,
      });
    } else if (selectionAction === "move") {
      setSelectionMoveOffset({
        x: x - selectionStartPos.x,
        y: y - selectionStartPos.y,
      });
    } else if (selectionAction === "resize") {
      if (!selectedArea || !activeResizeHandle) return;

      const dx = x - selectionStartPos.x;
      const dy = y - selectionStartPos.y;
      const start = resizeStartOffset.current;

      // Add delta to start offset for the appropriate edges
      const newOffset = { ...start };
      if (activeResizeHandle.includes("n")) newOffset.n = start.n + dy;
      if (activeResizeHandle.includes("s")) newOffset.s = start.s + dy;
      if (activeResizeHandle.includes("w")) newOffset.w = start.w + dx;
      if (activeResizeHandle.includes("e")) newOffset.e = start.e + dx;

      // Clamp offsets so effective size is at least 1
      const minWidth = 1;
      const minHeight = 1;

      // For width: selectedArea.width - w + e >= minWidth
      // For east resize: e >= minWidth - selectedArea.width + w
      // For west resize: w <= selectedArea.width + e - minWidth
      if (activeResizeHandle.includes("e")) {
        const minE = minWidth - selectedArea.width + newOffset.w;
        newOffset.e = Math.max(newOffset.e, minE);
      }
      if (activeResizeHandle.includes("w")) {
        const maxW = selectedArea.width + newOffset.e - minWidth;
        newOffset.w = Math.min(newOffset.w, maxW);
      }

      // For height: selectedArea.height - n + s >= minHeight
      // For south resize: s >= minHeight - selectedArea.height + n
      // For north resize: n <= selectedArea.height + s - minHeight
      if (activeResizeHandle.includes("s")) {
        const minS = minHeight - selectedArea.height + newOffset.n;
        newOffset.s = Math.max(newOffset.s, minS);
      }
      if (activeResizeHandle.includes("n")) {
        const maxN = selectedArea.height + newOffset.s - minHeight;
        newOffset.n = Math.min(newOffset.n, maxN);
      }

      setSelectionResizeOffset(newOffset);
    }
  }

  function handlePanAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    isInitialClick: boolean,
  ) {
    if (isInitialClick) {
      prevPanMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const dx = (e.clientX - prevPanMousePos.current.x) / zoomLevel;
    const dy = (e.clientY - prevPanMousePos.current.y) / zoomLevel;

    const maxPanOffset = {
      x: gridSize.x - visibleGridSize.x,
      y: gridSize.y - visibleGridSize.y,
    };
    const newPanOffset = {
      x: panOffset.x - dx,
      y: panOffset.y - dy,
    };
    if (newPanOffset.x < 0) newPanOffset.x = 0;
    if (newPanOffset.y < 0) newPanOffset.y = 0;
    if (newPanOffset.x > maxPanOffset.x) newPanOffset.x = maxPanOffset.x;
    if (newPanOffset.y > maxPanOffset.y) newPanOffset.y = maxPanOffset.y;

    setPanOffset(newPanOffset);
    prevPanMousePos.current = { x: e.clientX, y: e.clientY };
  }

  function handleAction(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    isInitialClick = false,
  ) {
    const btn = activeMouseButton.current;
    if (btn === 1) {
      handlePanAction(e, isInitialClick);
      return;
    }
    switch (selectedTool) {
      case "pencil":
        if (btn === 0 || btn === 2) handlePencilAction(e);
        break;
      case "eraser":
        if (btn === 0 || btn === 2) handleEraserAction(e);
        break;
      case "color-picker":
        if (btn === 0 || btn === 2) handleColorPickerAction(e);
        break;
      case "bucket":
        if (btn === 0 || btn === 2) handleBucketAction(e);
        break;
      case "select":
        if (btn === 0 || btn === 2) handleSelectAction(e, isInitialClick);
        break;
      default:
        console.error("Selected tool is invalid.");
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    activeMouseButton.current = e.button;
    handleAction(e, true);
    setHoveredPixel(null);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (selectionAction && activeMouseButton.current === 1) {
      activeMouseButton.current = 0;
      return;
    }
    activeMouseButton.current = null;
    if (selectionAction) endSelectionAction();
    updateHoveredPixel(e);
    clearDrawBuffer();
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (activeMouseButton.current !== null) handleAction(e);
    else updateHoveredPixel(e);
    updateHoveredResizeHandle(e.clientX, e.clientY);
  }

  function handleMouseLeave() {
    activeMouseButton.current = null;
    if (selectionAction) endSelectionAction();
    setHoveredPixel(null);
    setHoveredResizeHandle(null);
    clearDrawBuffer();
  }

  function handleMouseWheel(e: WheelEvent) {
    e.preventDefault();
    if (e.deltaY < 0) zoomStepTowardsCursor(e.clientX, e.clientY, true);
    else if (e.deltaY > 0) zoomStepTowardsCursor(e.clientX, e.clientY, false);
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
        panOffset.x,
        panOffset.y,
        visibleGridSize.x,
        visibleGridSize.y,
        0,
        0,
        canvasSize.x,
        canvasSize.y,
      );
    }

    if (showSelectionPreview) {
      drawSelectionPreview(ctx, !isPasting);
      drawResizeHandles(ctx);
    } else if (selectedArea) {
      const { x, y, width, height } = selectedArea;
      drawFilterRect(ctx, x, y, width, height);
    } else if (hoveredPixel) {
      const offset = -Math.floor(brushSize / 2);
      const x = hoveredPixel.x + offset;
      const y = hoveredPixel.y + offset;
      drawFilterRect(ctx, x, y, brushSize, brushSize);
    }

    if (!showSelectionPreview) setHoveredResizeHandle(null);

    const parentContainer = parentContainerRef.current;
    if (parentContainer)
      parentContainer.addEventListener("wheel", handleMouseWheel, {
        passive: false,
      });
    return () => {
      if (parentContainer)
        parentContainer.removeEventListener("wheel", handleMouseWheel);
    };
  }, [
    pixelData,
    gridSize,
    zoomLevel,
    hoveredPixel,
    hoveredResizeHandle,
    panOffset,
    brushSize,
    selectionMoveOffset,
    selectionResizeOffset,
    selectedArea,
    showSelectionPreview,
  ]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        target.contentEditable === "true";
      if (editable) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (isCmdOrCtrl && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo();
      } else if (isCmdOrCtrl && e.shiftKey && key === "z") {
        e.preventDefault();
        redo();
      } else if (isCmdOrCtrl && key === "y") {
        e.preventDefault();
        redo();
      } else if (isCmdOrCtrl && key === "c") {
        e.preventDefault();
        copy();
      } else if (isCmdOrCtrl && key === "v") {
        e.preventDefault();
        paste();
      } else if (key === "p") {
        e.preventDefault();
        selectTool("pencil");
      } else if (key === "e") {
        e.preventDefault();
        selectTool("eraser");
      } else if (key === "c") {
        e.preventDefault();
        selectTool("color-picker");
      } else if (key === "b") {
        e.preventDefault();
        selectTool("bucket");
      } else if (key === "s") {
        e.preventDefault();
        selectTool("select");
      } else if (key === "+" || key === "=") {
        e.preventDefault();
        zoomStepTowardsCenter(true);
      } else if (key === "-") {
        e.preventDefault();
        zoomStepTowardsCenter(false);
      } else if (key === "0") {
        e.preventDefault();
        resetZoom();
      } else if (key === "delete" || key === "backspace") {
        e.preventDefault();
        deleteSelection();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectTool, undo, redo, copy, paste, zoomStepTowardsCenter, resetZoom]);

  return (
    <div
      className="flex flex-grow items-center justify-center"
      ref={parentContainerRef}
      id="parent-container"
      onMouseMove={updateMousePos}
    >
      <canvas
        className="bg-white"
        style={{
          ...(showMoveCursor && { cursor: "move" }),
          ...(hoveredResizeHandle && {
            cursor: `${hoveredResizeHandle}-resize`,
          }),
        }}
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
