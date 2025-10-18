import Canvas from "./components/Canvas";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <Canvas gridSize={{ x: 16, y: 16 }} />
    </div>
  );
}
