import { useEffect } from "react";
import { Toaster } from "sonner";
import Canvas from "./components/Canvas";
import TopBar from "./components/TopBar";
import SideBarLeft from "./components/SideBarLeft";
import SideBarRight from "./components/SideBarRight";
import BottomBar from "./components/BottomBar";
import ToolOptionsBar from "./components/ToolOptionsBar";

export default function App() {
  useEffect(() => {
    const modal = document.getElementById("modal-new") as HTMLDialogElement;
    if (modal) {
      modal.showModal();
      (document.activeElement as HTMLElement)?.blur();
    }
  }, []);

  return (
    <>
      <div className="flex h-screen flex-col bg-neutral-900">
        <TopBar />
        <div className="flex flex-grow overflow-hidden">
          <SideBarLeft />
          <div className="flex flex-grow flex-col">
            <ToolOptionsBar />
            <Canvas />
          </div>
          <SideBarRight />
        </div>
        <BottomBar />
      </div>
      <Toaster richColors position={"top-center"} />
    </>
  );
}
