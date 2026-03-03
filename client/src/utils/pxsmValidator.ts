export function isValidPxsmData(data: unknown) {
  if (typeof data !== "object" || data === null) return false;

  const d = data as Record<string, unknown>;

  if (typeof d.version !== "string") return false;
  if (typeof d.width !== "number") return false;
  if (typeof d.height !== "number") return false;
  if (typeof d.activeLayerId !== "string") return false;
  if (!Array.isArray(d.layers)) return false;

  for (const layer of d.layers) {
    if (typeof layer !== "object" || layer === null) return false;
    if (typeof layer.id !== "string") return false;
    if (typeof layer.name !== "string") return false;
    if (typeof layer.visible !== "boolean") return false;
    if (typeof layer.locked !== "boolean") return false;
    if (typeof layer.opacity !== "number") return false;
    if (!Array.isArray(layer.data)) return false;
  }

  return true;
}
