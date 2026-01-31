import { create } from "zustand";
import { toast } from "sonner";
import {
  getBaseIndex,
  isValidIndex,
  getPixelColor,
  setPixelColor,
  isEqualColor,
  drawRectContent,
  clearRectContent,
  resizePixelsWithNearestNeighbor,
  resizeMaskWithNearestNeighbor,
} from "../utils/canvas";
import { interpolateBetweenPoints, isInPolygon } from "../utils/geometry";
import { isValidPxsmData } from "../utils/pxsmValidator";
import {
  DEFAULT_GRID_SIZE,
  MAX_GRID_SIZE,
  BASE_CANVAS_SIZE,
  BASE_PX_SIZE,
  MIN_PX_SIZE,
  MAX_PX_SIZE,
  MAX_HISTORY_SIZE,
} from "../constants";
import type {
  RGBA,
  Side,
  Direction,
  Rect,
  Clipboard,
  PxsmData,
} from "../types";

type Action =
  | DrawAction
  | BucketAction
  | TransformAction
  | MoveAction
  | DeleteAction
  | PasteAction
  | NewAction
  | ClearAction;

type DrawAction = {
  action: "draw";
  pixels: DrawActionPixel[];
};

type BucketAction = {
  action: "bucket";
  x: number;
  y: number;
  color: RGBA;
  prevPixelData: Uint8ClampedArray;
};

type TransformAction = {
  action: "transform";
  srcRect: Rect;
  dstRect: Rect;
  srcPixels: RGBA[];
  dstPixels: RGBA[];
  mask: Uint8Array | null;
};

type MoveAction = {
  action: "move";
  pixels: Uint8ClampedArray;
  offset: { x: number; y: number };
};

type DeleteAction = {
  action: "delete";
  area: Rect;
  pixels: RGBA[];
  mask: Uint8Array | null;
};

type PasteAction = {
  action: "paste";
  area: Rect;
  pixels: RGBA[];
  prevPixels: RGBA[];
  mask: Uint8Array | null;
};

type NewAction = {
  action: "new";
  pixelData: Uint8ClampedArray;
  prevPixelData: Uint8ClampedArray;
  gridSize: { x: number; y: number };
  prevGridSize: { x: number; y: number };
};

type ClearAction = {
  action: "clear";
  prevPixelData: Uint8ClampedArray;
};

type DrawActionPixel = {
  x: number;
  y: number;
  color: RGBA;
  prevColor: RGBA;
};

type Tool =
  | "pencil"
  | "eraser"
  | "color-picker"
  | "bucket"
  | "line"
  | "select"
  | "move";

type EditorState = {
  pixelData: Uint8ClampedArray;
  gridSize: { x: number; y: number };
  panOffset: { x: number; y: number };
  zoomLevel: number;
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  lineStartPos: { x: number; y: number } | null;
  lineEndPos: { x: number; y: number } | null;
  selectionMode: "rectangular" | "lasso" | "wand";
  selectionMask: Uint8Array | null;
  selectionAction: "select" | "move" | "resize" | null;
  selectionStartPos: { x: number; y: number } | null;
  selectionMoveOffset: { x: number; y: number } | null;
  selectionResizeOffset: { n: number; e: number; s: number; w: number } | null;
  activeResizeHandle: Direction | null;
  selectedArea: Rect | null;
  selectedPixels: RGBA[];
  showSelectionPreview: boolean;
  isPasting: boolean;
  lassoPath: { x: number; y: number }[];
  moveStartPos: { x: number; y: number } | null;
  moveOffset: { x: number; y: number } | null;
  undoHistory: Action[];
  redoHistory: Action[];
  drawBuffer: DrawActionPixel[];
  drawnPixels: Set<string>;
  lastDrawPos: { x: number; y: number } | null;
  mousePos: { x: number; y: number };
  clipboard: Clipboard | null;
  setPixelData: (pixelData: Uint8ClampedArray) => void;
  setGridSize: (gridSize: { x: number; y: number }) => void;
  setPanOffset: (panOffset: { x: number; y: number }) => void;
  setZoomLevel: (n: number) => void;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
  setBrushSize: (n: number) => void;
  setLineStartPos: (pos: { x: number; y: number } | null) => void;
  setLineEndPos: (pos: { x: number; y: number } | null) => void;
  setSelectionMode: (mode: "rectangular" | "lasso" | "wand") => void;
  setSelectionMask: (mask: Uint8Array | null) => void;
  setSelectionAction: (action: "select" | "move" | "resize" | null) => void;
  setSelectionStartPos: (pos: { x: number; y: number } | null) => void;
  setSelectionMoveOffset: (offset: { x: number; y: number } | null) => void;
  setSelectionResizeOffset: (
    offset: { n: number; e: number; s: number; w: number } | null,
  ) => void;
  setActiveResizeHandle: (handle: Direction | null) => void;
  setSelectedArea: (area: Rect | null) => void;
  setSelectedPixels: (pixels: RGBA[]) => void;
  setShowSelectionPreview: (show: boolean) => void;
  setIsPasting: (isPasting: boolean) => void;
  setLassoPath: (path: { x: number; y: number }[]) => void;
  setMoveStartPos: (pos: { x: number; y: number } | null) => void;
  setMoveOffset: (offset: { x: number; y: number } | null) => void;
  setMousePos: (mousePos: { x: number; y: number }) => void;
  initActions: () => void;
  selectTool: (tool: Tool) => void;
  getPixelColor: (x: number, y: number) => RGBA;
  getPixelsInRect: (rect: Rect, mask?: Uint8Array | null) => RGBA[];
  getEffectiveSelectionBounds: () => Rect | null;
  draw: (x: number, y: number, color: RGBA) => void;
  drawLine: (color: RGBA) => void;
  erase: (x: number, y: number) => void;
  floodFill: (
    x: number,
    y: number,
    color: RGBA,
    isUpdateHistory?: boolean,
  ) => void;
  newCanvas: (size: { x: number; y: number }) => void;
  clearCanvas: () => void;
  resizeCanvas: (
    size: { x: number; y: number },
    anchor: Side,
    resizeContent?: boolean,
  ) => void;
  importFromPxsm: (data: PxsmData) => void;
  importImage: (dataURL: string) => void;
  exportToPxsm: () => void;
  exportToImage: (scale: number) => void;
  initSelection: () => void;
  endSelectionAction: () => void;
  applySelectionAction: () => void;
  deleteSelection: () => void;
  performWandSelection: (x: number, y: number) => void;
  generateSelectionMask: () => Uint8Array | null;
  closeLassoPath: () => void;
  applyMove: () => void;
  undo: () => void;
  redo: () => void;
  updateHistory: (action: Action) => void;
  clearDrawBuffer: () => void;
  copy: () => void;
  paste: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  pixelData: new Uint8ClampedArray(
    DEFAULT_GRID_SIZE.x * DEFAULT_GRID_SIZE.y * 4,
  ),
  gridSize: DEFAULT_GRID_SIZE,
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  selectedTool: "pencil",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  brushSize: 1,
  lineStartPos: null,
  lineEndPos: null,
  selectionMode: "rectangular",
  selectionMask: null,
  selectionAction: null,
  selectionStartPos: null,
  selectionMoveOffset: null,
  selectionResizeOffset: null,
  activeResizeHandle: null,
  selectedArea: null,
  selectedPixels: [],
  showSelectionPreview: false,
  isPasting: false,
  lassoPath: [],
  moveStartPos: null,
  moveOffset: null,
  undoHistory: [],
  redoHistory: [],
  drawBuffer: [],
  drawnPixels: new Set(),
  lastDrawPos: null,
  mousePos: { x: 0, y: 0 },
  clipboard: null,
  setPixelData: (pixelData) => set({ pixelData }),
  setGridSize: (gridSize) => set({ gridSize }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setZoomLevel: (n) => set({ zoomLevel: n }),
  setPrimaryColor: (hex) => set({ primaryColor: hex }),
  setSecondaryColor: (hex) => set({ secondaryColor: hex }),
  setBrushSize: (n) => set({ brushSize: n }),
  setLineStartPos: (pos) => set({ lineStartPos: pos }),
  setLineEndPos: (pos) => set({ lineEndPos: pos }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setSelectionMask: (mask) => set({ selectionMask: mask }),
  setSelectionAction: (action) => set({ selectionAction: action }),
  setSelectionStartPos: (pos) => set({ selectionStartPos: pos }),
  setSelectionMoveOffset: (offset) => set({ selectionMoveOffset: offset }),
  setSelectionResizeOffset: (offset) => set({ selectionResizeOffset: offset }),
  setActiveResizeHandle: (handle) => set({ activeResizeHandle: handle }),
  setSelectedArea: (area) => set({ selectedArea: area }),
  setSelectedPixels: (pixels) => set({ selectedPixels: pixels }),
  setShowSelectionPreview: (show) => set({ showSelectionPreview: show }),
  setIsPasting: (isPasting) => set({ isPasting }),
  setLassoPath: (path) => set({ lassoPath: path }),
  setMoveStartPos: (pos) => set({ moveStartPos: pos }),
  setMoveOffset: (offset) => set({ moveOffset: offset }),
  setMousePos: (mousePos) => set({ mousePos }),
  initActions: () =>
    set((state) => {
      const { initSelection } = state;
      initSelection();
      return {
        lineStartPos: null,
        lineEndPos: null,
        moveStartPos: null,
        moveOffset: null,
        drawBuffer: [],
        drawnPixels: new Set(),
        lastDrawPos: null,
      };
    }),
  selectTool: (tool) =>
    set((state) => {
      const {
        selectedTool,
        showSelectionPreview,
        moveOffset,
        initSelection,
        applySelectionAction,
        applyMove,
        clearDrawBuffer,
      } = state;
      if (selectedTool === tool) return {};

      if (showSelectionPreview) applySelectionAction();
      else initSelection();
      if (moveOffset) applyMove();
      clearDrawBuffer();

      return { selectedTool: tool, lineStartPos: null, lineEndPos: null };
    }),
  getPixelColor: (x, y) => {
    const { pixelData, gridSize } = get();
    const baseIndex = getBaseIndex(x, y, gridSize.x);
    return {
      r: pixelData[baseIndex],
      g: pixelData[baseIndex + 1],
      b: pixelData[baseIndex + 2],
      a: pixelData[baseIndex + 3],
    };
  },
  getPixelsInRect: (rect, mask = null) => {
    const { gridSize, getPixelColor } = get();
    const pixels: RGBA[] = [];
    if (mask) {
      for (let i = 0; i < rect.height; i++) {
        for (let j = 0; j < rect.width; j++) {
          const pixelX = rect.x + j;
          const pixelY = rect.y + i;
          if (isValidIndex(pixelX, pixelY, gridSize)) {
            const baseIndex = i * rect.width + j;
            if (baseIndex >= mask.length) continue;
            if (mask[baseIndex]) pixels.push(getPixelColor(pixelX, pixelY));
            else pixels.push({ r: 0, g: 0, b: 0, a: 0 });
          }
        }
      }
    } else {
      for (let i = 0; i < rect.height; i++) {
        for (let j = 0; j < rect.width; j++) {
          const pixelX = rect.x + j;
          const pixelY = rect.y + i;
          if (isValidIndex(pixelX, pixelY, gridSize))
            pixels.push(getPixelColor(pixelX, pixelY));
        }
      }
    }
    return pixels;
  },
  getEffectiveSelectionBounds: () => {
    const { selectedArea, selectionMoveOffset, selectionResizeOffset } = get();
    if (!selectedArea) return null;

    const moveOffset = selectionMoveOffset || { x: 0, y: 0 };
    const resizeOffset = selectionResizeOffset || { n: 0, e: 0, s: 0, w: 0 };
    const width = Math.max(
      1,
      selectedArea.width - resizeOffset.w + resizeOffset.e,
    );
    const height = Math.max(
      1,
      selectedArea.height - resizeOffset.n + resizeOffset.s,
    );
    return {
      x: selectedArea.x + moveOffset.x + resizeOffset.w,
      y: selectedArea.y + moveOffset.y + resizeOffset.n,
      width,
      height,
    };
  },
  draw: (x, y, color) =>
    set((state) => {
      const {
        pixelData,
        gridSize,
        brushSize,
        drawBuffer,
        drawnPixels,
        lastDrawPos,
        getPixelColor,
      } = state;
      if (lastDrawPos && lastDrawPos.x === x && lastDrawPos.y === y) return {};
      const newData = new Uint8ClampedArray(pixelData);
      const newDrawBuffer = [...drawBuffer];
      const newDrawnPixels = new Set(drawnPixels);
      const offset = -Math.floor(brushSize / 2);

      const pointsToDraw = lastDrawPos
        ? interpolateBetweenPoints(lastDrawPos.x, lastDrawPos.y, x, y)
        : [{ x, y }];
      for (const point of pointsToDraw) {
        for (let i = 0; i < brushSize; i++) {
          for (let j = 0; j < brushSize; j++) {
            const pixelX = point.x + j + offset;
            const pixelY = point.y + i + offset;
            if (!isValidIndex(pixelX, pixelY, gridSize)) continue;
            const key = `${pixelX},${pixelY}`;
            if (newDrawnPixels.has(key)) continue;
            newDrawnPixels.add(key);
            newDrawBuffer.push({
              x: pixelX,
              y: pixelY,
              color,
              prevColor: getPixelColor(pixelX, pixelY),
            });
            setPixelColor(pixelX, pixelY, gridSize.x, color, newData);
          }
        }
      }
      return {
        pixelData: newData,
        drawBuffer: newDrawBuffer,
        drawnPixels: newDrawnPixels,
        lastDrawPos: { x, y },
      };
    }),
  drawLine: (color) =>
    set((state) => {
      const {
        pixelData,
        gridSize,
        brushSize,
        lineStartPos,
        lineEndPos,
        getPixelColor,
      } = state;
      if (!lineStartPos || !lineEndPos) return {};
      const newData = new Uint8ClampedArray(pixelData);
      const drawBuffer: DrawActionPixel[] = [];
      const drawnPixels = new Set<string>();
      const offset = -Math.floor(brushSize / 2);

      const pointsToDraw = [
        lineStartPos,
        ...interpolateBetweenPoints(
          lineStartPos.x,
          lineStartPos.y,
          lineEndPos.x,
          lineEndPos.y,
        ),
      ];
      for (const point of pointsToDraw) {
        for (let i = 0; i < brushSize; i++) {
          for (let j = 0; j < brushSize; j++) {
            const pixelX = point.x + j + offset;
            const pixelY = point.y + i + offset;
            if (!isValidIndex(pixelX, pixelY, gridSize)) continue;
            const key = `${pixelX},${pixelY}`;
            if (drawnPixels.has(key)) continue;
            drawnPixels.add(key);
            drawBuffer.push({
              x: pixelX,
              y: pixelY,
              color,
              prevColor: getPixelColor(pixelX, pixelY),
            });
            setPixelColor(pixelX, pixelY, gridSize.x, color, newData);
          }
        }
      }
      return {
        pixelData: newData,
        lineStartPos: null,
        lineEndPos: null,
        drawBuffer,
      };
    }),
  erase: (x, y) => get().draw(x, y, { r: 0, g: 0, b: 0, a: 0 }),
  floodFill: (x, y, color, isUpdateHistory = true) =>
    set((state) => {
      const { pixelData, gridSize, updateHistory } = state;
      const targetColor = getPixelColor(x, y, gridSize.x, pixelData);
      if (isEqualColor(targetColor, color)) return {};

      const newData = new Uint8ClampedArray(pixelData);
      const queue: { x: number; y: number }[] = [];
      queue.push({ x, y });
      while (queue.length > 0) {
        const { x, y } = queue.shift()!;
        const currentColor = getPixelColor(x, y, gridSize.x, newData);

        if (isEqualColor(currentColor, targetColor)) {
          setPixelColor(x, y, gridSize.x, color, newData);
          if (isValidIndex(x + 1, y, gridSize)) queue.push({ x: x + 1, y });
          if (isValidIndex(x - 1, y, gridSize)) queue.push({ x: x - 1, y });
          if (isValidIndex(x, y + 1, gridSize)) queue.push({ x, y: y + 1 });
          if (isValidIndex(x, y - 1, gridSize)) queue.push({ x, y: y - 1 });
        }
      }

      if (isUpdateHistory) {
        const action: BucketAction = {
          action: "bucket",
          x,
          y,
          color,
          prevPixelData: pixelData,
        };
        updateHistory(action);
      }
      return { pixelData: newData };
    }),
  newCanvas: (size) =>
    set((state) => {
      const { pixelData, gridSize, initActions, updateHistory } = state;
      const newData = new Uint8ClampedArray(size.x * size.y * 4);

      let pxSize = BASE_CANVAS_SIZE / Math.max(size.x, size.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const action: NewAction = {
        action: "new",
        pixelData: newData,
        prevPixelData: pixelData,
        gridSize: size,
        prevGridSize: gridSize,
      };
      updateHistory(action);

      initActions();
      return {
        pixelData: newData,
        gridSize: size,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    }),
  clearCanvas: () =>
    set((state) => {
      const { pixelData, gridSize, initActions, updateHistory } = state;
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);

      const action: ClearAction = {
        action: "clear",
        prevPixelData: pixelData,
      };
      updateHistory(action);

      initActions();
      return { pixelData: newData };
    }),
  resizeCanvas: (size, anchor, resizeContent = false) =>
    set((state) => {
      const {
        pixelData,
        gridSize: oldGridSize,
        initActions,
        updateHistory,
      } = state;
      const newData = new Uint8ClampedArray(size.x * size.y * 4);

      if (resizeContent) {
        const scaleX = size.x / oldGridSize.x;
        const scaleY = size.y / oldGridSize.y;

        for (let newY = 0; newY < size.y; newY++) {
          for (let newX = 0; newX < size.x; newX++) {
            const oldX = Math.floor(newX / scaleX);
            const oldY = Math.floor(newY / scaleY);

            if (isValidIndex(oldX, oldY, oldGridSize)) {
              const oldBaseIndex = getBaseIndex(oldX, oldY, oldGridSize.x);
              const newBaseIndex = getBaseIndex(newX, newY, size.x);
              newData[newBaseIndex] = pixelData[oldBaseIndex];
              newData[newBaseIndex + 1] = pixelData[oldBaseIndex + 1];
              newData[newBaseIndex + 2] = pixelData[oldBaseIndex + 2];
              newData[newBaseIndex + 3] = pixelData[oldBaseIndex + 3];
            }
          }
        }
      } else {
        let offsetX = 0;
        let offsetY = 0;
        switch (anchor) {
          case "top-left":
            break;
          case "top-center":
            offsetX = Math.floor((size.x - oldGridSize.x) / 2);
            offsetY = 0;
            break;
          case "top-right":
            offsetX = size.x - oldGridSize.x;
            offsetY = 0;
            break;
          case "middle-left":
            offsetX = 0;
            offsetY = Math.floor((size.y - oldGridSize.y) / 2);
            break;
          case "middle-center":
            offsetX = Math.floor((size.x - oldGridSize.x) / 2);
            offsetY = Math.floor((size.y - oldGridSize.y) / 2);
            break;
          case "middle-right":
            offsetX = size.x - oldGridSize.x;
            offsetY = Math.floor((size.y - oldGridSize.y) / 2);
            break;
          case "bottom-left":
            offsetX = 0;
            offsetY = size.y - oldGridSize.y;
            break;
          case "bottom-center":
            offsetX = Math.floor((size.x - oldGridSize.x) / 2);
            offsetY = size.y - oldGridSize.y;
            break;
          case "bottom-right":
            offsetX = size.x - oldGridSize.x;
            offsetY = size.y - oldGridSize.y;
        }

        for (let y = 0; y < oldGridSize.y; y++) {
          for (let x = 0; x < oldGridSize.x; x++) {
            const oldBaseIndex = getBaseIndex(x, y, oldGridSize.x);
            const newX = x + offsetX;
            const newY = y + offsetY;

            if (newX >= 0 && newX < size.x && newY >= 0 && newY < size.y) {
              const newBaseIndex = getBaseIndex(newX, newY, size.x);
              newData[newBaseIndex] = pixelData[oldBaseIndex];
              newData[newBaseIndex + 1] = pixelData[oldBaseIndex + 1];
              newData[newBaseIndex + 2] = pixelData[oldBaseIndex + 2];
              newData[newBaseIndex + 3] = pixelData[oldBaseIndex + 3];
            }
          }
        }
      }

      let pxSize = BASE_CANVAS_SIZE / Math.max(size.x, size.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const action: NewAction = {
        action: "new",
        pixelData: newData,
        prevPixelData: pixelData,
        gridSize: size,
        prevGridSize: oldGridSize,
      };
      updateHistory(action);

      initActions();
      return {
        pixelData: newData,
        gridSize: size,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    }),
  importFromPxsm: (data) =>
    set((state) => {
      if (!isValidPxsmData(data)) {
        toast.error(
          "The imported file is invalid and may have been corrupted.",
        );
        return {};
      }
      const { pixelData, gridSize, initActions, updateHistory } = state;
      const newData = new Uint8ClampedArray(data.pixels);
      let pxSize = BASE_CANVAS_SIZE / Math.max(data.width, data.height);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const action: NewAction = {
        action: "new",
        pixelData: newData,
        prevPixelData: pixelData,
        gridSize: { x: data.width, y: data.height },
        prevGridSize: gridSize,
      };
      updateHistory(action);

      toast.success("File imported successfully!");
      initActions();
      return {
        pixelData: newData,
        gridSize: { x: data.width, y: data.height },
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    }),
  importImage: (dataURL) => {
    const img = new Image();
    img.src = dataURL;

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > MAX_GRID_SIZE || height > MAX_GRID_SIZE) {
        const aspectRatio = width / height;
        if (width > height) {
          width = MAX_GRID_SIZE;
          height = Math.round(width / aspectRatio);
        } else {
          height = MAX_GRID_SIZE;
          width = Math.round(height * aspectRatio);
        }
      }

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) {
        toast.error("Failed to import the image.");
        return;
      }
      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(img, 0, 0, width, height);
      const imageData = tempCtx.getImageData(0, 0, width, height);
      const newData = new Uint8ClampedArray(imageData.data);

      let pxSize = BASE_CANVAS_SIZE / Math.max(width, height);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const { pixelData, gridSize, initActions, updateHistory } = get();
      const action: NewAction = {
        action: "new",
        pixelData: newData,
        prevPixelData: pixelData,
        gridSize: { x: width, y: height },
        prevGridSize: gridSize,
      };
      updateHistory(action);

      initActions();
      set({
        pixelData: newData,
        gridSize: { x: width, y: height },
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      });
      toast.success("Image imported successfully!");
    };

    img.onerror = () => {
      toast.error("Failed to import the image.");
    };
  },
  exportToPxsm: () => {
    const { pixelData, gridSize } = get();
    const newPixelData = Array.from(pixelData);
    const pxsmData = {
      version: "1.0.0",
      width: gridSize.x,
      height: gridSize.y,
      pixels: newPixelData,
    };
    const id = Math.random().toString(36).substring(2, 15);

    const dataStr = JSON.stringify(pxsmData);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `new-pixesam-${id}.pxsm`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  exportToImage: (scale) => {
    const { pixelData, gridSize } = get();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Failed to export the image.");
      return;
    }
    canvas.width = Math.floor(gridSize.x * scale);
    canvas.height = Math.floor(gridSize.y * scale);

    const imageData = new ImageData(
      pixelData as ImageDataArray,
      gridSize.x,
      gridSize.y,
    );

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      toast.error("Failed to export the image.");
      return;
    }
    tempCanvas.width = gridSize.x;
    tempCanvas.height = gridSize.y;
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
      canvas.width,
      canvas.height,
    );

    const id = Math.random().toString(36).substring(2, 15);
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `new-pixesam-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  initSelection: () =>
    set({
      selectionMask: null,
      selectionAction: null,
      selectionStartPos: null,
      selectionMoveOffset: null,
      selectionResizeOffset: null,
      activeResizeHandle: null,
      selectedArea: null,
      selectedPixels: [],
      showSelectionPreview: false,
      isPasting: false,
      lassoPath: [],
    }),
  endSelectionAction: () =>
    set((state) => {
      const {
        selectionMode,
        selectionAction,
        selectedArea,
        getPixelsInRect,
        initSelection,
        generateSelectionMask,
        closeLassoPath,
      } = state;

      if (selectionAction === "select") {
        if (selectedArea) {
          if (selectionMode === "lasso") closeLassoPath();
          const mask = generateSelectionMask();
          return {
            selectionMask: mask,
            selectionAction: null,
            selectionStartPos: null,
            selectedPixels: getPixelsInRect(selectedArea, mask),
            showSelectionPreview: true,
          };
        } else {
          initSelection();
          return {};
        }
      } else if (selectionAction === "move") {
        return { selectionAction: null, selectionStartPos: null };
      } else if (selectionAction === "resize") {
        return {
          selectionAction: null,
          selectionStartPos: null,
          activeResizeHandle: null,
        };
      } else return {};
    }),
  applySelectionAction: () =>
    set((state) => {
      const {
        pixelData,
        gridSize,
        selectionMask,
        selectionMoveOffset,
        selectionResizeOffset,
        selectedArea,
        selectedPixels,
        isPasting,
        getPixelsInRect,
        getEffectiveSelectionBounds,
        initSelection,
        updateHistory,
      } = state;

      const moveOff = selectionMoveOffset || { x: 0, y: 0 };
      const resizeOff = selectionResizeOffset || { n: 0, e: 0, s: 0, w: 0 };
      const hasMoved = moveOff.x !== 0 || moveOff.y !== 0;
      const hasResized =
        resizeOff.n !== 0 ||
        resizeOff.e !== 0 ||
        resizeOff.s !== 0 ||
        resizeOff.w !== 0;
      if ((!hasMoved && !hasResized && !isPasting) || !selectedArea) {
        initSelection();
        return {};
      }

      const newData = new Uint8ClampedArray(pixelData);
      const newSelectedArea = getEffectiveSelectionBounds() as Rect;
      const newMask = selectionMask
        ? resizeMaskWithNearestNeighbor(
            selectionMask,
            selectedArea.width,
            selectedArea.height,
            newSelectedArea.width,
            newSelectedArea.height,
          )
        : null;
      const pixelsToApply = resizePixelsWithNearestNeighbor(
        selectedPixels,
        selectedArea.width,
        selectedArea.height,
        newSelectedArea.width,
        newSelectedArea.height,
      );

      if (isPasting) {
        drawRectContent(
          newSelectedArea,
          pixelsToApply,
          newData,
          gridSize,
          true,
          newMask,
        );

        const action: PasteAction = {
          action: "paste",
          area: newSelectedArea,
          pixels: pixelsToApply,
          prevPixels: getPixelsInRect(newSelectedArea, newMask),
          mask: newMask,
        };
        updateHistory(action);
      } else {
        clearRectContent(selectedArea, newData, gridSize, selectionMask);
        drawRectContent(
          newSelectedArea,
          pixelsToApply,
          newData,
          gridSize,
          true,
          newMask,
        );

        const action: TransformAction = {
          action: "transform",
          srcRect: selectedArea,
          dstRect: newSelectedArea,
          srcPixels: selectedPixels,
          dstPixels: getPixelsInRect(newSelectedArea, newMask),
          mask: selectionMask,
        };
        updateHistory(action);
      }

      initSelection();
      return { pixelData: newData };
    }),
  deleteSelection: () =>
    set((state) => {
      const {
        pixelData,
        gridSize,
        selectionMask,
        selectedArea,
        isPasting,
        getPixelsInRect,
        initSelection,
        updateHistory,
      } = state;
      if (!selectedArea) return {};
      if (isPasting) {
        initSelection();
        return {};
      }

      const newData = new Uint8ClampedArray(pixelData);
      clearRectContent(selectedArea, newData, gridSize, selectionMask);

      const action: DeleteAction = {
        action: "delete",
        area: selectedArea,
        pixels: getPixelsInRect(selectedArea, selectionMask),
        mask: selectionMask,
      };
      updateHistory(action);

      initSelection();
      return { pixelData: newData };
    }),
  performWandSelection: (x, y) =>
    set((state) => {
      const { gridSize, getPixelColor, getPixelsInRect } = state;
      if (!isValidIndex(x, y, gridSize)) return {};

      const targetColor = getPixelColor(x, y);
      const visited = new Set<string>();
      const selectedCoords: { x: number; y: number }[] = [];
      const queue: { x: number; y: number }[] = [{ x, y }];

      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;

      while (queue.length > 0) {
        const { x: cx, y: cy } = queue.shift()!;
        const key = `${cx},${cy}`;

        if (visited.has(key)) continue;
        if (!isValidIndex(cx, cy, gridSize)) continue;

        const currentColor = getPixelColor(cx, cy);
        if (!isEqualColor(currentColor, targetColor)) continue;

        visited.add(key);
        selectedCoords.push({ x: cx, y: cy });

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        queue.push({ x: cx + 1, y: cy });
        queue.push({ x: cx - 1, y: cy });
        queue.push({ x: cx, y: cy + 1 });
        queue.push({ x: cx, y: cy - 1 });
      }

      if (selectedCoords.length === 0) return {};

      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      const selectedArea: Rect = { x: minX, y: minY, width, height };

      // Generate mask
      const mask = new Uint8Array(width * height);
      for (const { x: px, y: py } of selectedCoords) {
        const index = (py - minY) * width + (px - minX);
        mask[index] = 1;
      }

      return {
        selectionMask: mask,
        selectionAction: null,
        selectionStartPos: null,
        selectedArea,
        selectedPixels: getPixelsInRect(selectedArea, mask),
        showSelectionPreview: true,
      };
    }),
  generateSelectionMask: () => {
    const { selectionMode, selectedArea, lassoPath } = get();
    if (!selectedArea) return null;
    if (selectionMode === "lasso") {
      const mask = new Uint8Array(selectedArea.width * selectedArea.height);
      for (let i = 0; i < selectedArea.height; i++) {
        for (let j = 0; j < selectedArea.width; j++) {
          const x = selectedArea.x + j;
          const y = selectedArea.y + i;
          if (isInPolygon(x, y, lassoPath)) {
            const index = i * selectedArea.width + j;
            if (index >= mask.length) continue;
            mask[index] = 1;
          }
        }
      }
      return mask;
    } else return null;
  },
  closeLassoPath: () =>
    set((state) => {
      const { lassoPath } = state;
      if (lassoPath.length < 3) return {};
      const first = lassoPath[0];
      const last = lassoPath[lassoPath.length - 1];
      if (Math.abs(first.x - last.x) < 2 && Math.abs(first.y - last.y) < 2)
        return {};
      const points = interpolateBetweenPoints(last.x, last.y, first.x, first.y);
      points.pop();
      return { lassoPath: [...lassoPath, ...points] };
    }),
  applyMove: () =>
    set((state) => {
      const { pixelData, gridSize, moveOffset, updateHistory } = state;
      if (!moveOffset || (moveOffset.x === 0 && moveOffset.y === 0))
        return { moveStartPos: null, moveOffset: null };

      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);
      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const srcX = x - moveOffset.x;
          const srcY = y - moveOffset.y;

          if (isValidIndex(srcX, srcY, gridSize)) {
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, gridSize.x);
            newData[dstIndex] = pixelData[srcIndex];
            newData[dstIndex + 1] = pixelData[srcIndex + 1];
            newData[dstIndex + 2] = pixelData[srcIndex + 2];
            newData[dstIndex + 3] = pixelData[srcIndex + 3];
          }
        }
      }

      const action: MoveAction = {
        action: "move",
        pixels: pixelData,
        offset: moveOffset,
      };
      updateHistory(action);

      return { pixelData: newData, moveStartPos: null, moveOffset: null };
    }),
  undo: () => {
    const { pixelData, gridSize, undoHistory, redoHistory, initActions } =
      get();
    if (undoHistory.length === 0) return;

    const newUndoHistory = [...undoHistory];
    const action = newUndoHistory.shift()!;
    const newRedoHistory = [action, ...redoHistory];

    if (action.action === "draw") {
      const newData = new Uint8ClampedArray(pixelData);
      for (let i = 0; i < action.pixels.length; i++) {
        const { x, y, prevColor } = action.pixels[i];
        const baseIndex = getBaseIndex(x, y, gridSize.x);
        newData[baseIndex] = prevColor.r;
        newData[baseIndex + 1] = prevColor.g;
        newData[baseIndex + 2] = prevColor.b;
        newData[baseIndex + 3] = prevColor.a;
      }
      set({ pixelData: newData });
    } else if (action.action === "bucket") {
      set({ pixelData: action.prevPixelData });
    } else if (action.action === "transform") {
      const { srcRect, dstRect, srcPixels, dstPixels, mask } = action;
      const newData = new Uint8ClampedArray(pixelData);
      const newMask = mask
        ? resizeMaskWithNearestNeighbor(
            mask,
            srcRect.width,
            srcRect.height,
            dstRect.width,
            dstRect.height,
          )
        : null;
      drawRectContent(dstRect, dstPixels, newData, gridSize, false, newMask);
      drawRectContent(srcRect, srcPixels, newData, gridSize, true, mask);
      set({ pixelData: newData });
    } else if (action.action === "move") {
      set({ pixelData: action.pixels });
    } else if (action.action === "delete") {
      const { area, pixels, mask } = action;
      const newData = new Uint8ClampedArray(pixelData);
      drawRectContent(area, pixels, newData, gridSize, true, mask);
      set({ pixelData: newData });
    } else if (action.action === "paste") {
      const { area, prevPixels, mask } = action;
      const newData = new Uint8ClampedArray(pixelData);
      drawRectContent(area, prevPixels, newData, gridSize, false, mask);
      set({ pixelData: newData });
    } else if (action.action === "new") {
      const { prevPixelData, prevGridSize } = action;
      let pxSize = BASE_CANVAS_SIZE / Math.max(prevGridSize.x, prevGridSize.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;
      set({
        pixelData: prevPixelData,
        gridSize: prevGridSize,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      });
    } else if (action.action === "clear") {
      set({ pixelData: action.prevPixelData });
    }

    initActions();
    set({
      undoHistory: newUndoHistory,
      redoHistory: newRedoHistory,
    });
  },
  redo: () => {
    const {
      pixelData,
      gridSize,
      undoHistory,
      redoHistory,
      initActions,
      floodFill,
    } = get();
    if (redoHistory.length === 0) return;

    const newRedoHistory = [...redoHistory];
    const action = newRedoHistory.shift()!;
    const newUndoHistory = [action, ...undoHistory];

    if (action.action === "draw") {
      const newData = new Uint8ClampedArray(pixelData);
      for (let i = action.pixels.length - 1; i >= 0; i--) {
        const { x, y, color } = action.pixels[i];
        const baseIndex = getBaseIndex(x, y, gridSize.x);
        newData[baseIndex] = color.r;
        newData[baseIndex + 1] = color.g;
        newData[baseIndex + 2] = color.b;
        newData[baseIndex + 3] = color.a;
      }
      set({ pixelData: newData });
    } else if (action.action === "bucket") {
      const { x, y, color } = action;
      floodFill(x, y, color, false);
    } else if (action.action === "transform") {
      const { srcRect, dstRect, srcPixels, mask } = action;
      const newData = new Uint8ClampedArray(pixelData);
      const newMask = mask
        ? resizeMaskWithNearestNeighbor(
            mask,
            srcRect.width,
            srcRect.height,
            dstRect.width,
            dstRect.height,
          )
        : null;
      const pixelsToApply = resizePixelsWithNearestNeighbor(
        srcPixels,
        srcRect.width,
        srcRect.height,
        dstRect.width,
        dstRect.height,
      );
      clearRectContent(srcRect, newData, gridSize, mask);
      drawRectContent(dstRect, pixelsToApply, newData, gridSize, true, newMask);
      set({ pixelData: newData });
    } else if (action.action === "move") {
      const { pixels, offset } = action;
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);

      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const srcX = x - offset.x;
          const srcY = y - offset.y;

          if (isValidIndex(srcX, srcY, gridSize)) {
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, gridSize.x);
            newData[dstIndex] = pixels[srcIndex];
            newData[dstIndex + 1] = pixels[srcIndex + 1];
            newData[dstIndex + 2] = pixels[srcIndex + 2];
            newData[dstIndex + 3] = pixels[srcIndex + 3];
          }
        }
      }
      set({ pixelData: newData });
    } else if (action.action === "delete") {
      const { area, mask } = action;
      const newData = new Uint8ClampedArray(pixelData);
      clearRectContent(area, newData, gridSize, mask);
      set({ pixelData: newData });
    } else if (action.action === "paste") {
      const { area, pixels, mask } = action;
      const newData = new Uint8ClampedArray(pixelData);
      drawRectContent(area, pixels, newData, gridSize, true, mask);
      set({ pixelData: newData });
    } else if (action.action === "new") {
      const { pixelData, gridSize } = action;
      let pxSize = BASE_CANVAS_SIZE / Math.max(gridSize.x, gridSize.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;
      set({ pixelData, gridSize, panOffset: { x: 0, y: 0 }, zoomLevel });
    } else if (action.action === "clear") {
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);
      set({ pixelData: newData });
    }

    initActions();
    set({
      undoHistory: newUndoHistory,
      redoHistory: newRedoHistory,
    });
  },
  updateHistory: (action) =>
    set((state) => {
      const { undoHistory } = state;
      const newUndoHistory = [action, ...undoHistory];
      if (newUndoHistory.length > MAX_HISTORY_SIZE)
        newUndoHistory.splice(MAX_HISTORY_SIZE);
      return { undoHistory: newUndoHistory, redoHistory: [] };
    }),
  clearDrawBuffer: () =>
    set((state) => {
      const { drawBuffer, updateHistory } = state;
      if (drawBuffer.length === 0)
        return { drawnPixels: new Set(), lastDrawPos: null };
      const action: DrawAction = {
        action: "draw",
        pixels: drawBuffer,
      };
      updateHistory(action);
      return { drawBuffer: [], drawnPixels: new Set(), lastDrawPos: null };
    }),
  copy: () =>
    set((state) => {
      const {
        selectionMask,
        selectedArea,
        selectedPixels,
        showSelectionPreview,
        getPixelsInRect,
        getEffectiveSelectionBounds,
      } = state;
      if (!selectedArea) return {};

      const bounds = getEffectiveSelectionBounds() as Rect;
      let newMask = selectionMask;
      let pixelsToCopy = showSelectionPreview
        ? selectedPixels
        : getPixelsInRect(selectedArea);
      if (
        selectedArea.width !== bounds.width ||
        selectedArea.height !== bounds.height
      ) {
        if (newMask)
          newMask = resizeMaskWithNearestNeighbor(
            newMask,
            selectedArea.width,
            selectedArea.height,
            bounds.width,
            bounds.height,
          );
        pixelsToCopy = resizePixelsWithNearestNeighbor(
          pixelsToCopy,
          selectedArea.width,
          selectedArea.height,
          bounds.width,
          bounds.height,
        );
      }
      return {
        clipboard: {
          pixels: pixelsToCopy,
          width: bounds.width,
          height: bounds.height,
          mask: newMask,
        },
      };
    }),
  paste: () =>
    set((state) => {
      const {
        gridSize,
        showSelectionPreview,
        moveOffset,
        mousePos,
        clipboard,
        initSelection,
        applySelectionAction,
        applyMove,
        clearDrawBuffer,
        paste,
      } = state;
      if (!clipboard) return {};
      if (showSelectionPreview) {
        applySelectionAction();
        paste();
        return {};
      }
      if (moveOffset) applyMove();
      clearDrawBuffer();

      const { pixels, width, height, mask } = clipboard;
      const clipboardX = Math.max(
        0,
        Math.min(gridSize.x - width, mousePos.x - Math.floor(width / 2)),
      );
      const clipboardY = Math.max(
        0,
        Math.min(gridSize.y - height, mousePos.y - Math.floor(height / 2)),
      );
      const newSelectedArea: Rect = {
        x: clipboardX,
        y: clipboardY,
        width,
        height,
      };

      initSelection();
      return {
        selectedTool: "select",
        lineStartPos: null,
        lineEndPos: null,
        selectionMask: mask,
        selectedArea: newSelectedArea,
        selectedPixels: pixels,
        showSelectionPreview: true,
        isPasting: true,
      };
    }),
}));
