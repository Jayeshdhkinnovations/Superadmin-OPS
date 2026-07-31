import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-error/20 text-error">
        <AlertTriangle size={22} />
      </div>
      <p className="max-w-sm text-sm text-base-content/70">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
