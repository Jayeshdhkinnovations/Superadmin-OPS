import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-neutral-900/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${SIZES[size]} animate-scale-in rounded-3xl bg-base-100 shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-base-content">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-base-300 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
