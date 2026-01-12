import tinycolor from "tinycolor2";

/**
 * Extracts unique colors from pixel data, sorted by frequency.
 * Skips fully transparent pixels.
 *
 * @param data - RGBA pixel data (Uint8ClampedArray)
 * @param maxColors - Maximum colors to return (default: 256)
 * @returns Array of hex color strings, sorted by frequency (most common first)
 */
export function extractColorsFromPixelData(
  data: Uint8ClampedArray,
  maxColors: number = 256,
): string[] {
  const colorFrequency = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip fully transparent pixels
    if (a === 0) continue;

    // Convert to hex (ignoring alpha for palette purposes)
    const hex = tinycolor({ r, g, b }).toHexString();

    // Increment frequency count
    colorFrequency.set(hex, (colorFrequency.get(hex) || 0) + 1);
  }

  // Sort by frequency (descending) and take top maxColors
  const sortedColors = Array.from(colorFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex]) => hex);

  return sortedColors;
}
