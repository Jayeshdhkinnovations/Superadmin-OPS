import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function ErrorCard({ count = 0 }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-base-content/60 uppercase">Errors (24h)</p>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-error/20 text-error">
          <AlertTriangle size={17} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-base-content">{count}</p>
      <Link
        to="/logs?level=error"
        className="inline-flex w-fit text-xs font-medium text-primary hover:underline"
      >
        View logs →
      </Link>
    </div>
  );
}
