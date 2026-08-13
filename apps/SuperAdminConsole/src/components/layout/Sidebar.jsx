import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Building2, ClipboardList, UserCheck, Users } from "lucide-react";
import toowixLogo from "../../assets/toowix-logo-white.svg";

const NAV_ITEMS = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Approval", href: "/approval", icon: UserCheck },
  { label: "Logs", href: "/logs", icon: FileText },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Audit Log", href: "/audit", icon: ClipboardList },
  { label: "Sub-Admins", href: "/sub-admins", icon: Users },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col gap-8 bg-[#152219] py-6 transition-[width] duration-200 ${
        expanded ? "w-60 px-3" : "w-20 items-center px-0"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={expanded}
        title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="flex shrink-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80"
      >
        <img src={toowixLogo} alt="" className="h-9 w-9 object-contain shrink-0" />
        {expanded && (
          <span className="truncate text-sm font-semibold text-white">SignToowix Super Admin</span>
        )}
      </button>

      <nav className="flex flex-1 flex-col gap-2" aria-label="Primary">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            title={expanded ? undefined : label}
            aria-label={label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl transition-colors ${
                expanded ? "w-full px-3 py-2.5" : "h-11 w-11 justify-center"
              } ${
                isActive
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={20} strokeWidth={2} className="shrink-0" />
            {expanded && <span className="truncate text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
