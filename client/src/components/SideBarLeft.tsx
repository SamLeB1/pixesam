export default function SideBarLeft() {
  return (
    <div className="bg-neutral-800 p-2">
      <h3 className="mb-2 text-center text-white select-none">Tools</h3>
      <button
        className="cursor-pointer p-2 hover:bg-neutral-600"
        type="button"
        title="Pencil tool"
      >
        <div className="h-8 w-8 bg-white"></div>
      </button>
      <button
        className="cursor-pointer p-2 hover:bg-neutral-600"
        type="button"
        title="Eraser tool"
      >
        <div className="h-8 w-8 bg-white"></div>
      </button>
    </div>
  );
}
