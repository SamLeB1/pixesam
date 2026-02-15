import { useEffect, useMemo, useCallback, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { CHECKER_LIGHT, CHECKER_DARK } from "../constants";
import type { Rect } from "../types";

const CONTAINER_WIDTH = 256;
const CONTAINER_HEIGHT = 128;

export default function CanvasPreview() {
  const { pixelData, gridSize, visibleGridSize, panOffset, setPanOffset } =
    useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartPan = useRef({ x: 0, y: 0 });

  const canvasSize = useMemo(() => {
    const aspect = gridSize.x / gridSize.y;
    const containerAspect = CONTAINER_WIDTH / CONTAINER_HEIGHT;
    if (containerAspect > aspect) {
      return {
        width: Math.floor(CONTAINER_HEIGHT * aspect),
        height: CONTAINER_HEIGHT,
      };
    } else {
      return {
        width: CONTAINER_WIDTH,
        height: Math.floor(CONTAINER_WIDTH / aspect),
      };
    }
  }, [gridSize]);

  const checkerPattern = useMemo(() => {
    const pxSize = canvasSize.width / gridSize.x;
    const tileSize = pxSize * 2;
    const tile = document.createElement("canvas");
    tile.width = Math.max(1, Math.round(tileSize));
    tile.height = Math.max(1, Math.round(tileSize));
    const tCtx = tile.getContext("2d")!;
    tCtx.fillStyle = CHECKER_LIGHT;
    tCtx.fillRect(0, 0, tileSize, tileSize);
    tCtx.fillStyle = CHECKER_DARK;
    tCtx.fillRect(0, 0, pxSize, pxSize);
    tCtx.fillRect(pxSize, pxSize, pxSize, pxSize);
    return tile;
  }, [gridSize, canvasSize]);

  const viewportRect: Rect | null = useMemo(() => {
    const showsAll =
      visibleGridSize.x >= gridSize.x && visibleGridSize.y >= gridSize.y;
    if (showsAll) return null;
    const pxSize = canvasSize.width / gridSize.x;
    return {
      x: panOffset.x * pxSize,
      y: panOffset.y * pxSize,
      width: Math.min(visibleGridSize.x, gridSize.x) * pxSize,
      height: Math.min(visibleGridSize.y, gridSize.y) * pxSize,
    };
  }, [gridSize, visibleGridSize, panOffset, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw checkerboard
    const pattern = ctx.createPattern(checkerPattern, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    // Draw pixel data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = gridSize.x;
    tempCanvas.height = gridSize.y;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      const imageData = new ImageData(
        pixelData as ImageDataArray,
        gridSize.x,
        gridSize.y,
      );
      tempCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, canvasSize.width, canvasSize.height);
    }

    // Draw viewport rect
    if (viewportRect) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(
        viewportRect.x,
        viewportRect.y,
        viewportRect.width,
        viewportRect.height,
      );
      ctx.strokeStyle = "oklch(62.3% 0.214 259.815)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        viewportRect.x + 1,
        viewportRect.y + 1,
        viewportRect.width - 2,
        viewportRect.height - 2,
      );
    }
  }, [pixelData, gridSize, canvasSize, checkerPattern, viewportRect]);

  const clampPanOffset = useCallback(
    (offset: { x: number; y: number }) => {
      const maxX = gridSize.x - visibleGridSize.x;
      const maxY = gridSize.y - visibleGridSize.y;
      return {
        x: Math.max(0, Math.min(offset.x, maxX)),
        y: Math.max(0, Math.min(offset.y, maxY)),
      };
    },
    [gridSize, visibleGridSize],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0 || !viewportRect) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if click is inside viewport rect
      if (
        mouseX >= viewportRect.x &&
        mouseX <= viewportRect.x + viewportRect.width &&
        mouseY >= viewportRect.y &&
        mouseY <= viewportRect.y + viewportRect.height
      ) {
        isDragging.current = true;
        dragStartMouse.current = { x: mouseX, y: mouseY };
        dragStartPan.current = { x: panOffset.x, y: panOffset.y };
      } else {
        // Click outside viewport rect - center viewport on click position
        const pxSize = canvasSize.width / gridSize.x;
        const gridX = mouseX / pxSize;
        const gridY = mouseY / pxSize;
        const newOffset = clampPanOffset({
          x: gridX - visibleGridSize.x / 2,
          y: gridY - visibleGridSize.y / 2,
        });
        setPanOffset(newOffset);
        isDragging.current = true;
        dragStartMouse.current = { x: mouseX, y: mouseY };
        dragStartPan.current = newOffset;
      }
    },
    [
      gridSize,
      visibleGridSize,
      panOffset,
      canvasSize,
      viewportRect,
      setPanOffset,
      clampPanOffset,
    ],
  );

  useEffect(() => {
    if (!viewportRect) return;

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pxSize = canvasSize.width / gridSize.x;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dx = mouseX - dragStartMouse.current.x;
      const dy = mouseY - dragStartMouse.current.y;
      const newOffset = clampPanOffset({
        x: dragStartPan.current.x + dx / pxSize,
        y: dragStartPan.current.y + dy / pxSize,
      });
      setPanOffset(newOffset);
    }

    function handleMouseUp() {
      isDragging.current = false;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gridSize, canvasSize, viewportRect, setPanOffset, clampPanOffset]);

  return (
    <div
      className="mb-4 flex items-center justify-center bg-black"
      style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
    >
      <canvas
        className={`bg-white ${viewportRect && "cursor-pointer"}`}
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
