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

export function getConstrainedLinePoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return [];

  const angle = Math.atan2(dy, dx);
  const increment = Math.PI / 8;
  const snappedIndex = ((Math.round(angle / increment) % 16) + 16) % 16;

  // Normalize to 0-4 to get the base pattern
  const half = snappedIndex <= 8 ? snappedIndex : 16 - snappedIndex;
  const octant = half <= 4 ? half : 8 - half;

  // Stepping patterns for octants 0-4:
  // 0 = 0°:    (1,0)           - horizontal
  // 1 = 22.5°: (1,0),(1,1)     - 2 x-steps per 1 y-step
  // 2 = 45°:   (1,1)           - diagonal
  // 3 = 67.5°: (0,1),(1,1)     - 2 y-steps per 1 x-step
  // 4 = 90°:   (0,1)           - vertical
  type Step = [number, number];
  const patterns: Step[][] = [
    [[1, 0]],
    [
      [1, 0],
      [1, 1],
    ],
    [[1, 1]],
    [
      [0, 1],
      [1, 1],
    ],
    [[0, 1]],
  ];

  const pattern = patterns[octant];
  const sx = dx >= 0 ? 1 : -1;
  const sy = dy >= 0 ? 1 : -1;

  // Terminate based on whether the angle is more horizontal or vertical
  // For 45° diagonals, use the closer coordinate so the line stops at the first one reached
  const target =
    octant === 2
      ? Math.min(Math.abs(dx), Math.abs(dy))
      : octant < 2
        ? Math.abs(dx)
        : Math.abs(dy);

  const points: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;
  let stepIndex = 0;

  while (true) {
    const [pdx, pdy] = pattern[stepIndex % pattern.length];
    cx += pdx;
    cy += pdy;
    const progress = octant <= 2 ? cx : cy;
    if (progress > target) break;
    points.push({ x: start.x + cx * sx, y: start.y + cy * sy });
    stepIndex++;
  }

  return points;
}

export function getRectOutlinePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  if (x1 === x2 && y1 === y2) return [{ x: x1, y: y1 }];
  const points: { x: number; y: number }[] = [];
  for (let i = x1; i < x2; i++) points.push({ x: i, y: y1 });
  for (let i = y1; i < y2; i++) points.push({ x: x2, y: i });
  for (let i = x2; i > x1; i--) points.push({ x: i, y: y2 });
  for (let i = y2; i > y1; i--) points.push({ x: x1, y: i });
  return points;
}

export function getRectFillPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const points: { x: number; y: number }[] = [];
  for (let i = y1; i <= y2; i++)
    for (let j = x1; j <= x2; j++) points.push({ x: j, y: i });
  return points;
}

export function getEllipseOutlinePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const points: { x: number; y: number }[] = [];
  let a = Math.abs(x2 - x1);
  const b = Math.abs(y2 - y1);
  let b1 = b & 1;
  let dx = 4 * (1 - a) * b * b;
  let dy = 4 * (b1 + 1) * a * a;
  let err = dx + dy + b1 * a * a;

  if (x1 > x2) {
    x1 = x2;
    x2 += a;
  }
  if (y1 > y2) y1 = y2;
  y1 += Math.floor((b + 1) / 2);
  y2 = y1 - b1;
  a *= 8 * a;
  b1 = 8 * b * b;

  do {
    points.push({ x: x2, y: y1 });
    points.push({ x: x1, y: y1 });
    points.push({ x: x1, y: y2 });
    points.push({ x: x2, y: y2 });
    const e2 = 2 * err;
    if (e2 <= dy) {
      y1++;
      y2--;
      err += dy += a;
    }
    if (e2 >= dx || 2 * err > dy) {
      x1++;
      x2--;
      err += dx += b1;
    }
  } while (x1 <= x2);

  while (y1 - y2 < b) {
    points.push({ x: x1 - 1, y: y1 });
    points.push({ x: x2 + 1, y: y1 });
    y1++;
    points.push({ x: x1 - 1, y: y2 });
    points.push({ x: x2 + 1, y: y2 });
    y2--;
  }

  return points;
}

export function getEllipseFillPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const points: { x: number; y: number }[] = [];
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rx = (x2 - x1) / 2;
  const ry = (y2 - y1) / 2;
  if (rx < 0 || ry < 0) return points;

  for (let y = y1; y <= y2; y++) {
    const dy = y - cy;
    if (ry === 0) {
      for (let x = x1; x <= x2; x++) points.push({ x, y });
      continue;
    }
    const xSpan = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
    const xMin = Math.max(x1, Math.ceil(cx - xSpan));
    const xMax = Math.min(x2, Math.floor(cx + xSpan));
    for (let x = xMin; x <= xMax; x++) {
      points.push({ x, y });
    }
  }
  return points;
}

export function getModdedShapeBounds(
  start: { x: number; y: number },
  end: { x: number; y: number },
  mod1: boolean,
  mod2: boolean,
): { x1: number; y1: number; x2: number; y2: number } {
  let dx = end.x - start.x;
  let dy = end.y - start.y;

  if (mod1) {
    const size = Math.min(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx) * size;
    dy = Math.sign(dy) * size;
  }

  let x1: number, y1: number, x2: number, y2: number;

  if (mod2) {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    x1 = start.x - absDx;
    y1 = start.y - absDy;
    x2 = start.x + absDx;
    y2 = start.y + absDy;
  } else {
    const adjustedEnd = { x: start.x + dx, y: start.y + dy };
    x1 = Math.min(start.x, adjustedEnd.x);
    y1 = Math.min(start.y, adjustedEnd.y);
    x2 = Math.max(start.x, adjustedEnd.x);
    y2 = Math.max(start.y, adjustedEnd.y);
  }

  return { x1, y1, x2, y2 };
}

export function isInPolygon(
  x: number,
  y: number,
  polygon: { x: number; y: number }[],
) {
  if (polygon.some((p) => p.x === x && p.y === y)) return true;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
