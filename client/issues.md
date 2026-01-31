- Undo/redo mid draw action will leave the drawn pixels on the canvas without creating a draw action.

- The active color is unknown inside of the store which causes problems like not knowing which color to draw
  a line on tool change.
