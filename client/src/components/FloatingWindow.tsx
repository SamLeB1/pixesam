import { type ReactNode, useRef, useCallback, useState } from "react";
import { MdClose } from "react-icons/md";

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
  defaultPosition = { x: 100, y: 100 },
}: FloatingWindowProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [zBoost, setZBoost] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setZBoost(true);
      dragRef.current = {
        startX: e.clientX - position.x,
        startY: e.clientY - position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
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
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div
      ref={windowRef}
      className="fixed rounded border border-neutral-600 bg-neutral-800 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        zIndex: zBoost ? 60 : 50,
        minWidth: 200,
      }}
      onPointerDown={() => setZBoost(true)}
    >
      <div
        className="flex cursor-grab items-center justify-between rounded-t bg-neutral-700 px-3 py-1.5 select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-sm text-neutral-200">{title}</span>
        <button
          className="cursor-pointer rounded p-0.5 hover:bg-neutral-600"
          type="button"
          onClick={onClose}
        >
          <MdClose size={16} color="oklch(87% 0 0)" />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
