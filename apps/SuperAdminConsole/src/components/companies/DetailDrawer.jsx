import { X, CheckCircle2, PauseCircle, Clock, XCircle } from "lucide-react";
import Badge from "../ui/Badge";
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

export default function DetailDrawer({ open, onClose, company }) {
  if (!open || !company) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-neutral-900/40 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md animate-scale-in flex-col overflow-y-auto bg-base-100 shadow-lg">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {getInitials(company.companyName)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-base-content">
                {company.companyName}
              </h2>
              <p className="mt-0.5 truncate text-sm text-base-content/60">{company.adminEmail}</p>
              <p className="mt-1 text-xs text-base-content/50">Subdomain: {company.subdomain}</p>
              <p className="mt-0.5 text-xs text-base-content/50">
                Created: {formatDate(company.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-base-content/50 uppercase">
              Usage
            </h3>
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-base-content/50">Users</dt>
                <dd className="mt-1 text-sm font-medium text-base-content">
                  {company.currentUserCount} / {company.maxUsers}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-base-content/50">Documents</dt>
                <dd className="mt-1 text-sm font-medium text-base-content">{company.documentCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-base-content/50">Storage</dt>
                <dd className="mt-1 text-sm font-medium text-base-content">
                  {formatBytes(company.storageBytes)}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-base-content/50 uppercase">
              Instance
            </h3>
            <dl className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-base-content/60">Database</dt>
                <dd className="font-mono text-xs text-base-content">{company.databaseName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-base-content/60">Container</dt>
                <dd className="font-mono text-xs text-base-content">{company.containerId}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-base-content/60">Status</dt>
                <dd>
                  <Badge variant={company.status} icon={STATUS_ICON[company.status]}>
                    {STATUS_LABEL[company.status] ?? company.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </aside>
    </div>
  );
}
