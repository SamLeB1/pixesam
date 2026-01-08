export default function ModalEditPalette() {
  return (
    <dialog id="modal-edit-palette" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>
      </div>
    </dialog>
  );
}
