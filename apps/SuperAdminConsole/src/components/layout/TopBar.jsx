import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-base-300 bg-base-100 px-6">
      <h1 className="text-xl font-semibold text-base-content">SignToowix Super Admin</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-base-content/60">{user?.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-base-300 px-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
