import BtnFile from "./BtnFile";
import BtnEdit from "./BtnEdit";
import BtnSprite from "./BtnSprite";

export default function TopBar() {
  return (
    <div className="flex items-center bg-zinc-700 px-8">
      <h1 className="mr-8 text-xl font-medium text-blue-100 select-none">
        Pixesam
      </h1>
      <BtnFile />
      <BtnEdit />
      <BtnSprite />
    </div>
  );
}
