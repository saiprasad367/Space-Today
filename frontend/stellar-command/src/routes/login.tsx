import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OrbitVisual } from "@/components/orbit-visual";
import { LogoMark } from "@/routes/index";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { SpaceApiError } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Space Today" }, { name: "description", content: "Sign in to your Space Today mission control." }] }),
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/dashboard" }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("demo@spacetoday.app");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const { redirect } = Route.useSearch();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: redirect || "/dashboard" });
    }
  }, [isAuthenticated, isLoading, navigate, redirect]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Restoring session…</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      toast.success("Authenticated. Welcome back, Commander.");
      navigate({ to: redirect || "/dashboard" });
    } catch (err) {
      if (err instanceof SpaceApiError) {
        if (err.status === 401) {
          setError("Email or password is incorrect.");
        } else if (err.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (err.status === 422) {
          setError("Please enter a valid email and password.");
        } else {
          setError(err.message || "Sign in failed. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google. Welcome, Commander.");
      navigate({ to: redirect || "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      if (!msg.includes("cancelled")) {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:block">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div className="relative flex h-full flex-col p-10">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-[0.18em]">SPACE TODAY</span>
          </Link>
          <div className="my-auto">
            <OrbitVisual className="mx-auto max-w-[520px]" />
          </div>
          <blockquote className="max-w-md">
            <p className="font-display text-xl leading-snug">
              "The cosmos is within us. We are made of star-stuff."
            </p>
            <footer className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              — Carl Sagan
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col px-6 py-10 sm:px-10">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2"><LogoMark /><span className="font-display text-sm font-semibold tracking-[0.18em]">SPACE TODAY</span></Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="m-auto w-full max-w-sm"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Mission control</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue exploring.</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form id="login-form" className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="commander@nasa.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
              </div>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox defaultChecked /> Remember me for 30 days
            </label>
            <Button id="login-submit" type="submit" className="h-11 w-full" disabled={loading || googleLoading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating</> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2">
            <Button
              id="google-login-btn"
              variant="outline"
              className="h-11"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              {googleLoading ? "Connecting to Google…" : "Continue with Google"}
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account? <Link to="/signup" className="font-medium text-foreground hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
