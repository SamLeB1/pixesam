export type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type Side =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Direction = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Clipboard = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  mask: Uint8Array | null;
};

export type ColorPalette = {
  id: string;
  name: string;
  colors: string[];
  isDefault: boolean;
};

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
};

export type Frame = { id: string };

export type Cels = Record<string, Uint8ClampedArray>;

export type PxsmData = {
  version: string;
  width: number;
  height: number;
  fps: number;
  layers: Layer[];
  frames: Frame[];
  cels: Cels;
  activeLayerId: string;
  activeFrameId: string;
};
