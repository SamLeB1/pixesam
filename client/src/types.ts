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

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PxsmData = {
  version: string;
  width: number;
  height: number;
  pixels: number[];
};
