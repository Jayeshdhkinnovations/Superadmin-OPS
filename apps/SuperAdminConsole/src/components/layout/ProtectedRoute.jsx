import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute() {
  const { isLoading, isSuperAdmin, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-base-300 border-t-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/access-denied" replace />;

  return <Outlet />;
}
