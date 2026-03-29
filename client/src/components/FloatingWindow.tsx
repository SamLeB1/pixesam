import { type ReactNode, useRef, useState } from "react";

type FloatingWindowProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  defaultPosition?: { x: number; y: number };
};

export default function FloatingWindow({
  title,
  children,
  onClose,
  defaultPosition = { x: 150, y: 100 },
}: FloatingWindowProps) {
  const [position, setPosition] = useState(defaultPosition);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !windowRef.current) return;
    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;
    const rect = windowRef.current.getBoundingClientRect();
    const clampedX = Math.max(
      0,
      Math.min(newX, window.innerWidth - rect.width),
    );
    const clampedY = Math.max(
      0,
      Math.min(newY, window.innerHeight - rect.height),
    );
    setPosition({ x: clampedX, y: clampedY });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div
      ref={windowRef}
      className="fixed z-20 min-w-64 rounded-lg border border-neutral-600 bg-neutral-800 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between rounded-t-lg bg-neutral-700 p-1.5 pl-3 select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-sm">{title}</span>
        <button
          className="btn btn-xs btn-circle btn-ghost"
          type="button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
