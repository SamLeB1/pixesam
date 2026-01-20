export function interpolateBetweenPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x2 - x1);
  const dy = -Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x1 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y1 += sy;
    }
    points.push({ x: x1, y: y1 });
  }
  return points;
}
