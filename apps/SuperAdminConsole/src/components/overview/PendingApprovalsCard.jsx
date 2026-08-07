import { Link } from "react-router-dom";
import { UserCheck } from "lucide-react";
import { formatDate } from "../../lib/format";

// Surfaces registration requests waiting on a Super Admin. They previously
// only existed on the Approval page, so a request could sit unseen unless
// someone happened to open it.
export default function PendingApprovalsCard({ requests = [], isLoading }) {
  const count = requests.length;

  return (
    <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-base-content">Approval Requests</h3>
          <p className="mt-0.5 text-xs text-base-content/60">
            {count > 0
              ? `${count} waiting for your approval`
              : "Nothing waiting for approval"}
          </p>
        </div>
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            count > 0 ? "bg-warning/20 text-warning" : "bg-base-300 text-base-content/50"
          }`}
        >
          <UserCheck size={17} />
        </div>
      </div>

      {isLoading ? (
        <p className="py-3 text-sm text-base-content/50">Loading…</p>
      ) : count === 0 ? (
        <p className="py-3 text-sm text-base-content/50">
          New registrations will appear here.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-base-300">
          {requests.slice(0, 5).map((req) => (
            <li key={req.objectId} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-base-content">
                  {req.companyName || "—"}
                </p>
                <p className="truncate text-xs text-base-content/60">
                  {req.name} · {req.email}
                </p>
                <p className="mt-0.5 text-[11px] text-base-content/45">
                  {req.jobTitle ? `${req.jobTitle} · ` : ""}
                  {req.maxUsers ?? 5} seats · {formatDate(req.createdAt)}
                </p>
              </div>
              <Link
                to="/approval"
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content hover:opacity-90"
              >
                Review
              </Link>
            </li>
          ))}
        </ul>
      )}

      {count > 5 && (
        <Link to="/approval" className="mt-3 inline-flex text-xs font-medium text-primary hover:underline">
          View all {count} requests →
        </Link>
      )}
    </div>
  );
}
