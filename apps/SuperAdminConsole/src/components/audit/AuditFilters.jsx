import Input from "../ui/Input";

const ACTIONS = [
  { value: "all", label: "All actions" },
  { value: "company.create", label: "Company created" },
  { value: "company.update_limit", label: "Limit updated" },
  { value: "company.suspend", label: "Company suspended" },
  { value: "company.reactivate", label: "Company reactivated" },
  { value: "company.delete", label: "Company deleted" },
];

export default function AuditFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={filters.actor}
        onChange={(e) => onChange({ actor: e.target.value })}
        placeholder="Filter by actor email"
        className="w-56"
        aria-label="Filter by actor"
      />
      <select
        value={filters.action}
        onChange={(e) => onChange({ action: e.target.value })}
        aria-label="Filter by action"
        className="h-10 rounded-xl border border-base-300 bg-base-100 px-3 text-sm text-base-content focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
      >
        {ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
      <Input
        type="date"
        value={filters.from}
        onChange={(e) => onChange({ from: e.target.value })}
        className="w-40"
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.to}
        onChange={(e) => onChange({ to: e.target.value })}
        className="w-40"
        aria-label="To date"
      />
    </div>
  );
}
