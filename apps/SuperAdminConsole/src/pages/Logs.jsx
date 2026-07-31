import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { superAdminService } from "../services/superadmin";
import { useDebounce } from "../hooks/useDebounce";
import LogFilters from "../components/logs/LogFilters";
import LogTable from "../components/logs/LogTable";
import ErrorState from "../components/ui/ErrorState";

const INITIAL_FILTERS = { level: "all", from: "", to: "", company: "", message: "" };

export default function Logs() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedCompany = useDebounce(filters.company, 400);
  const debouncedMessage = useDebounce(filters.message, 400);

  const queryParams = { ...filters, company: debouncedCompany, message: debouncedMessage };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["logs", queryParams],
    queryFn: () => superAdminService.getLogs(queryParams),
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
        <h2 className="text-xl font-semibold text-base-content">System Logs</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Platform and provisioning logs. Entries are purged after 30 days.
        </p>
      </div>

      <LogFilters filters={filters} onChange={handleChange} onClear={handleClear} />

      {isError ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <ErrorState message="Couldn't load logs." onRetry={refetch} />
        </div>
      ) : (
        <LogTable logs={data?.logs ?? []} isLoading={isLoading} onClearFilters={handleClear} />
      )}
    </div>
  );
}
