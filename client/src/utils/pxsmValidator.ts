import type { PxsmData } from "../types";

export function isValidPxsmData(data: any): data is PxsmData {
  if (typeof data !== "object" || data === null) {
    console.error("Validation error: Data is not an object.");
    return false;
  }

  const requiredProps: Array<[keyof PxsmData, string]> = [
    ["version", "string"],
    ["width", "number"],
    ["height", "number"],
    ["pixels", "object"],
  ];
  for (const [prop, type] of requiredProps) {
    if (!(prop in data)) {
      console.error(
        `Validation error: Missing required property "${String(prop)}".`,
      );
      return false;
    }
    if (typeof data[prop] !== type) {
      console.error(
        `Validation error: Property "${String(prop)}" has wrong type. Expected "${type}", got "${typeof data[
          prop
        ]}".`,
      );
      return false;
    }
  }

  if (!Array.isArray(data.pixels)) {
    console.error("Validation error: pixels is not an array.");
    return false;
  }
  for (let i = 0; i < data.pixels.length; i++) {
    if (typeof data.pixels[i] !== "number") {
      console.error("Validation error: pixels contains non-numeric value.");
      return false;
    }
  }

  return true;
}
