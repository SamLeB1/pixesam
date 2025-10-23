import Canvas from "./components/Canvas";
import TopBar from "./components/TopBar";
import SideBarLeft from "./components/SideBarLeft";
import SideBarRight from "./components/SideBarRight";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-900">
      <TopBar />
      <div className="flex flex-grow">
        <SideBarLeft />
        <div className="flex flex-grow items-center justify-center">
          <Canvas gridSize={{ x: 16, y: 16 }} />
        </div>
        <SideBarRight />
      </div>
    </div>
  );
}
