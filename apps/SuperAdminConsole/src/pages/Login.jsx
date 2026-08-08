import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { USE_MOCKS } from "../services/parseClient";
import ConsoleIllustration from "../components/ConsoleIllustration";

// Deliberately not the shared Field/Input/Button primitives used elsewhere in
// the console: this page is styled to match the OpenSign sign-in screen
// (fixed navy, pill inputs) rather than the daisyUI admin theme, so the two
// products read as one platform at the front door. Everything past the login
// wall goes back to the console's own design system.
const NAVY = "#0B3D73";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [compact, setCompact] = useState(false);

  // The hero panel is hidden rather than stacked on narrow screens - stacking
  // pushed the actual form below the fold on a phone.
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth <= 860);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const inputClass =
    "w-full rounded-full border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:border-[#0B3D73] focus:ring-2 focus:ring-[#0B3D73]/15 focus:outline-none transition-colors px-5 py-3 text-[15px]";

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#F7F8FC] p-4 font-['Poppins',system-ui,sans-serif] sm:p-8">
      {/* Scoped here rather than in the global stylesheet - these two
          animations exist only for this screen. */}
      <style>{`
        @keyframes sa-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes sa-blob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6px,-10px) scale(1.08); } }
        .sa-item { animation: sa-rise .5s cubic-bezier(.22,.61,.36,1) both; }
        .sa-blob { animation: sa-blob 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sa-item, .sa-blob { animation: none !important; }
        }
      `}</style>

      {/* m-auto rather than the parent's items-center: auto margins centre
          the card but collapse to 0 once it is taller than the viewport, so
          a short mobile screen scrolls to the top of the card instead of
          clipping it. */}
      <div className="relative m-auto flex w-full max-w-5xl overflow-hidden rounded-[26px] bg-white shadow-[0_40px_80px_-30px_rgba(70,60,160,0.28)]">
        {/* Left hero panel */}
        {!compact && (
          <div className="relative hidden w-[44%] shrink-0 flex-col overflow-hidden rounded-l-[26px] bg-gradient-to-br from-[#0B3D73] to-[#002864] px-8 py-[34px] md:flex">
            <div className="relative z-20">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-md">
                  <ShieldCheck size={20} color={NAVY} />
                </div>
                <div>
                  <span className="block text-lg font-bold leading-none tracking-tight text-white">
                    Sign Toowix
                  </span>
                  <span className="mt-1 block text-[10px] font-medium text-white/80">
                    Super Admin Console
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-20 mt-10 -ml-4">
              <h2 className="text-xl font-bold leading-snug text-white lg:text-2xl">
                Every Workspace, Under One Console.
              </h2>
              <p className="mt-3 text-sm text-white/90">
                Provision companies, approve registrations and monitor usage
                across the entire platform from a single operator view.
              </p>
            </div>

            <div className="relative z-20 mx-auto mt-auto w-full max-w-[290px]">
              <span className="sa-blob absolute -left-6 top-6 h-20 w-20 rounded-full bg-white/20 blur-xl" />
              <span className="sa-blob absolute -right-4 bottom-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <ConsoleIllustration className="relative z-[1] w-full drop-shadow-xl" />
            </div>
          </div>
        )}

        {/* Right form panel - the negative margin plus the large left corner
            radius makes the seam between the two panels read as one
            continuous curve instead of a straight edge. */}
        <div className="relative z-20 flex w-full flex-col bg-white px-6 py-10 sm:px-10 md:-ml-[30px] md:w-[56%] md:rounded-[34px_16px_16px_34px] md:px-[46px] md:py-[38px]">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-4">
            {compact && (
              <div className="mb-8 flex items-center gap-2.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B3D73] shadow-md">
                  <ShieldCheck size={20} color="#FFFFFF" />
                </div>
                <div>
                  <span className="block text-lg font-bold leading-none tracking-tight text-gray-800">
                    Sign Toowix
                  </span>
                  <span className="mt-1 block text-[10px] font-medium text-gray-500">
                    Super Admin Console
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <h1
                className="sa-item text-2xl font-bold tracking-tight text-gray-800"
                style={{ animationDelay: "0ms" }}
              >
                Sign in to the console
              </h1>
              <p
                className="sa-item mt-1 text-xs font-medium text-gray-400"
                style={{ animationDelay: "40ms" }}
              >
                Platform operator access only. Accounts are provisioned
                directly, not self-served.
              </p>

              {USE_MOCKS && (
                <p className="sa-item mt-4 rounded-xl bg-[#EAF1FF] px-3 py-2 text-xs text-[#0B3D73]">
                  Preview mode — any email and password will sign you in.
                </p>
              )}

              <div className="sa-item mt-8" style={{ animationDelay: "90ms" }}>
                <label className="sr-only" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={inputClass}
                />
              </div>

              <div className="sa-item mt-4" style={{ animationDelay: "130ms" }}>
                <label className="sr-only" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="sa-item mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B4F91] to-[#0B3D73] px-6 py-[15px] text-[15px] font-bold text-white transition-opacity duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0B3D73] focus:ring-offset-2 disabled:opacity-70"
                style={{ animationDelay: "170ms" }}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
