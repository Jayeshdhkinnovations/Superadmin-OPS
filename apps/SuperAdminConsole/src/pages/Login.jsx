import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { USE_MOCKS } from "../services/parseClient";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from || "/overview";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-content">
            OS
          </div>
          <span className="text-sm font-semibold text-base-content">OpenSign Super Admin</span>
        </div>

        <h1 className="text-xl font-semibold text-base-content">Sign in to the console</h1>
        <p className="mt-1.5 text-sm text-base-content/60">
          Platform operator access only. Accounts are provisioned directly, not self-served.
        </p>

        {USE_MOCKS && (
          <p className="mt-4 rounded-xl bg-info/20 px-3 py-2 text-xs text-info">
            Preview mode — any email and password will sign you in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbrand.com"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
