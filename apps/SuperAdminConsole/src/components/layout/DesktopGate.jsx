import { MonitorSmartphone } from "lucide-react";
import { useDesktopOnly } from "../../hooks/useDesktopOnly";

export default function DesktopGate({ children }) {
  const isDesktop = useDesktopOnly();

  if (!isDesktop) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base-200 px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-lg">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/20 text-primary">
            <MonitorSmartphone size={26} />
          </div>
          <div>
            <p className="text-base font-semibold text-base-content">Desktop only</p>
            <p className="mt-1 max-w-xs text-sm text-base-content/60">
              The Super Admin console is only available on desktop. Please switch to a screen at
              least 1024px wide.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
