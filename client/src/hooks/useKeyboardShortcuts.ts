import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import useCanvasZoom from "./useCanvasZoom";

export default function useKeyboardShortcuts() {
  const { selectTool, undo, redo, copy, paste, deleteSelection } =
    useEditorStore();
  const { zoomStepTowardsCenter, resetZoom } = useCanvasZoom();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        target.contentEditable === "true";
      if (editable) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (isCmdOrCtrl && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo();
      } else if (isCmdOrCtrl && e.shiftKey && key === "z") {
        e.preventDefault();
        redo();
      } else if (isCmdOrCtrl && key === "y") {
        e.preventDefault();
        redo();
      } else if (isCmdOrCtrl && key === "c") {
        e.preventDefault();
        copy();
      } else if (isCmdOrCtrl && key === "v") {
        e.preventDefault();
        paste();
      } else if (key === "p") {
        e.preventDefault();
        selectTool("pencil");
      } else if (key === "e") {
        e.preventDefault();
        selectTool("eraser");
      } else if (key === "c") {
        e.preventDefault();
        selectTool("color-picker");
      } else if (key === "b") {
        e.preventDefault();
        selectTool("bucket");
      } else if (key === "l") {
        e.preventDefault();
        selectTool("line");
      } else if (key === "h") {
        e.preventDefault();
        selectTool("shape");
      } else if (key === "d") {
        e.preventDefault();
        selectTool("shade");
      } else if (key === "s") {
        e.preventDefault();
        selectTool("select");
      } else if (key === "m") {
        e.preventDefault();
        selectTool("move");
      } else if (key === "+" || key === "=") {
        e.preventDefault();
        zoomStepTowardsCenter(true);
      } else if (key === "-") {
        e.preventDefault();
        zoomStepTowardsCenter(false);
      } else if (key === "0") {
        e.preventDefault();
        resetZoom();
      } else if (key === "delete" || key === "backspace") {
        e.preventDefault();
        deleteSelection();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectTool,
    undo,
    redo,
    copy,
    paste,
    zoomStepTowardsCenter,
    resetZoom,
    deleteSelection,
  ]);
}
