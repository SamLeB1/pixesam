import { useEffect, useState } from "react";

type ModifierKeys = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
};

export default function useModifierKeys(): ModifierKeys {
  const [keys, setKeys] = useState<ModifierKeys>({
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
  });

  useEffect(() => {
    function update(e: KeyboardEvent) {
      setKeys((prev) => {
        if (
          prev.shift === e.shiftKey &&
          prev.ctrl === e.ctrlKey &&
          prev.alt === e.altKey &&
          prev.meta === e.metaKey
        )
          return prev;
        return {
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          alt: e.altKey,
          meta: e.metaKey,
        };
      });
    }

    window.addEventListener("keydown", update);
    window.addEventListener("keyup", update);
    return () => {
      window.removeEventListener("keydown", update);
      window.removeEventListener("keyup", update);
    };
  }, []);

  return keys;
}
