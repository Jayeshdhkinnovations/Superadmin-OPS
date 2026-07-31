import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import Badge from "../ui/Badge";
import { SkeletonRow } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import AuditDiffRow from "./AuditDiffRow";
import { formatDateTime } from "../../lib/format";

const COLUMNS = 6;
const ACTION_VARIANT = {
  "company.create": "active",
  "company.update_limit": "info",
  "company.suspend": "suspended",
  "company.reactivate": "active",
  "company.delete": "failed",
};

export default function AuditTable({ logs, isLoading, onClearFilters }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!isLoading && logs.length === 0) {
    return (
      <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <EmptyState
          title="No audit entries match your filters"
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
            <th scope="col" className="w-10 px-4 py-3" />
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Timestamp
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Actor
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Action
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Target Company
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Target ID
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} columns={COLUMNS} />)
            : logs.map((log) => {
                const isExpanded = expandedId === log.objectId;
                return (
                  <Fragment key={log.objectId}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.objectId)}
                      className="cursor-pointer transition-colors hover:bg-base-200"
                    >
                      <td className="px-4 py-3 text-base-content/40">
                        <ChevronRight
                          size={14}
                          className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-base-content/70">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-base-content/70">{log.actorEmail}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTION_VARIANT[log.action] || "neutral"}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-base-content/70">{log.targetCompany || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-base-content/50">{log.targetId}</td>
                    </tr>
                    {isExpanded && <AuditDiffRow log={log} columns={COLUMNS} />}
                  </Fragment>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
