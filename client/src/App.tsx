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
        <Canvas />
        <SideBarRight />
      </div>
    </div>
  );
}
