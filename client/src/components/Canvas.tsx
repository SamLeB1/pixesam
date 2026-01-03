import { useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { useEditorStore } from "../store/editorStore";
import useCanvasZoom from "../hooks/useCanvasZoom";
import { isValidIndex } from "../utils/canvas";
import { BASE_PX_SIZE } from "../constants";

const lightCheckerboardColor = "#ffffff";
const darkCheckerboardColor = "#e5e5e5";

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
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
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

  function drawSelectionMovePreview(
    ctx: CanvasRenderingContext2D,
    clearSource: boolean,
  ) {
    if (!selectedArea) return;
    const pxSize = getPxSize();
    const offset = selectionMoveOffset || { x: 0, y: 0 };

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
    let iteration = 0;
    for (let i = 0; i < selectedArea.height; i++) {
      for (let j = 0; j < selectedArea.width; j++) {
        const destX = selectedArea.x + j + offset.x;
        const destY = selectedArea.y + i + offset.y;

        if (isValidIndex(destX, destY, gridSize)) {
          if (iteration >= selectedPixels.length) return;
          const { r, g, b, a } = selectedPixels[iteration];
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
        iteration++;
      }
    }
  }

  function drawResizeHandles(ctx: CanvasRenderingContext2D) {
    if (!selectedArea) return;

    const pxSize = getPxSize();
    const offset = selectionMoveOffset || { x: 0, y: 0 };

    const left = (selectedArea.x + offset.x - panOffset.x) * pxSize;
    const top = (selectedArea.y + offset.y - panOffset.y) * pxSize;
    const right = left + selectedArea.width * pxSize;
    const bottom = top + selectedArea.height * pxSize;
    const centerX = left + (selectedArea.width * pxSize) / 2;
    const centerY = top + (selectedArea.height * pxSize) / 2;

    const handles = [
      { x: left, y: top },
      { x: centerX, y: top },
      { x: right, y: top },
      { x: left, y: centerY },
      { x: right, y: centerY },
      { x: left, y: bottom },
      { x: centerX, y: bottom },
      { x: right, y: bottom },
    ];
    const handleRadius = 8;

    handles.forEach((h) => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function getPxSize() {
    return BASE_PX_SIZE * zoomLevel;
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
    if (!selectedArea) return false;
    const offset = selectionMoveOffset ? selectionMoveOffset : { x: 0, y: 0 };
    return (
      x >= selectedArea.x + offset.x &&
      y >= selectedArea.y + offset.y &&
      x < selectedArea.x + selectedArea.width + offset.x &&
      y < selectedArea.y + selectedArea.height + offset.y
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
      if (isInSelectedArea(x, y)) {
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
  }

  function handleMouseLeave() {
    activeMouseButton.current = null;
    if (selectionAction) endSelectionAction();
    setHoveredPixel(null);
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
      drawSelectionMovePreview(ctx, !isPasting);
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
    panOffset,
    brushSize,
    selectionMoveOffset,
    selectedArea,
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
        className={`bg-white ${showMoveCursor && "cursor-move"}`}
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
