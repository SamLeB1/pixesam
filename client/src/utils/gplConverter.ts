import tinycolor from "tinycolor2";
import type { ColorPalette } from "../types";

/**
 * Converts a ColorPalette to GPL (GIMP Palette) format string
 */
export function paletteToGpl(palette: ColorPalette): string {
  const lines: string[] = ["GIMP Palette", `Name: ${palette.name}`, "#"];

  for (const hexColor of palette.colors) {
    const { r, g, b } = tinycolor(hexColor).toRgb();
    lines.push(`${r} ${g} ${b}`);
  }

  return lines.join("\n");
}

/**
 * Parses a GPL (GIMP Palette) format string into palette data
 * Returns null if the format is invalid
 */
export function parseGpl(
  gplContent: string,
): { name: string; colors: string[] } | null {
  const lines = gplContent.split(/\r?\n/);

  // Validate header
  if (lines.length < 2 || lines[0].trim() !== "GIMP Palette") {
    return null;
  }

  // Extract name
  let name = "Imported palette";
  if (lines[1].startsWith("Name:")) {
    name = lines[1].substring(5).trim();
  }

  const colors: string[] = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("#")) continue;

    // Parse RGB values (format: "R G B" or "R G B\tColorName")
    const match = line.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);

      // Validate RGB range
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        colors.push(tinycolor({ r, g, b }).toHexString());
      }
    }
  }

  return { name, colors };
}
