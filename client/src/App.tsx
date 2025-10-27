import Canvas from "./components/Canvas";
import TopBar from "./components/TopBar";
import SideBarLeft from "./components/SideBarLeft";
import SideBarRight from "./components/SideBarRight";

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-neutral-900">
      <TopBar />
      <div className="flex flex-grow overflow-hidden">
        <SideBarLeft />
        <div className="flex flex-grow items-center justify-center overflow-auto">
          <Canvas />
        </div>
        <SideBarRight />
      </div>
    </div>
  );
}
