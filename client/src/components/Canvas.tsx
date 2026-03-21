import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import tinycolor from "tinycolor2";
import { useEditorStore } from "../store/editorStore";
import useCanvasZoom from "../hooks/useCanvasZoom";
import useModifierKeys from "../hooks/useModifierKeys";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import {
  isValidIndex,
  getBaseIndex,
  setPixelColor,
  clearRectContent,
  drawRectContent,
  resizePixelsWithNearestNeighbor,
  resizeMaskWithNearestNeighbor,
} from "../utils/canvas";
import {
  interpolateBetweenPoints,
  getConstrainedLinePoints,
  getRectOutlinePoints,
  getRectFillPoints,
  getEllipseOutlinePoints,
  getEllipseFillPoints,
  getModdedShapeBounds,
} from "../utils/geometry";
import { compositeLayers, compositeLayersWithOverride } from "../utils/layers";
import { BASE_PX_SIZE, CHECKER_LIGHT, CHECKER_DARK } from "../constants";
import type { Direction, Rect } from "../types";

const FILTER_STRENGTH = 25;
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
    layers,
    activeLayerId,
    gridSize,
    visibleGridSize,
    panOffset,
    zoomLevel,
    selectedTool,
    brushSize,
    lineStartPos,
    lineEndPos,
    shapeMode,
    shapeFill,
    shapeStartPos,
    shapeEndPos,
    selectionMode,
    selectionMask,
    selectionAction,
    selectionStartPos,
    selectionMoveOffset,
    selectionResizeOffset,
    activeResizeHandle,
    selectedArea,
    selectedPixels,
    showSelectionPreview,
    isPasting,
    lassoPath,
    moveStartPos,
    moveOffset,
    setVisibleGridSize,
    setPanOffset,
    setPrimaryColor,
    setSecondaryColor,
    setIsPrimaryColorActive,
    setLineStartPos,
    setLineEndPos,
    setShapeStartPos,
    setShapeEndPos,
    setSelectionAction,
    setSelectionStartPos,
    setSelectionMoveOffset,
    setSelectionResizeOffset,
    setActiveResizeHandle,
    setSelectedArea,
    setLassoPath,
    setMoveStartPos,
    setMoveOffset,
    setMousePos,
    getActiveLayer,
    getActiveColorRGBA,
    getPixelColor,
    getEffectiveSelectionBounds,
    getRectInBounds,
    draw,
    drawShade,
    drawLine,
    drawShape,
    erase,
    floodFill,
    endSelectionAction,
    applySelectionAction,
    performWandSelection,
    applyMove,
    clearDrawBuffer,
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
  const showMoveCursor =
    selectedTool === "move" ||
    (!selectionAction &&
      hoveredPixel &&
      isInSelectedArea(hoveredPixel.x, hoveredPixel.y)) ||
    selectionAction === "move" ||
    selectionAction === "resize";
  const showNotAllowedCursor =
    getActiveLayer().locked &&
    selectedTool !== "color-picker" &&
    selectedTool !== "select";
  const { zoomStepTowardsCursor } = useCanvasZoom();
  const modifierKeys = useModifierKeys();
  useKeyboardShortcuts();

  const checkerCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = gridSize.x;
    canvas.height = gridSize.y;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(gridSize.x, gridSize.y);
    const d = imageData.data;
    for (let y = 0; y < gridSize.y; y++) {
      for (let x = 0; x < gridSize.x; x++) {
        const i = (y * gridSize.x + x) * 4;
        if ((x + y) % 2 === 0) {
          d[i] = 229;
          d[i + 1] = 229;
          d[i + 2] = 229; // CHECKER_DARK #e5e5e5
        } else {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255; // CHECKER_LIGHT #ffffff
        }
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }, [gridSize]);

  const buildLinePreviewData = useCallback(
    (layerData: Uint8ClampedArray) => {
      if (!lineStartPos || !lineEndPos) return null;
      const newData = new Uint8ClampedArray(layerData);
      const color = getActiveColorRGBA();
      const drawnPixels = new Set<string>();
      const offset = -Math.floor(brushSize / 2);

      const points = modifierKeys.shift
        ? [lineStartPos, ...getConstrainedLinePoints(lineStartPos, lineEndPos)]
        : [
            lineStartPos,
            ...interpolateBetweenPoints(
              lineStartPos.x,
              lineStartPos.y,
              lineEndPos.x,
              lineEndPos.y,
            ),
          ];
      for (const point of points) {
        for (let i = 0; i < brushSize; i++) {
          for (let j = 0; j < brushSize; j++) {
            const x = point.x + j + offset;
            const y = point.y + i + offset;
            if (!isValidIndex(x, y, gridSize)) continue;
            const key = `${x},${y}`;
            if (drawnPixels.has(key)) continue;
            drawnPixels.add(key);
            setPixelColor(x, y, gridSize.x, color, newData);
          }
        }
      }
      return newData;
    },
    [
      gridSize,
      brushSize,
      lineStartPos,
      lineEndPos,
      modifierKeys,
      getActiveColorRGBA,
    ],
  );

  const buildShapePreviewData = useCallback(
    (layerData: Uint8ClampedArray) => {
      if (!shapeStartPos || !shapeEndPos) return null;
      const newData = new Uint8ClampedArray(layerData);
      const color = getActiveColorRGBA();
      const drawnPixels = new Set<string>();
      const offset = -Math.floor(brushSize / 2);

      function drawPixel(px: number, py: number) {
        if (!isValidIndex(px, py, gridSize)) return;
        const key = `${px},${py}`;
        if (drawnPixels.has(key)) return;
        drawnPixels.add(key);
        setPixelColor(px, py, gridSize.x, color, newData);
      }

      const { x1, y1, x2, y2 } = getModdedShapeBounds(
        shapeStartPos,
        shapeEndPos,
        modifierKeys.shift,
        modifierKeys.ctrl || modifierKeys.meta,
      );
      const outlinePoints =
        shapeMode === "rectangle"
          ? getRectOutlinePoints(x1, y1, x2, y2)
          : getEllipseOutlinePoints(x1, y1, x2, y2);
      for (const point of outlinePoints)
        for (let i = 0; i < brushSize; i++)
          for (let j = 0; j < brushSize; j++)
            drawPixel(point.x + j + offset, point.y + i + offset);
      if (shapeFill) {
        const fillPoints =
          shapeMode === "rectangle"
            ? getRectFillPoints(x1, y1, x2, y2)
            : getEllipseFillPoints(x1, y1, x2, y2);
        for (const point of fillPoints) drawPixel(point.x, point.y);
      }
      return newData;
    },
    [
      gridSize,
      brushSize,
      shapeStartPos,
      shapeEndPos,
      shapeMode,
      shapeFill,
      modifierKeys,
      getActiveColorRGBA,
    ],
  );

  const buildMovePreviewData = useCallback(
    (layerData: Uint8ClampedArray) => {
      if (!moveOffset) return null;
      const offset = { ...moveOffset };
      if (modifierKeys.shift) {
        if (Math.abs(offset.x) >= Math.abs(offset.y)) offset.y = 0;
        else offset.x = 0;
      }
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);

      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const srcX = x - offset.x;
          const srcY = y - offset.y;
          if (isValidIndex(srcX, srcY, gridSize)) {
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, gridSize.x);
            newData[dstIndex] = layerData[srcIndex];
            newData[dstIndex + 1] = layerData[srcIndex + 1];
            newData[dstIndex + 2] = layerData[srcIndex + 2];
            newData[dstIndex + 3] = layerData[srcIndex + 3];
          }
        }
      }
      return newData;
    },
    [gridSize, moveOffset, modifierKeys],
  );

  const buildSelectionPreviewData = useCallback(
    (layerData: Uint8ClampedArray) => {
      if (!selectedArea) return null;
      const newData = new Uint8ClampedArray(layerData);
      const bounds = getEffectiveSelectionBounds() as Rect;
      const newPixels = resizePixelsWithNearestNeighbor(
        selectedPixels,
        selectedArea.width,
        selectedArea.height,
        bounds.width,
        bounds.height,
      );
      const newMask = selectionMask
        ? resizeMaskWithNearestNeighbor(
            selectionMask,
            selectedArea.width,
            selectedArea.height,
            bounds.width,
            bounds.height,
          )
        : null;

      if (!isPasting)
        clearRectContent(selectedArea, newData, gridSize, selectionMask);
      drawRectContent(bounds, newPixels, newData, gridSize, newMask);
      return newData;
    },
    [
      gridSize,
      selectionMask,
      selectionMoveOffset,
      selectionResizeOffset,
      selectedArea,
      selectedPixels,
      isPasting,
      getEffectiveSelectionBounds,
    ],
  );

  const overrideData = useMemo(() => {
    const layer = getActiveLayer();
    if (lineStartPos && lineEndPos) return buildLinePreviewData(layer.data);
    else if (shapeStartPos && shapeEndPos)
      return buildShapePreviewData(layer.data);
    else if (moveOffset) return buildMovePreviewData(layer.data);
    else if (showSelectionPreview) return buildSelectionPreviewData(layer.data);
    else return null;
  }, [
    getActiveLayer,
    lineStartPos,
    lineEndPos,
    buildLinePreviewData,
    shapeStartPos,
    shapeEndPos,
    buildShapePreviewData,
    moveOffset,
    buildMovePreviewData,
    showSelectionPreview,
    buildSelectionPreviewData,
  ]);

  const composited = useMemo(
    () =>
      overrideData
        ? compositeLayersWithOverride(
            layers,
            gridSize.x,
            gridSize.y,
            activeLayerId,
            overrideData,
          )
        : compositeLayers(layers, gridSize.x, gridSize.y),
    [layers, activeLayerId, gridSize, overrideData],
  );

  function drawCheckerboard(ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      checkerCanvas,
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

  function drawCompositedLayers(ctx: CanvasRenderingContext2D) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = gridSize.x;
    tempCanvas.height = gridSize.y;
    const tempCtx = tempCanvas.getContext("2d")!;
    const imageData = new ImageData(
      composited as ImageDataArray,
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
              hoverColor = tinycolor(CHECKER_DARK)
                .darken(FILTER_STRENGTH)
                .toHexString();
            else
              hoverColor = tinycolor(CHECKER_LIGHT)
                .darken(FILTER_STRENGTH)
                .toHexString();
          } else hoverColor = getHoverColor(r, g, b, a, FILTER_STRENGTH);

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

  function drawLassoPath(ctx: CanvasRenderingContext2D) {
    const pxSize = getPxSize();
    for (let i = 0; i < lassoPath.length; i++) {
      const { x, y } = lassoPath[i];
      if (!isValidIndex(x, y, gridSize)) continue;

      const { r, g, b, a } = getPixelColor(x, y);
      let hoverColor;
      if (a === 0) {
        if (y % 2 === x % 2)
          hoverColor = tinycolor(CHECKER_DARK)
            .darken(FILTER_STRENGTH)
            .toHexString();
        else
          hoverColor = tinycolor(CHECKER_LIGHT)
            .darken(FILTER_STRENGTH)
            .toHexString();
      } else hoverColor = getHoverColor(r, g, b, a, FILTER_STRENGTH);

      ctx.fillStyle = hoverColor;
      ctx.fillRect(
        (x - panOffset.x) * pxSize,
        (y - panOffset.y) * pxSize,
        pxSize,
        pxSize,
      );
    }
  }

  function drawSelectionDrag(ctx: CanvasRenderingContext2D) {
    if (!selectedArea) return;
    const { x, y, width, height } = selectedArea;
    if (selectionMode === "rectangular")
      drawFilterRect(ctx, x, y, width, height);
    else if (selectionMode === "lasso") drawLassoPath(ctx);
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
      const isHovered =
        (!selectionAction && hoveredResizeHandle === handle.name) ||
        activeResizeHandle === handle.name;

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

  function getResizeStartPos() {
    const bounds = getEffectiveSelectionBounds();
    if (!bounds || !hoveredResizeHandle) return null;

    let x;
    if (hoveredResizeHandle.includes("w")) x = bounds.x;
    else if (hoveredResizeHandle.includes("e")) x = bounds.x + bounds.width - 1;
    else x = Math.floor(bounds.x + (bounds.width - 1) / 2);
    let y;
    if (hoveredResizeHandle.includes("n")) y = bounds.y;
    else if (hoveredResizeHandle.includes("s"))
      y = bounds.y + bounds.height - 1;
    else y = Math.floor(bounds.y + (bounds.height - 1) / 2);

    return { x, y };
  }

  function updateHoveredPixel(e: MouseEvent) {
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

  function getHoverColor(
    r: number,
    g: number,
    b: number,
    a: number,
    strength = 25,
  ) {
    const originalColor = tinycolor({ r, g, b, a: a / 255 });
    const hoverColor =
      originalColor.getLuminance() < 0.5
        ? originalColor.lighten(strength)
        : originalColor.darken(strength);
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

  function handlePencilAction(e: MouseEvent) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    draw(x, y, getActiveColorRGBA());
  }

  function handleEraserAction(e: MouseEvent) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    erase(x, y);
  }

  function handleColorPickerAction(e: MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    if (!isValidIndex(x, y, gridSize)) return;

    const rgba = getPixelColor(x, y);
    const hex = tinycolor(rgba).toHexString();
    activeMouseButton.current === 0
      ? setPrimaryColor(hex)
      : setSecondaryColor(hex);
  }

  function handleBucketAction(e: MouseEvent) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    floodFill(x, y, getActiveColorRGBA());
  }

  function handleLineAction(e: MouseEvent, isInitialClick: boolean) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);

    if (isInitialClick) {
      setLineStartPos({ x, y });
      setLineEndPos({ x, y });
    } else setLineEndPos({ x, y });
  }

  function handleShapeAction(e: MouseEvent, isInitialClick: boolean) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);

    if (isInitialClick) {
      setShapeStartPos({ x, y });
      setShapeEndPos({ x, y });
    } else setShapeEndPos({ x, y });
  }

  function handleShadeAction(e: MouseEvent) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);
    if (activeMouseButton.current === 0) drawShade(x, y, true);
    else if (activeMouseButton.current === 2) drawShade(x, y, false);
  }

  function handleSelectAction(e: MouseEvent, isInitialClick: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);

    if (isInitialClick) {
      if (selectionAction) return;
      if (hoveredResizeHandle) {
        if (getActiveLayer().locked) return;
        const resizeStartPos = getResizeStartPos();
        if (!resizeStartPos) return;
        setSelectionAction("resize");
        setSelectionStartPos(resizeStartPos);
        setActiveResizeHandle(hoveredResizeHandle);
        resizeStartOffset.current = selectionResizeOffset || {
          n: 0,
          e: 0,
          s: 0,
          w: 0,
        };
        return;
      } else if (isInSelectedArea(x, y)) {
        if (getActiveLayer().locked) return;
        setSelectionAction("move");
        const offset = selectionMoveOffset
          ? selectionMoveOffset
          : { x: 0, y: 0 };
        setSelectionStartPos({ x: x - offset.x, y: y - offset.y });
        return;
      } else {
        if (showSelectionPreview) applySelectionAction();

        if (selectionMode === "wand") performWandSelection(x, y);
        else {
          setSelectionAction("select");
          setSelectionStartPos({ x, y });
        }
        return;
      }
    }

    if (!selectionStartPos) return;
    if (selectionAction === "select") {
      if (selectionMode === "rectangular") {
        const dx = x - selectionStartPos.x;
        const dy = y - selectionStartPos.y;
        const areaX = dx >= 0 ? selectionStartPos.x : selectionStartPos.x + dx;
        const areaY = dy >= 0 ? selectionStartPos.y : selectionStartPos.y + dy;
        const areaWidth = Math.abs(dx) + 1;
        const areaHeight = Math.abs(dy) + 1;
        setSelectedArea(
          getRectInBounds({
            x: areaX,
            y: areaY,
            width: areaWidth,
            height: areaHeight,
          }),
        );
      } else if (selectionMode === "lasso") {
        if (!isValidIndex(x, y, gridSize)) return;
        const newLassoPath = [...lassoPath];
        if (newLassoPath.length === 0) newLassoPath.push({ x, y });
        else {
          const last = newLassoPath[newLassoPath.length - 1];
          if (last.x === x && last.y === y) return;
          newLassoPath.push(...interpolateBetweenPoints(last.x, last.y, x, y));
        }

        const first = newLassoPath[0];
        const minMax = [first.x, first.y, first.x, first.y];
        for (let i = 1; i < newLassoPath.length; i++) {
          const p = newLassoPath[i];
          if (p.x < minMax[0]) minMax[0] = p.x;
          if (p.y < minMax[1]) minMax[1] = p.y;
          if (p.x > minMax[2]) minMax[2] = p.x;
          if (p.y > minMax[3]) minMax[3] = p.y;
        }

        setSelectedArea({
          x: minMax[0],
          y: minMax[1],
          width: minMax[2] - minMax[0] + 1,
          height: minMax[3] - minMax[1] + 1,
        });
        setLassoPath(newLassoPath);
      }
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

  function handleMoveAction(e: MouseEvent, isInitialClick: boolean) {
    if (getActiveLayer().locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getPxSize() + panOffset.x);
    const y = Math.floor((e.clientY - rect.top) / getPxSize() + panOffset.y);

    if (isInitialClick) {
      setMoveStartPos({ x, y });
      setMoveOffset({ x: 0, y: 0 });
      return;
    }
    if (!moveStartPos) return;

    setMoveOffset({
      x: x - moveStartPos.x,
      y: y - moveStartPos.y,
    });
  }

  function handlePanAction(e: MouseEvent, isInitialClick: boolean) {
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

  function handleAction(e: MouseEvent, isInitialClick = false) {
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
      case "line":
        if (btn === 0 || btn === 2) handleLineAction(e, isInitialClick);
        break;
      case "shape":
        if (btn === 0 || btn === 2) handleShapeAction(e, isInitialClick);
        break;
      case "shade":
        if (btn === 0 || btn === 2) handleShadeAction(e);
        break;
      case "select":
        if (btn === 0 || btn === 2) handleSelectAction(e, isInitialClick);
        break;
      case "move":
        if (btn === 0 || btn === 2) handleMoveAction(e, isInitialClick);
        break;
      default:
        console.error("Selected tool is invalid.");
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
    drawCheckerboard(ctx);
    drawCompositedLayers(ctx);

    if (selectedTool !== "move" && !showNotAllowedCursor) {
      if (showSelectionPreview) {
        drawResizeHandles(ctx);
      } else if (selectionAction === "select") {
        drawSelectionDrag(ctx);
      } else if (hoveredPixel) {
        if (
          selectedTool === "pencil" ||
          selectedTool === "eraser" ||
          selectedTool === "line" ||
          selectedTool === "shape" ||
          selectedTool === "shade"
        ) {
          const offset = -Math.floor(brushSize / 2);
          const x = hoveredPixel.x + offset;
          const y = hoveredPixel.y + offset;
          drawFilterRect(ctx, x, y, brushSize, brushSize);
        } else drawFilterRect(ctx, hoveredPixel.x, hoveredPixel.y, 1, 1);
      }
    }

    const visible = {
      x: canvasSize.x / getPxSize(),
      y: canvasSize.y / getPxSize(),
    };
    if (visible.x !== visibleGridSize.x || visible.y !== visibleGridSize.y)
      setVisibleGridSize(visible);
    if (!showSelectionPreview && hoveredResizeHandle)
      setHoveredResizeHandle(null);
  });

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    activeMouseButton.current = e.button;
    if (e.button === 0 || e.button === 2)
      setIsPrimaryColorActive(e.button === 0);
    setHoveredPixel(null);
    handleAction(e as unknown as MouseEvent, true);
  }

  useEffect(() => {
    function handleMouseWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY < 0) zoomStepTowardsCursor(e.clientX, e.clientY, true);
      else if (e.deltaY > 0) zoomStepTowardsCursor(e.clientX, e.clientY, false);
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
  }, [zoomStepTowardsCursor]);

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      if (lineStartPos && lineEndPos)
        drawLine(getActiveColorRGBA(), modifierKeys.shift);
      if (shapeStartPos && shapeEndPos)
        drawShape(
          getActiveColorRGBA(),
          modifierKeys.shift,
          modifierKeys.ctrl || modifierKeys.meta,
        );
      if (selectionAction) endSelectionAction();
      if (moveOffset) applyMove(modifierKeys.shift);
      clearDrawBuffer();
      updateHoveredPixel(e);
      activeMouseButton.current = null;
    }

    function handleMouseMove(e: MouseEvent) {
      if (activeMouseButton.current !== null) handleAction(e);
      else updateHoveredPixel(e);
      updateHoveredResizeHandle(e.clientX, e.clientY);
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  });

  return (
    <div
      className="flex flex-grow items-center justify-center"
      style={{
        ...(showMoveCursor && { cursor: "move" }),
        ...(!selectionAction &&
          hoveredResizeHandle && {
            cursor: `${hoveredResizeHandle}-resize`,
          }),
        ...(showNotAllowedCursor && { cursor: "not-allowed" }),
      }}
      ref={parentContainerRef}
      id="parent-container"
      onMouseDown={handleMouseDown}
      onMouseMove={updateMousePos}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        className="bg-white"
        ref={canvasRef}
        id="canvas"
        width={canvasSize.x}
        height={canvasSize.y}
      ></canvas>
    </div>
  );
}
