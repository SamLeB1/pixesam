import { create } from "zustand";
import { toast } from "sonner";
import {
  getBaseIndex,
  isValidIndex,
  getPixelColor,
  setPixelColor,
  isEqualColor,
} from "../utils/canvas";
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
import type { RGBA, Side, Rect, Clipboard, PxsmData } from "../types";

type Action =
  | DrawAction
  | BucketAction
  | MoveAction
  | DeleteAction
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

type MoveAction = {
  action: "move";
  area: Rect;
  offset: { x: number; y: number };
  sourcePixels: RGBA[];
  destPixels: RGBA[];
};

type DeleteAction = {
  action: "delete";
  area: Rect;
  pixels: RGBA[];
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

type Tool = "pencil" | "eraser" | "color-picker" | "bucket" | "select";

type EditorState = {
  pixelData: Uint8ClampedArray;
  gridSize: { x: number; y: number };
  panOffset: { x: number; y: number };
  zoomLevel: number;
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  selectionAction: "select" | "move" | null;
  selectionStartPos: { x: number; y: number } | null;
  selectionMoveOffset: { x: number; y: number } | null;
  selectedArea: Rect | null;
  selectedPixels: RGBA[];
  showSelectionPreview: boolean;
  isPasting: boolean;
  undoHistory: Action[];
  redoHistory: Action[];
  drawBuffer: DrawActionPixel[];
  mousePos: { x: number; y: number };
  clipboard: Clipboard | null;
  setPixelData: (pixelData: Uint8ClampedArray) => void;
  setGridSize: (gridSize: { x: number; y: number }) => void;
  setPanOffset: (panOffset: { x: number; y: number }) => void;
  setZoomLevel: (n: number) => void;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
  setBrushSize: (n: number) => void;
  setSelectionAction: (action: "select" | "move" | null) => void;
  setSelectionStartPos: (pos: { x: number; y: number } | null) => void;
  setSelectionMoveOffset: (offset: { x: number; y: number } | null) => void;
  setSelectedArea: (area: Rect | null) => void;
  setSelectedPixels: (pixels: RGBA[]) => void;
  setShowSelectionPreview: (show: boolean) => void;
  setIsPasting: (isPasting: boolean) => void;
  setMousePos: (mousePos: { x: number; y: number }) => void;
  selectTool: (tool: Tool) => void;
  getPixelColor: (x: number, y: number) => RGBA;
  getPixelsInRect: (rect: Rect) => RGBA[];
  draw: (x: number, y: number, color: RGBA) => void;
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
  selectionAction: null,
  selectionStartPos: null,
  selectionMoveOffset: null,
  selectedArea: null,
  selectedPixels: [],
  showSelectionPreview: false,
  isPasting: false,
  undoHistory: [],
  redoHistory: [],
  drawBuffer: [],
  mousePos: { x: 0, y: 0 },
  clipboard: null,
  setPixelData: (pixelData) => set({ pixelData }),
  setGridSize: (gridSize) => set({ gridSize }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setZoomLevel: (n) => set({ zoomLevel: n }),
  setPrimaryColor: (hex) => set({ primaryColor: hex }),
  setSecondaryColor: (hex) => set({ secondaryColor: hex }),
  setBrushSize: (n) => set({ brushSize: n }),
  setSelectionAction: (action) => set({ selectionAction: action }),
  setSelectionStartPos: (pos) => set({ selectionStartPos: pos }),
  setSelectionMoveOffset: (offset) => set({ selectionMoveOffset: offset }),
  setSelectedArea: (area) => set({ selectedArea: area }),
  setSelectedPixels: (pixels) => set({ selectedPixels: pixels }),
  setShowSelectionPreview: (show) => set({ showSelectionPreview: show }),
  setIsPasting: (isPasting) => set({ isPasting }),
  setMousePos: (mousePos) => set({ mousePos }),
  selectTool: (tool) =>
    set((state) => {
      const {
        selectedTool,
        showSelectionPreview,
        initSelection,
        applySelectionAction,
      } = state;
      if (selectedTool === tool) return {};
      if (showSelectionPreview) applySelectionAction();
      else initSelection();
      return { selectedTool: tool };
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
  getPixelsInRect: (rect) => {
    const { gridSize, getPixelColor } = get();
    const pixels: RGBA[] = [];
    for (let i = 0; i < rect.height; i++) {
      for (let j = 0; j < rect.width; j++) {
        const pixelX = rect.x + j;
        const pixelY = rect.y + i;
        if (isValidIndex(pixelX, pixelY, gridSize))
          pixels.push(getPixelColor(pixelX, pixelY));
      }
    }
    return pixels;
  },
  draw: (x, y, color) =>
    set((state) => {
      const { pixelData, gridSize, brushSize, drawBuffer, getPixelColor } =
        state;
      const newData = new Uint8ClampedArray(pixelData);
      const newDrawBuffer = [...drawBuffer];
      const offset = -Math.floor(brushSize / 2);

      for (let i = 0; i < brushSize; i++) {
        for (let j = 0; j < brushSize; j++) {
          const pixelX = x + j + offset;
          const pixelY = y + i + offset;
          if (isValidIndex(pixelX, pixelY, gridSize)) {
            newDrawBuffer.unshift({
              x: pixelX,
              y: pixelY,
              color,
              prevColor: getPixelColor(pixelX, pixelY),
            });
            setPixelColor(pixelX, pixelY, gridSize.x, color, newData);
          }
        }
      }
      return { pixelData: newData, drawBuffer: newDrawBuffer };
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
      const { pixelData, gridSize, initSelection, updateHistory } = state;
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

      initSelection();
      return {
        pixelData: newData,
        gridSize: size,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    }),
  clearCanvas: () =>
    set((state) => {
      const { pixelData, gridSize, initSelection, updateHistory } = state;
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);

      const action: ClearAction = {
        action: "clear",
        prevPixelData: pixelData,
      };
      updateHistory(action);

      initSelection();
      return { pixelData: newData };
    }),
  resizeCanvas: (size, anchor, resizeContent = false) =>
    set((state) => {
      const {
        pixelData,
        gridSize: oldGridSize,
        initSelection,
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

      initSelection();
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
      const { pixelData, gridSize, initSelection, updateHistory } = state;
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
      initSelection();
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

      const { pixelData, gridSize, initSelection, updateHistory } = get();
      const action: NewAction = {
        action: "new",
        pixelData: newData,
        prevPixelData: pixelData,
        gridSize: { x: width, y: height },
        prevGridSize: gridSize,
      };
      updateHistory(action);

      initSelection();
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
      selectionAction: null,
      selectionStartPos: null,
      selectionMoveOffset: null,
      selectedArea: null,
      selectedPixels: [],
      showSelectionPreview: false,
      isPasting: false,
    }),
  endSelectionAction: () =>
    set((state) => {
      const { selectionAction, selectedArea, getPixelsInRect } = state;

      if (selectionAction === "select") {
        const newSelectedPixels = selectedArea
          ? getPixelsInRect(selectedArea)
          : [];
        return {
          selectionAction: null,
          selectionStartPos: null,
          selectedPixels: newSelectedPixels,
        };
      } else if (selectionAction === "move")
        return { selectionAction: null, selectionStartPos: null };
      else return {};
    }),
  applySelectionAction: () =>
    set((state) => {
      const {
        pixelData,
        gridSize,
        selectionMoveOffset,
        selectedArea,
        selectedPixels,
        isPasting,
        getPixelsInRect,
        initSelection,
        updateHistory,
      } = state;
      if (!selectionMoveOffset || !selectedArea) {
        initSelection();
        return {};
      }

      if (isPasting) {
        const newData = new Uint8ClampedArray(pixelData);
        let iteration = 0;
        for (let i = 0; i < selectedArea.height; i++) {
          for (let j = 0; j < selectedArea.width; j++) {
            const destX = selectedArea.x + j + selectionMoveOffset.x;
            const destY = selectedArea.y + i + selectionMoveOffset.y;
            if (isValidIndex(destX, destY, gridSize))
              setPixelColor(
                destX,
                destY,
                gridSize.x,
                selectedPixels[iteration],
                newData,
              );
            iteration++;
          }
        }
        initSelection();
        return { pixelData: newData };
      } else {
        const newData = new Uint8ClampedArray(pixelData);
        for (let i = 0; i < selectedArea.height; i++) {
          for (let j = 0; j < selectedArea.width; j++) {
            const sourceX = selectedArea.x + j;
            const sourceY = selectedArea.y + i;
            if (isValidIndex(sourceX, sourceY, gridSize))
              setPixelColor(
                sourceX,
                sourceY,
                gridSize.x,
                { r: 0, g: 0, b: 0, a: 0 },
                newData,
              );
          }
        }
        let iteration = 0;
        for (let i = 0; i < selectedArea.height; i++) {
          for (let j = 0; j < selectedArea.width; j++) {
            const destX = selectedArea.x + j + selectionMoveOffset.x;
            const destY = selectedArea.y + i + selectionMoveOffset.y;
            if (isValidIndex(destX, destY, gridSize))
              setPixelColor(
                destX,
                destY,
                gridSize.x,
                selectedPixels[iteration],
                newData,
              );
            iteration++;
          }
        }
        const newSelectedArea: Rect = {
          x: selectedArea.x + selectionMoveOffset.x,
          y: selectedArea.y + selectionMoveOffset.y,
          width: selectedArea.width,
          height: selectedArea.height,
        };

        const action: MoveAction = {
          action: "move",
          area: selectedArea,
          offset: selectionMoveOffset,
          sourcePixels: selectedPixels,
          destPixels: getPixelsInRect(newSelectedArea),
        };
        updateHistory(action);

        initSelection();
        return { pixelData: newData };
      }
    }),
  deleteSelection: () =>
    set((state) => {
      const {
        pixelData,
        gridSize,
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
      for (let i = 0; i < selectedArea.height; i++) {
        for (let j = 0; j < selectedArea.width; j++) {
          const pixelX = selectedArea.x + j;
          const pixelY = selectedArea.y + i;
          if (isValidIndex(pixelX, pixelY, gridSize))
            setPixelColor(
              pixelX,
              pixelY,
              gridSize.x,
              { r: 0, g: 0, b: 0, a: 0 },
              newData,
            );
        }
      }

      const action: DeleteAction = {
        action: "delete",
        area: selectedArea,
        pixels: getPixelsInRect(selectedArea),
      };
      updateHistory(action);

      initSelection();
      return { pixelData: newData };
    }),
  undo: () => {
    const { pixelData, gridSize, undoHistory, redoHistory, initSelection } =
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
    } else if (action.action === "move") {
      const { area, offset, sourcePixels, destPixels } = action;
      const newData = new Uint8ClampedArray(pixelData);
      let currPixelIndex = 0;
      for (let i = 0; i < area.height; i++) {
        for (let j = 0; j < area.width; j++) {
          const destX = area.x + j + offset.x;
          const destY = area.y + i + offset.y;
          if (isValidIndex(destX, destY, gridSize)) {
            setPixelColor(
              destX,
              destY,
              gridSize.x,
              destPixels[currPixelIndex],
              newData,
            );
            currPixelIndex++;
          }
        }
      }
      currPixelIndex = 0;
      for (let i = 0; i < area.height; i++) {
        for (let j = 0; j < area.width; j++) {
          const sourceX = area.x + j;
          const sourceY = area.y + i;
          if (isValidIndex(sourceX, sourceY, gridSize))
            setPixelColor(
              sourceX,
              sourceY,
              gridSize.x,
              sourcePixels[currPixelIndex],
              newData,
            );
          currPixelIndex++;
        }
      }
      set({ pixelData: newData });
    } else if (action.action === "delete") {
      const { area, pixels } = action;
      const newData = new Uint8ClampedArray(pixelData);

      let currPixelIndex = 0;
      for (let i = 0; i < area.height; i++) {
        for (let j = 0; j < area.width; j++) {
          const pixelX = area.x + j;
          const pixelY = area.y + i;
          if (isValidIndex(pixelX, pixelY, gridSize)) {
            setPixelColor(
              pixelX,
              pixelY,
              gridSize.x,
              pixels[currPixelIndex],
              newData,
            );
            currPixelIndex++;
          }
        }
      }
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

    initSelection();
    set({ undoHistory: newUndoHistory, redoHistory: newRedoHistory });
  },
  redo: () => {
    const {
      pixelData,
      gridSize,
      undoHistory,
      redoHistory,
      floodFill,
      initSelection,
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
    } else if (action.action === "move") {
      const { area, offset, sourcePixels } = action;
      const newData = new Uint8ClampedArray(pixelData);
      for (let i = 0; i < area.height; i++) {
        for (let j = 0; j < area.width; j++) {
          const sourceX = area.x + j;
          const sourceY = area.y + i;
          if (isValidIndex(sourceX, sourceY, gridSize))
            setPixelColor(
              sourceX,
              sourceY,
              gridSize.x,
              { r: 0, g: 0, b: 0, a: 0 },
              newData,
            );
        }
      }
      let currPixelIndex = 0;
      for (let i = 0; i < area.height; i++) {
        for (let j = 0; j < area.width; j++) {
          const destX = area.x + j + offset.x;
          const destY = area.y + i + offset.y;
          if (isValidIndex(destX, destY, gridSize))
            setPixelColor(
              destX,
              destY,
              gridSize.x,
              sourcePixels[currPixelIndex],
              newData,
            );
          currPixelIndex++;
        }
      }
      set({ pixelData: newData });
    } else if (action.action === "delete") {
      const { area } = action;
      const newData = new Uint8ClampedArray(pixelData);

      for (let i = 0; i < area.height; i++) {
        for (let j = 0; j < area.width; j++) {
          const pixelX = area.x + j;
          const pixelY = area.y + i;
          if (isValidIndex(pixelX, pixelY, gridSize))
            setPixelColor(
              pixelX,
              pixelY,
              gridSize.x,
              { r: 0, g: 0, b: 0, a: 0 },
              newData,
            );
        }
      }
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

    initSelection();
    set({ undoHistory: newUndoHistory, redoHistory: newRedoHistory });
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
      if (drawBuffer.length === 0) return {};
      const action: DrawAction = {
        action: "draw",
        pixels: drawBuffer,
      };
      updateHistory(action);
      return { drawBuffer: [] };
    }),
  copy: () =>
    set((state) => {
      const { selectedArea, getPixelsInRect } = state;
      if (!selectedArea) return {};
      return {
        clipboard: {
          pixels: getPixelsInRect(selectedArea),
          width: selectedArea.width,
          height: selectedArea.height,
        },
      };
    }),
  paste: () =>
    set((state) => {
      const {
        showSelectionPreview,
        mousePos,
        clipboard,
        applySelectionAction,
        paste,
      } = state;
      if (!clipboard) return {};
      if (showSelectionPreview) {
        applySelectionAction();
        paste();
        return {};
      }

      const { pixels, width, height } = clipboard;
      const clipboardX = mousePos.x - Math.floor(width / 2);
      const clipboardY = mousePos.y - Math.floor(height / 2);
      const newSelectedArea: Rect = {
        x: clipboardX,
        y: clipboardY,
        width,
        height,
      };

      return {
        selectedTool: "select",
        selectionAction: null,
        selectionStartPos: null,
        selectionMoveOffset: { x: 0, y: 0 },
        selectedArea: newSelectedArea,
        selectedPixels: pixels,
        showSelectionPreview: true,
        isPasting: true,
      };
    }),
}));
