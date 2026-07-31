import { useCallback, useEffect } from "react";
import Parse, { USE_MOCKS } from "../services/parseClient";
import { superAdminService } from "../services/superadmin";
import { useAuthStore } from "../store/authStore";

const MOCK_SESSION_KEY = "sa_mock_session";

export function useAuth() {
  const { user, isSuperAdmin, isLoading, setUser, clear } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const hasSession = USE_MOCKS
        ? localStorage.getItem(MOCK_SESSION_KEY) === "true"
        : !!Parse.User.current();

      if (!hasSession) {
        if (!cancelled) clear();
        return;
      }
      try {
        const me = await superAdminService.getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) clear();
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clear, setUser]);

  const login = useCallback(
    async (email, password) => {
      await superAdminService.login(email, password);
      if (USE_MOCKS) localStorage.setItem(MOCK_SESSION_KEY, "true");
      const me = await superAdminService.getMe();
      setUser(me);
      return me;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    try {
      await superAdminService.logout();
    } finally {
      if (USE_MOCKS) localStorage.removeItem(MOCK_SESSION_KEY);
      clear();
    }
  }, [clear]);

  return { user, isSuperAdmin, isLoading, login, logout };
}
