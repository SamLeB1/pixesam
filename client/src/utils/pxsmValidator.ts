export function isValidPxsmData(data: unknown) {
  if (typeof data !== "object" || data === null) return false;

  const d = data as Record<string, unknown>;

  if (typeof d.version !== "string") return false;
  if (typeof d.width !== "number") return false;
  if (typeof d.height !== "number") return false;
  if (typeof d.fps !== "number") return false;
  if (typeof d.activeLayerId !== "string") return false;
  if (typeof d.activeFrameId !== "string") return false;
  if (!Array.isArray(d.layers)) return false;
  if (!Array.isArray(d.frames)) return false;
  if (typeof d.cels !== "object" || d.cels === null) return false;

  for (const layer of d.layers) {
    if (typeof layer !== "object" || layer === null) return false;
    if (typeof layer.id !== "string") return false;
    if (typeof layer.name !== "string") return false;
    if (typeof layer.visible !== "boolean") return false;
    if (typeof layer.locked !== "boolean") return false;
    if (typeof layer.opacity !== "number") return false;
    if (typeof layer.blendMode !== "string") return false;
  }

  for (const frame of d.frames) {
    if (typeof frame !== "object" || frame === null) return false;
    if (typeof frame.id !== "string") return false;
  }

  for (const key in d.cels as Record<string, unknown>) {
    const cel = (d.cels as Record<string, unknown>)[key];
    if (!Array.isArray(cel)) return false;
  }

  return true;
}
