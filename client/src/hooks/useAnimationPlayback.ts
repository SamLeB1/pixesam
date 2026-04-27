import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";

export default function useAnimationPlayback() {
  const isPlayingAnimation = useEditorStore((s) => s.isPlayingAnimation);
  const fps = useEditorStore((s) => s.fps);
  const frameCount = useEditorStore((s) => s.frames.length);

  useEffect(() => {
    if (!isPlayingAnimation || frameCount < 2) return;

    const interval = setInterval(() => {
      const { frames, activeFrameId, selectFrame } = useEditorStore.getState();
      const index = frames.findIndex((f) => f.id === activeFrameId);
      const nextIndex = (index + 1) % frames.length;
      selectFrame(frames[nextIndex].id);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isPlayingAnimation, fps, frameCount]);
}
