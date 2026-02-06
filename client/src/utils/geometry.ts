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
