import { Search, X } from "lucide-react";
import Input from "../ui/Input";

const LEVELS = [
  { value: "all", label: "All levels" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
];

export default function LogFilters({ filters, onChange, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.level}
        onChange={(e) => onChange({ level: e.target.value })}
        aria-label="Filter by level"
        className="h-10 rounded-xl border border-base-300 bg-base-100 px-3 text-sm text-base-content focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
      >
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
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

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base-content/40"
        />
        <Input
          value={filters.company}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Search company"
          className="w-48 pl-9"
          aria-label="Search by company"
        />
      </div>

      <div className="relative min-w-48 flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base-content/40"
        />
        <Input
          value={filters.message}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Search message"
          className="w-full pl-9"
          aria-label="Search by message"
        />
      </div>

      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
      >
        <X size={14} />
        Clear
      </button>
    </div>
  );
}
