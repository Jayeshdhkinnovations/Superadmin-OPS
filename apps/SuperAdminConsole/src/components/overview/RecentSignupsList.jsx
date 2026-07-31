import { formatDate, getInitials } from "../../lib/format";
import EmptyState from "../ui/EmptyState";

export default function RecentSignupsList({ signups = [] }) {
  if (signups.length === 0) {
    return <EmptyState title="No signups yet" description="New companies will show up here." />;
  }

  return (
    <div className="divide-y divide-base-300">
      {signups.map((s) => (
        <div key={s.objectId} className="flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              {getInitials(s.companyName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-base-content">{s.companyName}</p>
              <p className="truncate text-xs text-base-content/60">{s.adminEmail}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-right">
            <span className="text-xs text-base-content/60">Max {s.maxUsers}</span>
            <span className="text-xs text-base-content/50">{formatDate(s.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
