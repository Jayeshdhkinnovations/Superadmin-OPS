import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  title = "No results",
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-base-200 text-base-content/40">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-base-content">{title}</p>
        {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
      </div>
      {actionLabel && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
