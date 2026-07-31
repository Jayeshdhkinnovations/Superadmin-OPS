import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { superAdminService } from "../services/superadmin";
import { useDebounce } from "../hooks/useDebounce";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import CompanyFilters from "../components/companies/CompanyFilters";
import CompanyTable from "../components/companies/CompanyTable";
import DetailDrawer from "../components/companies/DetailDrawer";
import CreateCompanyModal from "../components/companies/CreateCompanyModal";
import EditLimitModal from "../components/companies/EditLimitModal";
import SuspendDialog from "../components/companies/SuspendDialog";
import DeleteDialog from "../components/companies/DeleteDialog";

export default function Companies() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const debouncedSearch = useDebounce(search, 400);

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editLimitTarget, setEditLimitTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryParams = { search: debouncedSearch, status };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["companies", queryParams],
    queryFn: () => superAdminService.getCompanies(queryParams),
    staleTime: 30_000,
  });

  function handleClearFilters() {
    setSearch("");
    setStatus("all");
  }

  function handleView(company) {
    setSelected(company);
    setDrawerOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-base-content">Companies</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Provision, monitor, and offboard every company on the platform.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Create Company
        </Button>
      </div>

      <CompanyFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />

      {isError ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <ErrorState message="Couldn't load companies." onRetry={refetch} />
        </div>
      ) : (
        <CompanyTable
          companies={data?.companies ?? []}
          isLoading={isLoading}
          onView={handleView}
          onEditLimit={setEditLimitTarget}
          onToggleStatus={setStatusTarget}
          onDelete={setDeleteTarget}
          onClearFilters={handleClearFilters}
        />
      )}

      <DetailDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} company={selected} />
      <CreateCompanyModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditLimitModal
        open={!!editLimitTarget}
        onClose={() => setEditLimitTarget(null)}
        company={editLimitTarget}
      />
      <SuspendDialog open={!!statusTarget} onClose={() => setStatusTarget(null)} company={statusTarget} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} company={deleteTarget} />
    </div>
  );
}
