import { useEffect, useRef } from "react";

const CANVAS_SIZE = 512;

type CanvasProps = {
  gridSize: { x: number; y: number };
};

export default function Canvas({ gridSize }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function drawGrid(ctx: CanvasRenderingContext2D) {
    const pxSize = getPxSize();
    ctx.fillStyle = "oklch(92.2% 0 0)";
    for (let i = 0; i < gridSize.y; i++)
      for (let j = 0; j < gridSize.x; j++)
        if (i % 2 === j % 2)
          ctx.fillRect(j * pxSize, i * pxSize, pxSize, pxSize);
  }

  function getPxSize() {
    return CANVAS_SIZE / Math.max(gridSize.x, gridSize.y);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx);
  }, []);

  return (
    <canvas
      className="bg-white"
      ref={canvasRef}
      id="canvas"
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
    ></canvas>
  );
}
