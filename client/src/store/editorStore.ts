import { create } from "zustand";
import tinycolor from "tinycolor2";
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
import {
  interpolateBetweenPoints,
  getConstrainedLinePoints,
  getRectOutlinePoints,
  getRectFillPoints,
  getEllipseOutlinePoints,
  getEllipseFillPoints,
  getModdedShapeBounds,
  isInPolygon,
} from "../utils/geometry";
import {
  compositeLayers,
  createNewLayer,
  duplicateLayer,
  getAutoLayerName,
} from "../utils/layers";
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
  PxsmLayerData,
  Layer,
} from "../types";

type Action =
  | DrawAction
  | BucketAction
  | TransformAction
  | MoveAction
  | DeleteAction
  | PasteAction
  | NewAction
  | ClearAction
  | LayerStructureAction
  | LayerToggleAction
  | LayerRenameAction;

type DrawAction = {
  action: "draw";
  layerId: string;
  pixels: DrawActionPixel[];
};

type BucketAction = {
  action: "bucket";
  layerId: string;
  x: number;
  y: number;
  color: RGBA;
  prevData: Uint8ClampedArray;
};

type TransformAction = {
  action: "transform";
  layerId: string;
  srcRect: Rect;
  dstRect: Rect;
  srcPixels: RGBA[];
  dstPixels: RGBA[];
  mask: Uint8Array | null;
};

type MoveAction = {
  action: "move";
  layerId: string;
  data: Uint8ClampedArray;
  offset: { x: number; y: number };
};

type DeleteAction = {
  action: "delete";
  layerId: string;
  area: Rect;
  pixels: RGBA[];
  mask: Uint8Array | null;
};

type PasteAction = {
  action: "paste";
  layerId: string;
  area: Rect;
  pixels: RGBA[];
  prevPixels: RGBA[];
  mask: Uint8Array | null;
};

type NewAction = {
  action: "new";
  layers: Layer[];
  prevLayers: Layer[];
  activeLayerId: string;
  prevActiveLayerId: string;
  size: { x: number; y: number };
  prevSize: { x: number; y: number };
};

type ClearAction = {
  action: "clear";
  layerId: string;
  prevData: Uint8ClampedArray;
};

type LayerStructureAction = {
  action: "layer-structure";
  prevLayers: Layer[];
  prevActiveLayerId: string;
  layers: Layer[];
  activeLayerId: string;
};

type LayerToggleAction = {
  action: "layer-toggle";
  layerId: string;
  toggle: "visible" | "locked";
};

type LayerRenameAction = {
  action: "layer-rename";
  layerId: string;
  name: string;
  prevName: string;
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
  | "shape"
  | "shade"
  | "select"
  | "move";

type EditorState = {
  layers: Layer[];
  activeLayerId: string;
  gridSize: { x: number; y: number };
  visibleGridSize: { x: number; y: number };
  panOffset: { x: number; y: number };
  zoomLevel: number;
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  isPrimaryColorActive: boolean;
  brushSize: number;
  lineStartPos: { x: number; y: number } | null;
  lineEndPos: { x: number; y: number } | null;
  shapeMode: "rectangle" | "ellipse";
  shapeFill: boolean;
  shapeStartPos: { x: number; y: number } | null;
  shapeEndPos: { x: number; y: number } | null;
  switchDarkenAndLighten: boolean;
  shadeStrength: number;
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
  setLayers: (layers: Layer[]) => void;
  setGridSize: (gridSize: { x: number; y: number }) => void;
  setVisibleGridSize: (size: { x: number; y: number }) => void;
  setPanOffset: (panOffset: { x: number; y: number }) => void;
  setZoomLevel: (n: number) => void;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
  setIsPrimaryColorActive: (active: boolean) => void;
  setBrushSize: (n: number) => void;
  setLineStartPos: (pos: { x: number; y: number } | null) => void;
  setLineEndPos: (pos: { x: number; y: number } | null) => void;
  setShapeMode: (mode: "rectangle" | "ellipse") => void;
  setShapeFill: (fill: boolean) => void;
  setShapeStartPos: (pos: { x: number; y: number } | null) => void;
  setShapeEndPos: (pos: { x: number; y: number } | null) => void;
  setSwitchDarkenAndLighten: (isSwitch: boolean) => void;
  setShadeStrength: (strength: number) => void;
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
  getLayer: (id: string) => Layer | null;
  getActiveLayer: () => Layer;
  selectLayer: (id: string) => void;
  setLayerData: (data: Uint8ClampedArray, id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  newLayer: () => void;
  duplicateLayer: () => void;
  deleteLayer: () => void;
  moveLayerUp: () => void;
  moveLayerDown: () => void;
  mergeLayerDown: () => void;
  flattenLayers: () => void;
  clearLayer: () => void;
  getActiveColorHex: () => string;
  getActiveColorRGBA: () => RGBA;
  getPixelColor: (x: number, y: number, layerId?: string) => RGBA;
  getPixelsInRect: (
    rect: Rect,
    mask: Uint8Array | null,
    layerId?: string,
  ) => RGBA[];
  getEffectiveSelectionBounds: () => Rect | null;
  getRectInBounds: (rect: Rect) => Rect | null;
  draw: (x: number, y: number, color: RGBA) => void;
  drawShade: (x: number, y: number, darken: boolean) => void;
  drawLine: (color: RGBA, mod: boolean) => void;
  drawShape: (color: RGBA, mod1: boolean, mod2: boolean) => void;
  erase: (x: number, y: number) => void;
  floodFill: (
    x: number,
    y: number,
    color: RGBA,
    isUpdateHistory?: boolean,
  ) => void;
  newCanvas: (size: { x: number; y: number }) => void;
  resizeCanvas: (
    size: { x: number; y: number },
    anchor: Side,
    resizeContent?: boolean,
  ) => void;
  cropToSelection: () => void;
  trimCanvas: () => void;
  rotateCanvas: (degrees: 90 | 180 | 270) => void;
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
  applyMove: (mod: boolean) => void;
  undo: () => void;
  redo: () => void;
  updateHistory: (action: Action) => void;
  clearDrawBuffer: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  clearEdit: () => void;
};

const initialLayer = createNewLayer(
  DEFAULT_GRID_SIZE.x,
  DEFAULT_GRID_SIZE.y,
  "Layer 1",
);

export const useEditorStore = create<EditorState>((set, get) => ({
  layers: [initialLayer],
  activeLayerId: initialLayer.id,
  gridSize: DEFAULT_GRID_SIZE,
  visibleGridSize: DEFAULT_GRID_SIZE,
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  selectedTool: "pencil",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  isPrimaryColorActive: true,
  brushSize: 1,
  lineStartPos: null,
  lineEndPos: null,
  shapeMode: "rectangle",
  shapeFill: false,
  shapeStartPos: null,
  shapeEndPos: null,
  switchDarkenAndLighten: false,
  shadeStrength: 10,
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
  setLayers: (layers) => set({ layers }),
  setGridSize: (gridSize) => set({ gridSize }),
  setVisibleGridSize: (size) => set({ visibleGridSize: size }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setZoomLevel: (n) => set({ zoomLevel: n }),
  setPrimaryColor: (hex) => set({ primaryColor: hex }),
  setSecondaryColor: (hex) => set({ secondaryColor: hex }),
  setIsPrimaryColorActive: (active) => set({ isPrimaryColorActive: active }),
  setBrushSize: (n) => set({ brushSize: n }),
  setLineStartPos: (pos) => set({ lineStartPos: pos }),
  setLineEndPos: (pos) => set({ lineEndPos: pos }),
  setShapeMode: (mode) => set({ shapeMode: mode }),
  setShapeFill: (fill) => set({ shapeFill: fill }),
  setShapeStartPos: (pos) => set({ shapeStartPos: pos }),
  setShapeEndPos: (pos) => set({ shapeEndPos: pos }),
  setSwitchDarkenAndLighten: (isSwitch) =>
    set({ switchDarkenAndLighten: isSwitch }),
  setShadeStrength: (strength) => set({ shadeStrength: strength }),
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
        shapeStartPos: null,
        shapeEndPos: null,
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
        lineStartPos,
        lineEndPos,
        shapeStartPos,
        shapeEndPos,
        showSelectionPreview,
        moveOffset,
        getActiveColorRGBA,
        drawLine,
        drawShape,
        initSelection,
        applySelectionAction,
        applyMove,
        clearDrawBuffer,
      } = state;
      if (selectedTool === tool) return {};

      if (showSelectionPreview) applySelectionAction();
      else initSelection();
      if (moveOffset) applyMove(false);
      if (lineStartPos && lineEndPos) drawLine(getActiveColorRGBA(), false);
      if (shapeStartPos && shapeEndPos)
        drawShape(getActiveColorRGBA(), false, false);
      clearDrawBuffer();

      return { selectedTool: tool };
    }),
  getLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id);
    return layer ? layer : null;
  },
  getActiveLayer: () => {
    const { layers, activeLayerId } = get();
    return layers.find((l) => l.id === activeLayerId) as Layer;
  },
  selectLayer: (id) =>
    set((state) => {
      state.initActions();
      return { activeLayerId: id };
    }),
  setLayerData: (data, id) =>
    set((state) => {
      return {
        layers: state.layers.map((l) => (l.id === id ? { ...l, data } : l)),
      };
    }),
  toggleLayerVisibility: (id) =>
    set((state) => {
      const { layers, updateHistory } = state;
      updateHistory({ action: "layer-toggle", layerId: id, toggle: "visible" });
      return {
        layers: layers.map((l) =>
          l.id === id ? { ...l, visible: !l.visible } : l,
        ),
      };
    }),
  toggleLayerLock: (id) =>
    set((state) => {
      const { layers, updateHistory } = state;
      updateHistory({ action: "layer-toggle", layerId: id, toggle: "locked" });
      return {
        layers: layers.map((l) =>
          l.id === id ? { ...l, locked: !l.locked } : l,
        ),
      };
    }),
  renameLayer: (id, name) =>
    set((state) => {
      const { layers, getLayer, updateHistory } = state;
      const layer = getLayer(id);
      if (!layer) return {};

      const action: LayerRenameAction = {
        action: "layer-rename",
        layerId: id,
        name,
        prevName: layer.name,
      };
      updateHistory(action);

      return { layers: layers.map((l) => (l.id === id ? { ...l, name } : l)) };
    }),
  newLayer: () =>
    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;
      initActions();
      const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
      const newLayer = createNewLayer(
        gridSize.x,
        gridSize.y,
        getAutoLayerName(layers),
      );
      const newLayers = [...layers];
      newLayers.splice(activeIndex + 1, 0, newLayer);

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: newLayers,
        activeLayerId: newLayer.id,
      };
      updateHistory(action);

      return {
        layers: newLayers,
        activeLayerId: newLayer.id,
      };
    }),
  duplicateLayer: () =>
    set((state) => {
      const {
        layers,
        activeLayerId,
        initActions,
        getActiveLayer,
        updateHistory,
      } = state;
      initActions();
      const active = getActiveLayer();
      const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
      const newLayer = duplicateLayer(active);
      const newLayers = [...layers];
      newLayers.splice(activeIndex + 1, 0, newLayer);

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: newLayers,
        activeLayerId: newLayer.id,
      };
      updateHistory(action);

      return {
        layers: newLayers,
        activeLayerId: newLayer.id,
      };
    }),
  deleteLayer: () =>
    set((state) => {
      const { layers, activeLayerId, initActions, updateHistory } = state;
      if (layers.length <= 1) return {};
      initActions();
      const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
      const newActiveIndex = activeIndex === 0 ? 0 : activeIndex - 1;
      const newLayers = layers.filter((l) => l.id !== activeLayerId);

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: newLayers,
        activeLayerId: newLayers[newActiveIndex].id,
      };
      updateHistory(action);

      return {
        layers: newLayers,
        activeLayerId: newLayers[newActiveIndex].id,
      };
    }),
  moveLayerUp: () =>
    set((state) => {
      const { layers, activeLayerId, updateHistory } = state;
      const index = layers.findIndex((l) => l.id === activeLayerId);
      if (index >= layers.length - 1) return {};
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [
        newLayers[index + 1],
        newLayers[index],
      ];

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: newLayers,
        activeLayerId,
      };
      updateHistory(action);

      return { layers: newLayers };
    }),
  moveLayerDown: () =>
    set((state) => {
      const { layers, activeLayerId, updateHistory } = state;
      const index = layers.findIndex((l) => l.id === activeLayerId);
      if (index <= 0) return {};
      const newLayers = [...layers];
      [newLayers[index], newLayers[index - 1]] = [
        newLayers[index - 1],
        newLayers[index],
      ];

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: newLayers,
        activeLayerId,
      };
      updateHistory(action);

      return { layers: newLayers };
    }),
  mergeLayerDown: () =>
    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;
      const index = layers.findIndex((l) => l.id === activeLayerId);
      if (index <= 0) return {};
      initActions();

      const topLayer = layers[index];
      const bottomLayer = layers[index - 1];
      const composited = compositeLayers(
        [bottomLayer, topLayer],
        gridSize.x,
        gridSize.y,
        true,
      );
      const newLayers = layers.filter((_, i) => i !== index);
      newLayers[index - 1] = { ...bottomLayer, data: composited };

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: newLayers,
        activeLayerId: bottomLayer.id,
      };
      updateHistory(action);

      return {
        layers: newLayers,
        activeLayerId: bottomLayer.id,
      };
    }),
  flattenLayers: () =>
    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;
      if (layers.length <= 1) return {};
      initActions();

      const flattened = createNewLayer(
        gridSize.x,
        gridSize.y,
        "Flattened",
        compositeLayers(layers, gridSize.x, gridSize.y),
      );

      const action: LayerStructureAction = {
        action: "layer-structure",
        prevLayers: layers,
        prevActiveLayerId: activeLayerId,
        layers: [flattened],
        activeLayerId: flattened.id,
      };
      updateHistory(action);

      return {
        layers: [flattened],
        activeLayerId: flattened.id,
      };
    }),
  clearLayer: () => {
    const {
      activeLayerId,
      gridSize,
      initActions,
      getActiveLayer,
      setLayerData,
      updateHistory,
    } = get();
    const layer = getActiveLayer();
    if (layer.locked) return;

    const action: ClearAction = {
      action: "clear",
      layerId: activeLayerId,
      prevData: layer.data,
    };
    updateHistory(action);

    initActions();
    const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);
    setLayerData(newData, activeLayerId);
  },
  getActiveColorHex: () => {
    const { primaryColor, secondaryColor, isPrimaryColorActive } = get();
    return isPrimaryColorActive ? primaryColor : secondaryColor;
  },
  getActiveColorRGBA: () => {
    const { primaryColor, secondaryColor, isPrimaryColorActive } = get();
    const hex = isPrimaryColorActive ? primaryColor : secondaryColor;
    const rgba = tinycolor(hex).toRgb();
    rgba.a *= 255;
    return rgba;
  },
  getPixelColor: (x, y, layerId) => {
    const { layers, gridSize, getLayer } = get();
    if (!isValidIndex(x, y, gridSize)) return { r: 0, g: 0, b: 0, a: 0 };
    const baseIndex = getBaseIndex(x, y, gridSize.x);
    if (layerId) {
      const layer = getLayer(layerId);
      if (!layer) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: layer.data[baseIndex],
        g: layer.data[baseIndex + 1],
        b: layer.data[baseIndex + 2],
        a: layer.data[baseIndex + 3],
      };
    } else {
      const pxLayers: Layer[] = layers.map((layer) => {
        const r = layer.data[baseIndex];
        const g = layer.data[baseIndex + 1];
        const b = layer.data[baseIndex + 2];
        const a = layer.data[baseIndex + 3];
        const px = new Uint8ClampedArray([r, g, b, a]);
        return { ...layer, data: px };
      });
      const composited = compositeLayers(pxLayers, 1, 1);
      return {
        r: composited[0],
        g: composited[1],
        b: composited[2],
        a: composited[3],
      };
    }
  },
  getPixelsInRect: (rect, mask, layerId) => {
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
            if (mask[baseIndex])
              pixels.push(getPixelColor(pixelX, pixelY, layerId));
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
            pixels.push(getPixelColor(pixelX, pixelY, layerId));
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
  getRectInBounds: (rect) => {
    const { gridSize } = get();
    const x1 = Math.max(0, rect.x);
    const y1 = Math.max(0, rect.y);
    const x2 = Math.min(gridSize.x, rect.x + rect.width);
    const y2 = Math.min(gridSize.y, rect.y + rect.height);
    if (x1 >= x2 || y1 >= y2) return null;
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  },
  draw: (x, y, color) =>
    set((state) => {
      const {
        activeLayerId,
        gridSize,
        brushSize,
        drawBuffer,
        drawnPixels,
        lastDrawPos,
        getActiveLayer,
        setLayerData,
        getPixelColor,
      } = state;
      const layer = getActiveLayer();
      if (layer.locked) return {};
      if (lastDrawPos && lastDrawPos.x === x && lastDrawPos.y === y) return {};

      const newData = new Uint8ClampedArray(layer.data);
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
              prevColor: getPixelColor(pixelX, pixelY, activeLayerId),
            });
            setPixelColor(pixelX, pixelY, gridSize.x, color, newData);
          }
        }
      }
      setLayerData(newData, activeLayerId);
      return {
        drawBuffer: newDrawBuffer,
        drawnPixels: newDrawnPixels,
        lastDrawPos: { x, y },
      };
    }),
  drawShade: (x, y, darken) =>
    set((state) => {
      const {
        activeLayerId,
        gridSize,
        brushSize,
        switchDarkenAndLighten,
        shadeStrength,
        drawBuffer,
        drawnPixels,
        lastDrawPos,
        getActiveLayer,
        setLayerData,
        getPixelColor,
      } = state;
      const layer = getActiveLayer();
      if (layer.locked) return {};
      if (lastDrawPos && lastDrawPos.x === x && lastDrawPos.y === y) return {};

      const newData = new Uint8ClampedArray(layer.data);
      const newDrawBuffer = [...drawBuffer];
      const newDrawnPixels = new Set(drawnPixels);
      const offset = -Math.floor(brushSize / 2);
      darken = switchDarkenAndLighten ? !darken : darken;

      const pointsToDraw = lastDrawPos
        ? interpolateBetweenPoints(lastDrawPos.x, lastDrawPos.y, x, y)
        : [{ x, y }];
      for (const point of pointsToDraw) {
        for (let i = 0; i < brushSize; i++) {
          for (let j = 0; j < brushSize; j++) {
            const pixelX = point.x + j + offset;
            const pixelY = point.y + i + offset;
            if (!isValidIndex(pixelX, pixelY, gridSize)) continue;

            const currColor = getPixelColor(pixelX, pixelY, activeLayerId);
            if (currColor.a === 0) continue;
            currColor.a /= 255;
            const newColor = darken
              ? tinycolor(currColor).darken(shadeStrength).toRgb()
              : tinycolor(currColor).lighten(shadeStrength).toRgb();
            currColor.a *= 255;
            newColor.a *= 255;

            const key = `${pixelX},${pixelY}`;
            if (newDrawnPixels.has(key)) continue;
            newDrawnPixels.add(key);
            newDrawBuffer.push({
              x: pixelX,
              y: pixelY,
              color: newColor,
              prevColor: currColor,
            });
            setPixelColor(pixelX, pixelY, gridSize.x, newColor, newData);
          }
        }
      }
      setLayerData(newData, activeLayerId);
      return {
        drawBuffer: newDrawBuffer,
        drawnPixels: newDrawnPixels,
        lastDrawPos: { x, y },
      };
    }),
  drawLine: (color, mod) =>
    set((state) => {
      const {
        activeLayerId,
        gridSize,
        brushSize,
        lineStartPos,
        lineEndPos,
        getActiveLayer,
        setLayerData,
        getPixelColor,
      } = state;
      const layer = getActiveLayer();
      if (layer.locked) return {};
      if (!lineStartPos || !lineEndPos) return {};

      const newData = new Uint8ClampedArray(layer.data);
      const drawBuffer: DrawActionPixel[] = [];
      const drawnPixels = new Set<string>();
      const offset = -Math.floor(brushSize / 2);

      const pointsToDraw = mod
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
              prevColor: getPixelColor(pixelX, pixelY, activeLayerId),
            });
            setPixelColor(pixelX, pixelY, gridSize.x, color, newData);
          }
        }
      }
      setLayerData(newData, activeLayerId);
      return {
        lineStartPos: null,
        lineEndPos: null,
        drawBuffer,
      };
    }),
  drawShape: (color, mod1, mod2) =>
    set((state) => {
      const {
        activeLayerId,
        gridSize,
        brushSize,
        shapeStartPos,
        shapeEndPos,
        shapeMode,
        shapeFill,
        getActiveLayer,
        setLayerData,
        getPixelColor,
      } = state;
      const layer = getActiveLayer();
      if (layer.locked) return {};
      if (!shapeStartPos || !shapeEndPos) return {};

      const newData = new Uint8ClampedArray(layer.data);
      const drawBuffer: DrawActionPixel[] = [];
      const drawnPixels = new Set<string>();
      const offset = -Math.floor(brushSize / 2);
      const { x1, y1, x2, y2 } = getModdedShapeBounds(
        shapeStartPos,
        shapeEndPos,
        mod1,
        mod2,
      );

      function setPixel(px: number, py: number) {
        if (!isValidIndex(px, py, gridSize)) return;
        const key = `${px},${py}`;
        if (drawnPixels.has(key)) return;
        drawnPixels.add(key);
        drawBuffer.push({
          x: px,
          y: py,
          color,
          prevColor: getPixelColor(px, py, activeLayerId),
        });
        setPixelColor(px, py, gridSize.x, color, newData);
      }

      function drawBrushAt(px: number, py: number) {
        for (let i = 0; i < brushSize; i++) {
          for (let j = 0; j < brushSize; j++) {
            setPixel(px + j + offset, py + i + offset);
          }
        }
      }

      const outlinePoints =
        shapeMode === "rectangle"
          ? getRectOutlinePoints(x1, y1, x2, y2)
          : getEllipseOutlinePoints(x1, y1, x2, y2);
      for (const point of outlinePoints) drawBrushAt(point.x, point.y);
      if (shapeFill) {
        const fillPoints =
          shapeMode === "rectangle"
            ? getRectFillPoints(x1, y1, x2, y2)
            : getEllipseFillPoints(x1, y1, x2, y2);
        for (const point of fillPoints) setPixel(point.x, point.y);
      }

      setLayerData(newData, activeLayerId);
      return {
        shapeStartPos: null,
        shapeEndPos: null,
        drawBuffer,
      };
    }),
  erase: (x, y) => get().draw(x, y, { r: 0, g: 0, b: 0, a: 0 }),
  floodFill: (x, y, color, isUpdateHistory = true) => {
    const {
      activeLayerId,
      gridSize,
      getActiveLayer,
      setLayerData,
      updateHistory,
    } = get();
    if (!isValidIndex(x, y, gridSize)) return;
    const layer = getActiveLayer();
    if (layer.locked) return;
    const targetColor = getPixelColor(x, y, gridSize.x, layer.data);
    if (isEqualColor(targetColor, color)) return;

    const newData = new Uint8ClampedArray(layer.data);
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
        layerId: activeLayerId,
        x,
        y,
        color,
        prevData: layer.data,
      };
      updateHistory(action);
    }
    setLayerData(newData, activeLayerId);
  },
  newCanvas: (size) =>
    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;
      const newLayer = createNewLayer(size.x, size.y, "Layer 1");
      let pxSize = BASE_CANVAS_SIZE / Math.max(size.x, size.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const action: NewAction = {
        action: "new",
        layers: [newLayer],
        prevLayers: layers,
        activeLayerId: newLayer.id,
        prevActiveLayerId: activeLayerId,
        size,
        prevSize: gridSize,
      };
      updateHistory(action);

      initActions();
      return {
        layers: [newLayer],
        activeLayerId: newLayer.id,
        gridSize: size,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    }),
  resizeCanvas: (size, anchor, resizeContent = false) =>
    set((state) => {
      const {
        layers,
        activeLayerId,
        gridSize: oldGridSize,
        initActions,
        updateHistory,
      } = state;

      const newLayers: Layer[] = layers.map((layer) => {
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
                newData[newBaseIndex] = layer.data[oldBaseIndex];
                newData[newBaseIndex + 1] = layer.data[oldBaseIndex + 1];
                newData[newBaseIndex + 2] = layer.data[oldBaseIndex + 2];
                newData[newBaseIndex + 3] = layer.data[oldBaseIndex + 3];
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
                newData[newBaseIndex] = layer.data[oldBaseIndex];
                newData[newBaseIndex + 1] = layer.data[oldBaseIndex + 1];
                newData[newBaseIndex + 2] = layer.data[oldBaseIndex + 2];
                newData[newBaseIndex + 3] = layer.data[oldBaseIndex + 3];
              }
            }
          }
        }
        return { ...layer, data: newData };
      });

      const action: NewAction = {
        action: "new",
        layers: newLayers,
        prevLayers: layers,
        activeLayerId,
        prevActiveLayerId: activeLayerId,
        size,
        prevSize: oldGridSize,
      };
      updateHistory(action);

      let pxSize = BASE_CANVAS_SIZE / Math.max(size.x, size.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      initActions();
      return {
        layers: newLayers,
        gridSize: size,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    }),
  cropToSelection: () => {
    const {
      showSelectionPreview,
      getEffectiveSelectionBounds,
      getRectInBounds,
    } = get();

    if (!showSelectionPreview) return;
    const bounds = getEffectiveSelectionBounds();
    if (!bounds) return;
    const clampedBounds = getRectInBounds(bounds);
    if (!clampedBounds) return;

    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;

      const newSize = { x: clampedBounds.width, y: clampedBounds.height };

      const newLayers: Layer[] = layers.map((l) => {
        const newData = new Uint8ClampedArray(newSize.x * newSize.y * 4);
        for (let y = 0; y < newSize.y; y++) {
          for (let x = 0; x < newSize.x; x++) {
            const srcX = x + clampedBounds.x;
            const srcY = y + clampedBounds.y;
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, newSize.x);
            newData[dstIndex] = l.data[srcIndex];
            newData[dstIndex + 1] = l.data[srcIndex + 1];
            newData[dstIndex + 2] = l.data[srcIndex + 2];
            newData[dstIndex + 3] = l.data[srcIndex + 3];
          }
        }
        return { ...l, data: newData };
      });

      const action: NewAction = {
        action: "new",
        layers: newLayers,
        prevLayers: layers,
        activeLayerId,
        prevActiveLayerId: activeLayerId,
        size: newSize,
        prevSize: gridSize,
      };
      updateHistory(action);

      let pxSize = BASE_CANVAS_SIZE / Math.max(newSize.x, newSize.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      initActions();
      return {
        layers: newLayers,
        gridSize: newSize,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    });
  },
  trimCanvas: () => {
    const { layers, gridSize } = get();

    let minX = gridSize.x;
    let minY = gridSize.y;
    let maxX = -1;
    let maxY = -1;

    for (const layer of layers) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const alpha = layer.data[getBaseIndex(x, y, gridSize.x) + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }

    if (maxX < 0) return;
    if (
      minX === 0 &&
      minY === 0 &&
      maxX === gridSize.x - 1 &&
      maxY === gridSize.y - 1
    )
      return;

    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;

      const newSize = { x: maxX - minX + 1, y: maxY - minY + 1 };

      const newLayers: Layer[] = layers.map((l) => {
        const newData = new Uint8ClampedArray(newSize.x * newSize.y * 4);
        for (let y = 0; y < newSize.y; y++) {
          for (let x = 0; x < newSize.x; x++) {
            const srcX = x + minX;
            const srcY = y + minY;
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, newSize.x);
            newData[dstIndex] = l.data[srcIndex];
            newData[dstIndex + 1] = l.data[srcIndex + 1];
            newData[dstIndex + 2] = l.data[srcIndex + 2];
            newData[dstIndex + 3] = l.data[srcIndex + 3];
          }
        }
        return { ...l, data: newData };
      });

      const action: NewAction = {
        action: "new",
        layers: newLayers,
        prevLayers: layers,
        activeLayerId,
        prevActiveLayerId: activeLayerId,
        size: newSize,
        prevSize: gridSize,
      };
      updateHistory(action);

      let pxSize = BASE_CANVAS_SIZE / Math.max(newSize.x, newSize.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      initActions();
      return {
        layers: newLayers,
        gridSize: newSize,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    });
  },
  rotateCanvas: (degrees) => {
    set((state) => {
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;

      const newSize =
        degrees === 180
          ? { x: gridSize.x, y: gridSize.y }
          : { x: gridSize.y, y: gridSize.x };

      const newLayers: Layer[] = layers.map((l) => {
        const newData = new Uint8ClampedArray(newSize.x * newSize.y * 4);
        for (let y = 0; y < gridSize.y; y++) {
          for (let x = 0; x < gridSize.x; x++) {
            const srcIndex = getBaseIndex(x, y, gridSize.x);
            let newX: number;
            let newY: number;
            if (degrees === 90) {
              newX = gridSize.y - 1 - y;
              newY = x;
            } else if (degrees === 270) {
              newX = y;
              newY = gridSize.x - 1 - x;
            } else {
              newX = gridSize.x - 1 - x;
              newY = gridSize.y - 1 - y;
            }
            const dstIndex = getBaseIndex(newX, newY, newSize.x);
            newData[dstIndex] = l.data[srcIndex];
            newData[dstIndex + 1] = l.data[srcIndex + 1];
            newData[dstIndex + 2] = l.data[srcIndex + 2];
            newData[dstIndex + 3] = l.data[srcIndex + 3];
          }
        }
        return { ...l, data: newData };
      });

      const action: NewAction = {
        action: "new",
        layers: newLayers,
        prevLayers: layers,
        activeLayerId,
        prevActiveLayerId: activeLayerId,
        size: newSize,
        prevSize: gridSize,
      };
      updateHistory(action);

      let pxSize = BASE_CANVAS_SIZE / Math.max(newSize.x, newSize.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      initActions();
      return {
        layers: newLayers,
        gridSize: newSize,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      };
    });
  },
  importFromPxsm: (data) =>
    set((state) => {
      if (!isValidPxsmData(data)) {
        toast.error(
          "The imported file is invalid and may have been corrupted.",
        );
        return {};
      }
      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        state;
      const newLayers: Layer[] = data.layers.map((layer) => ({
        ...layer,
        data: new Uint8ClampedArray(layer.data),
      }));
      let pxSize = BASE_CANVAS_SIZE / Math.max(data.width, data.height);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const action: NewAction = {
        action: "new",
        layers: newLayers,
        prevLayers: layers,
        activeLayerId: data.activeLayerId,
        prevActiveLayerId: activeLayerId,
        size: { x: data.width, y: data.height },
        prevSize: gridSize,
      };
      updateHistory(action);

      toast.success("File imported successfully!");
      initActions();
      return {
        layers: newLayers,
        activeLayerId: data.activeLayerId,
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

      const { layers, activeLayerId, gridSize, initActions, updateHistory } =
        get();
      const data = new Uint8ClampedArray(imageData.data);
      const layer = createNewLayer(width, height, "Layer 1", data);
      let pxSize = BASE_CANVAS_SIZE / Math.max(width, height);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;

      const action: NewAction = {
        action: "new",
        layers: [layer],
        prevLayers: layers,
        activeLayerId: layer.id,
        prevActiveLayerId: activeLayerId,
        size: { x: width, y: height },
        prevSize: gridSize,
      };
      updateHistory(action);

      initActions();
      set({
        layers: [layer],
        activeLayerId: layer.id,
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
    const { layers, activeLayerId, gridSize } = get();
    const newLayers: PxsmLayerData[] = layers.map((layer) => ({
      ...layer,
      data: Array.from(layer.data),
    }));
    const pxsmData: PxsmData = {
      version: "1.0.0",
      width: gridSize.x,
      height: gridSize.y,
      layers: newLayers,
      activeLayerId,
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
    const { layers, gridSize } = get();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Failed to export the image.");
      return;
    }
    canvas.width = Math.floor(gridSize.x * scale);
    canvas.height = Math.floor(gridSize.y * scale);

    const imageData = new ImageData(
      compositeLayers(layers, gridSize.x, gridSize.y) as ImageDataArray,
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
        activeLayerId,
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
            selectedPixels: getPixelsInRect(selectedArea, mask, activeLayerId),
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
  applySelectionAction: () => {
    const {
      activeLayerId,
      gridSize,
      selectionMask,
      selectionMoveOffset,
      selectionResizeOffset,
      selectedArea,
      selectedPixels,
      isPasting,
      getActiveLayer,
      setLayerData,
      getPixelsInRect,
      getEffectiveSelectionBounds,
      initSelection,
      updateHistory,
    } = get();

    const layer = getActiveLayer();
    const moveOff = selectionMoveOffset || { x: 0, y: 0 };
    const resizeOff = selectionResizeOffset || { n: 0, e: 0, s: 0, w: 0 };
    const hasMoved = moveOff.x !== 0 || moveOff.y !== 0;
    const hasResized =
      resizeOff.n !== 0 ||
      resizeOff.e !== 0 ||
      resizeOff.s !== 0 ||
      resizeOff.w !== 0;
    if (
      layer.locked ||
      (!hasMoved && !hasResized && !isPasting) ||
      !selectedArea
    ) {
      initSelection();
      return;
    }

    const newData = new Uint8ClampedArray(layer.data);
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
        layerId: activeLayerId,
        area: newSelectedArea,
        pixels: pixelsToApply,
        prevPixels: getPixelsInRect(newSelectedArea, newMask, activeLayerId),
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
        layerId: activeLayerId,
        srcRect: selectedArea,
        dstRect: newSelectedArea,
        srcPixels: selectedPixels,
        dstPixels: getPixelsInRect(newSelectedArea, newMask, activeLayerId),
        mask: selectionMask,
      };
      updateHistory(action);
    }

    initSelection();
    setLayerData(newData, activeLayerId);
  },
  deleteSelection: () => {
    const {
      activeLayerId,
      gridSize,
      selectionMask,
      selectedArea,
      isPasting,
      getActiveLayer,
      setLayerData,
      getPixelsInRect,
      initSelection,
      updateHistory,
    } = get();
    if (!selectedArea) return;
    if (isPasting) {
      initSelection();
      return;
    }

    const layer = getActiveLayer();
    if (layer.locked) return;
    const newData = new Uint8ClampedArray(layer.data);
    clearRectContent(selectedArea, newData, gridSize, selectionMask);

    const action: DeleteAction = {
      action: "delete",
      layerId: activeLayerId,
      area: selectedArea,
      pixels: getPixelsInRect(selectedArea, selectionMask, activeLayerId),
      mask: selectionMask,
    };
    updateHistory(action);

    initSelection();
    setLayerData(newData, activeLayerId);
  },
  performWandSelection: (x, y) =>
    set((state) => {
      const { activeLayerId, gridSize, getPixelColor, getPixelsInRect } = state;
      if (!isValidIndex(x, y, gridSize)) return {};

      const targetColor = getPixelColor(x, y, activeLayerId);
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

        const currentColor = getPixelColor(cx, cy, activeLayerId);
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
        selectedPixels: getPixelsInRect(selectedArea, mask, activeLayerId),
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
  applyMove: (mod) =>
    set((state) => {
      const {
        activeLayerId,
        gridSize,
        moveOffset,
        getActiveLayer,
        setLayerData,
        updateHistory,
      } = state;
      if (!moveOffset || (moveOffset.x === 0 && moveOffset.y === 0))
        return { moveStartPos: null, moveOffset: null };

      const newMoveOffset = { ...moveOffset };
      if (mod) {
        if (Math.abs(moveOffset.x) >= Math.abs(moveOffset.y))
          newMoveOffset.y = 0;
        else newMoveOffset.x = 0;
      }

      const layer = getActiveLayer();
      if (layer.locked) return {};
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);
      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const srcX = x - newMoveOffset.x;
          const srcY = y - newMoveOffset.y;

          if (isValidIndex(srcX, srcY, gridSize)) {
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, gridSize.x);
            newData[dstIndex] = layer.data[srcIndex];
            newData[dstIndex + 1] = layer.data[srcIndex + 1];
            newData[dstIndex + 2] = layer.data[srcIndex + 2];
            newData[dstIndex + 3] = layer.data[srcIndex + 3];
          }
        }
      }

      const action: MoveAction = {
        action: "move",
        layerId: activeLayerId,
        data: layer.data,
        offset: newMoveOffset,
      };
      updateHistory(action);

      setLayerData(newData, activeLayerId);
      return { moveStartPos: null, moveOffset: null };
    }),
  undo: () => {
    const {
      layers,
      gridSize,
      undoHistory,
      redoHistory,
      initActions,
      getLayer,
      setLayerData,
    } = get();
    if (undoHistory.length === 0) return;

    const newUndoHistory = [...undoHistory];
    const action = newUndoHistory.shift()!;
    const newRedoHistory = [action, ...redoHistory];

    if (action.action === "draw") {
      const layer = getLayer(action.layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
      for (let i = 0; i < action.pixels.length; i++) {
        const { x, y, prevColor } = action.pixels[i];
        const baseIndex = getBaseIndex(x, y, gridSize.x);
        newData[baseIndex] = prevColor.r;
        newData[baseIndex + 1] = prevColor.g;
        newData[baseIndex + 2] = prevColor.b;
        newData[baseIndex + 3] = prevColor.a;
      }
      setLayerData(newData, action.layerId);
      set({ activeLayerId: action.layerId });
    } else if (action.action === "bucket") {
      setLayerData(action.prevData, action.layerId);
      set({ activeLayerId: action.layerId });
    } else if (action.action === "transform") {
      const { layerId, srcRect, dstRect, srcPixels, dstPixels, mask } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
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
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "move") {
      setLayerData(action.data, action.layerId);
      set({ activeLayerId: action.layerId });
    } else if (action.action === "delete") {
      const { layerId, area, pixels, mask } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
      drawRectContent(area, pixels, newData, gridSize, true, mask);
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "paste") {
      const { layerId, area, prevPixels, mask } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
      drawRectContent(area, prevPixels, newData, gridSize, false, mask);
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "new") {
      const { prevLayers, prevActiveLayerId, prevSize } = action;
      let pxSize = BASE_CANVAS_SIZE / Math.max(prevSize.x, prevSize.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;
      set({
        layers: prevLayers,
        activeLayerId: prevActiveLayerId,
        gridSize: prevSize,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      });
    } else if (action.action === "clear") {
      setLayerData(action.prevData, action.layerId);
      set({ activeLayerId: action.layerId });
    } else if (action.action === "layer-structure") {
      const restoredLayers = action.prevLayers.map((layer) => {
        const curr = layers.find((l) => l.id === layer.id);
        if (curr) {
          return {
            ...layer,
            name: curr.name,
            visible: curr.visible,
            locked: curr.locked,
            opacity: curr.opacity,
          };
        }
        return layer;
      });
      set({ layers: restoredLayers, activeLayerId: action.prevActiveLayerId });
    } else if (action.action === "layer-toggle") {
      if (action.toggle === "visible") {
        set({
          layers: layers.map((l) =>
            l.id === action.layerId ? { ...l, visible: !l.visible } : l,
          ),
        });
      } else if (action.toggle === "locked") {
        set({
          layers: layers.map((l) =>
            l.id === action.layerId ? { ...l, locked: !l.locked } : l,
          ),
        });
      }
    } else if (action.action === "layer-rename") {
      set({
        layers: layers.map((l) =>
          l.id === action.layerId ? { ...l, name: action.prevName } : l,
        ),
      });
    }

    initActions();
    set({
      undoHistory: newUndoHistory,
      redoHistory: newRedoHistory,
    });
  },
  redo: () => {
    const {
      layers,
      gridSize,
      undoHistory,
      redoHistory,
      initActions,
      getLayer,
      setLayerData,
      floodFill,
    } = get();
    if (redoHistory.length === 0) return;

    const newRedoHistory = [...redoHistory];
    const action = newRedoHistory.shift()!;
    const newUndoHistory = [action, ...undoHistory];

    if (action.action === "draw") {
      const layer = getLayer(action.layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
      for (let i = action.pixels.length - 1; i >= 0; i--) {
        const { x, y, color } = action.pixels[i];
        const baseIndex = getBaseIndex(x, y, gridSize.x);
        newData[baseIndex] = color.r;
        newData[baseIndex + 1] = color.g;
        newData[baseIndex + 2] = color.b;
        newData[baseIndex + 3] = color.a;
      }
      setLayerData(newData, action.layerId);
      set({ activeLayerId: action.layerId });
    } else if (action.action === "bucket") {
      const { layerId, x, y, color } = action;
      set({ activeLayerId: layerId });
      floodFill(x, y, color, false);
    } else if (action.action === "transform") {
      const { layerId, srcRect, dstRect, srcPixels, mask } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
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
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "move") {
      const { layerId, offset } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);

      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const srcX = x - offset.x;
          const srcY = y - offset.y;
          if (isValidIndex(srcX, srcY, gridSize)) {
            const srcIndex = getBaseIndex(srcX, srcY, gridSize.x);
            const dstIndex = getBaseIndex(x, y, gridSize.x);
            newData[dstIndex] = layer.data[srcIndex];
            newData[dstIndex + 1] = layer.data[srcIndex + 1];
            newData[dstIndex + 2] = layer.data[srcIndex + 2];
            newData[dstIndex + 3] = layer.data[srcIndex + 3];
          }
        }
      }
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "delete") {
      const { layerId, area, mask } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
      clearRectContent(area, newData, gridSize, mask);
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "paste") {
      const { layerId, area, pixels, mask } = action;
      const layer = getLayer(layerId) as Layer;
      const newData = new Uint8ClampedArray(layer.data);
      drawRectContent(area, pixels, newData, gridSize, true, mask);
      setLayerData(newData, layerId);
      set({ activeLayerId: layerId });
    } else if (action.action === "new") {
      const { layers, activeLayerId, size } = action;
      let pxSize = BASE_CANVAS_SIZE / Math.max(size.x, size.y);
      if (pxSize < MIN_PX_SIZE) pxSize = MIN_PX_SIZE;
      if (pxSize > MAX_PX_SIZE) pxSize = MAX_PX_SIZE;
      const zoomLevel = pxSize / BASE_PX_SIZE;
      set({
        layers,
        activeLayerId,
        gridSize: size,
        panOffset: { x: 0, y: 0 },
        zoomLevel,
      });
    } else if (action.action === "clear") {
      const newData = new Uint8ClampedArray(gridSize.x * gridSize.y * 4);
      setLayerData(newData, action.layerId);
      set({ activeLayerId: action.layerId });
    } else if (action.action === "layer-structure") {
      const restoredLayers = action.layers.map((layer) => {
        const curr = layers.find((l) => l.id === layer.id);
        if (curr) {
          return {
            ...layer,
            name: curr.name,
            visible: curr.visible,
            locked: curr.locked,
            opacity: curr.opacity,
          };
        }
        return layer;
      });
      set({ layers: restoredLayers, activeLayerId: action.activeLayerId });
    } else if (action.action === "layer-toggle") {
      if (action.toggle === "visible") {
        set({
          layers: layers.map((l) =>
            l.id === action.layerId ? { ...l, visible: !l.visible } : l,
          ),
        });
      } else if (action.toggle === "locked") {
        set({
          layers: layers.map((l) =>
            l.id === action.layerId ? { ...l, locked: !l.locked } : l,
          ),
        });
      }
    } else if (action.action === "layer-rename") {
      set({
        layers: layers.map((l) =>
          l.id === action.layerId ? { ...l, name: action.name } : l,
        ),
      });
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
      const { activeLayerId, drawBuffer, updateHistory } = state;
      if (drawBuffer.length === 0)
        return { drawnPixels: new Set(), lastDrawPos: null };
      const action: DrawAction = {
        action: "draw",
        layerId: activeLayerId,
        pixels: drawBuffer,
      };
      updateHistory(action);
      return { drawBuffer: [], drawnPixels: new Set(), lastDrawPos: null };
    }),
  cut: () => {
    const {
      showSelectionPreview,
      isPasting,
      getActiveLayer,
      deleteSelection,
      copy,
    } = get();
    if (!showSelectionPreview) return;
    const layer = getActiveLayer();
    if (layer.locked && !isPasting) return;
    copy();
    deleteSelection();
  },
  copy: () =>
    set((state) => {
      const {
        selectionMask,
        selectedArea,
        selectedPixels,
        showSelectionPreview,
        getEffectiveSelectionBounds,
      } = state;
      if (!selectedArea || !showSelectionPreview) return {};

      const bounds = getEffectiveSelectionBounds() as Rect;
      let newMask = selectionMask;
      let pixelsToCopy = selectedPixels;
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
        lineStartPos,
        lineEndPos,
        shapeStartPos,
        shapeEndPos,
        showSelectionPreview,
        moveOffset,
        mousePos,
        clipboard,
        getActiveLayer,
        getActiveColorRGBA,
        drawLine,
        drawShape,
        initSelection,
        applySelectionAction,
        applyMove,
        clearDrawBuffer,
        paste,
      } = state;
      const layer = getActiveLayer();
      if (layer.locked || !clipboard) return {};

      if (showSelectionPreview) {
        applySelectionAction();
        paste();
        return {};
      }
      if (moveOffset) applyMove(false);
      if (lineStartPos && lineEndPos) drawLine(getActiveColorRGBA(), false);
      if (shapeStartPos && shapeEndPos)
        drawShape(getActiveColorRGBA(), false, false);
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
        selectionMask: mask,
        selectedArea: newSelectedArea,
        selectedPixels: pixels,
        showSelectionPreview: true,
        isPasting: true,
      };
    }),
  clearEdit: () => {
    const { showSelectionPreview, clearLayer, deleteSelection } = get();
    if (showSelectionPreview) deleteSelection();
    else clearLayer();
  },
}));
