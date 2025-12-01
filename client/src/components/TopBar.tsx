import BtnFile from "./BtnFile";

export default function TopBar() {
  return (
    <div className="flex items-center bg-gray-700 px-8">
      <h1 className="mr-8 text-xl text-white select-none">Pixesam</h1>
      <BtnFile />
    </div>
  );
}
