import BtnFile from "./BtnFile";

export default function TopBar() {
  return (
    <div className="flex items-center bg-neutral-800 px-8">
      <h1 className="mr-8 text-xl text-white select-none">Pixel Editor</h1>
      <BtnFile />
    </div>
  );
}
