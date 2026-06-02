import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function Login() {
  const { loginWithGoogle, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success("Successfully logged in!");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error("Failed to log in with Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Login | DailyNest</title>
      </Helmet>

      <div className="max-w-md w-full space-y-8 bg-[var(--color-surface)] p-10 rounded-[10px] shadow-2xl border border-[var(--color-divider)]">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-[var(--color-elevated)] border border-[var(--color-divider-strong)] text-[var(--color-primary)] flex items-center justify-center rounded-[10px] mb-6">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="mt-2 text-[24px] font-medium tracking-tight text-[var(--color-primary)]">
            Welcome to DailyNest
          </h2>
          <p className="mt-3 text-sm text-[var(--color-secondary)] font-medium tracking-wide flex items-center justify-center gap-1.5">
            <ShieldCheck size={16} /> Ensure an organized, productive day.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-[10px] border border-[var(--color-divider)] bg-[var(--color-elevated)] px-4 py-3 text-sm font-medium text-[var(--color-primary)] hover:border-[var(--color-divider-strong)] hover:bg-[var(--color-surface)] focus:outline-none transition-colors disabled:opacity-50"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
