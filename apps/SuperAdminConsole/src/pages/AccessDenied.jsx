import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";

export default function AccessDenied() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleBackToLogin() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-base-200 px-8">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-lg">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-error/20 text-error">
          <ShieldOff size={26} />
        </div>
        <div>
          <p className="text-lg font-semibold text-base-content">Access denied</p>
          <p className="mt-1 max-w-sm text-sm text-base-content/60">
            Your account does not have Super Admin access. Contact a platform operator if you believe
            this is a mistake.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBackToLogin}>
          Back to login
        </Button>
      </div>
    </div>
  );
}
