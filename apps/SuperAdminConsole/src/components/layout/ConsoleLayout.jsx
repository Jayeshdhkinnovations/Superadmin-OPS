import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import DesktopGate from "./DesktopGate";
import Toaster from "../ui/Toaster";

export default function ConsoleLayout() {
  return (
    <DesktopGate>
      <div className="flex h-screen w-screen bg-base-100">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-base-200/50 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </DesktopGate>
  );
}
