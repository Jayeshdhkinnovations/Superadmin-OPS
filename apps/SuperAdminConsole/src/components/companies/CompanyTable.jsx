import {
  Eye,
  Pencil,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Badge from "../ui/Badge";
import { SkeletonRow } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import { formatBytes, formatDate, getInitials } from "../../lib/format";

const STATUS_LABEL = {
  active: "Active",
  suspended: "Suspended",
  provisioning: "Provisioning",
  failed: "Failed",
};
const STATUS_ICON = {
  active: CheckCircle2,
  suspended: PauseCircle,
  provisioning: Clock,
  failed: XCircle,
};
const COLUMNS = 8;
const HEADERS = ["Company", "Admin Email", "Subdomain", "Users", "Storage", "Status", "Created", ""];

export default function CompanyTable({
  companies,
  isLoading,
  onView,
  onEditLimit,
  onToggleStatus,
  onDelete,
  onClearFilters,
}) {
  if (!isLoading && companies.length === 0) {
    return (
      <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <EmptyState
          title="No companies match your filters"
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-base-300 bg-base-100 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-base-300 bg-base-200/60">
            {HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className="px-3 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} columns={COLUMNS} />)
            : companies.map((c) => (
                <tr
                  key={c.objectId}
                  onClick={() => onView(c)}
                  className="cursor-pointer transition-colors hover:bg-base-200"
                >
                  <td className="min-w-52 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        {getInitials(c.companyName)}
                      </span>
                      <span className="truncate font-medium text-base-content">{c.companyName}</span>
                    </div>
                  </td>
                  <td className="max-w-48 truncate px-3 py-3 text-base-content/70">{c.adminEmail}</td>
                  <td className="px-3 py-3 font-mono text-xs text-base-content/60">{c.subdomain}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-base-content/70">
                    {c.currentUserCount} / {c.maxUsers}
                  </td>
                  <td className="px-3 py-3 text-base-content/70">{formatBytes(c.storageBytes)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={c.status} icon={STATUS_ICON[c.status]}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-base-content/70">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="py-3 pr-1 pl-3">
                    <div
                      className="flex items-center justify-end gap-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.status === "active" && (
                        <RowAction
                          label="Open company login"
                          icon={ExternalLink}
                          onClick={() =>
                            window.open(import.meta.env.VITE_OPENSIGN_PUBLIC_URL, "_blank")
                          }
                        />
                      )}
                      <RowAction label="View" icon={Eye} onClick={() => onView(c)} />
                      <RowAction label="Edit limit" icon={Pencil} onClick={() => onEditLimit(c)} />
                      <RowAction
                        label={c.status === "active" ? "Suspend" : "Reactivate"}
                        icon={c.status === "active" ? PauseCircle : PlayCircle}
                        onClick={() => onToggleStatus(c)}
                      />
                      <RowAction label="Delete" icon={Trash2} tone="error" onClick={() => onDelete(c)} />
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function RowAction({ label, icon: Icon, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-colors ${
        tone === "error"
          ? "text-base-content/60 hover:bg-error/15 hover:text-error"
          : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}
