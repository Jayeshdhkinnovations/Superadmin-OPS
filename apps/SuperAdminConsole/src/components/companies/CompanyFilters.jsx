import { Search } from "lucide-react";
import Input from "../ui/Input";

export default function CompanyFilters({ search, onSearchChange, status, onStatusChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-64 flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base-content/40"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search company or admin email"
          className="w-full pl-9"
          aria-label="Search companies"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        className="h-10 rounded-xl border border-base-300 bg-base-100 px-3 text-sm text-base-content focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
  );
}
