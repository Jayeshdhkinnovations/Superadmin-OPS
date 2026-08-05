import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import Badge from "../ui/Badge";
import { SkeletonRow } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import LogDetailRow from "./LogDetailRow";
import { formatDateTime } from "../../lib/format";

const COLUMNS = 7;
const LEVEL_VARIANT = { info: "info", warn: "warn", error: "error" };

export default function LogTable({ logs, isLoading, onClearFilters }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!isLoading && logs.length === 0) {
    return (
      <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <EmptyState
          title="No log entries match your filters"
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
              Level
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Company
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Route
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
            >
              Message
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} columns={COLUMNS} />)
            : logs.map((log) => {
                const isExpanded = expandedId === log.objectId;
                const statusLabel = log.errorCode ?? (log.level === "error" ? "Error" : "OK");
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
                      <td className="px-4 py-3">
                        <Badge variant={LEVEL_VARIANT[log.level]}>{log.level}</Badge>
                      </td>
                      <td className="px-4 py-3 text-base-content/70">{log.companyName || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-base-content/60">
                        {log.route || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.level === "error" ? "error" : "info"}>{statusLabel}</Badge>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-base-content/70">{log.message}</td>
                    </tr>
                    {isExpanded && <LogDetailRow log={log} columns={COLUMNS} />}
                  </Fragment>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
