import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { superAdminService } from "../services/superadmin";
import { useDebounce } from "../hooks/useDebounce";
import AuditFilters from "../components/audit/AuditFilters";
import AuditTable from "../components/audit/AuditTable";
import ErrorState from "../components/ui/ErrorState";

const INITIAL_FILTERS = { actor: "", action: "all", from: "", to: "" };

export default function AuditLog() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedActor = useDebounce(filters.actor, 400);

  const queryParams = { ...filters, actor: debouncedActor };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["auditLogs", queryParams],
    queryFn: () => superAdminService.getAuditLogs(queryParams),
    staleTime: 30_000,
  });

  function handleChange(patch) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  function handleClear() {
    setFilters(INITIAL_FILTERS);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-base-content">Audit Log</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Read-only, append-only history of every Super Admin action.
        </p>
      </div>

      <AuditFilters filters={filters} onChange={handleChange} />

      {isError ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <ErrorState message="Couldn't load audit logs." onRetry={refetch} />
        </div>
      ) : (
        <AuditTable logs={data?.logs ?? []} isLoading={isLoading} onClearFilters={handleClear} />
      )}
    </div>
  );
}
