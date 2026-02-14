import { useMemo } from "react";
import { useEditorStore } from "../store/editorStore";

const CONTAINER_WIDTH = 256;
const CONTAINER_HEIGHT = 128;

export default function CanvasPreview() {
  const { gridSize } = useEditorStore();

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

  return (
    <div
      className="mb-4 flex items-center justify-center bg-black"
      style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
    >
      <canvas
        className="bg-white"
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </div>
  );
}
