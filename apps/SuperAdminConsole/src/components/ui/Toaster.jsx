import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = { success: "text-success", error: "text-error", info: "text-info" };

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-100 flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            role="status"
            className="animate-scale-in flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg"
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${COLORS[t.type]}`} />
            <p className="flex-1 text-sm text-base-content">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-m-3 grid h-11 w-11 shrink-0 place-items-center rounded-full text-base-content/40 transition-colors hover:text-base-content"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
