import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OrbitVisual } from "@/components/orbit-visual";
import { LogoMark } from "@/routes/index";
import { GoogleIcon } from "@/routes/login";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { SpaceApiError } from "@/lib/api/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Space Today" }, { name: "description", content: "Create your Space Today account." }] }),
  component: Signup,
});

function strengthOf(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signup, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const s = useMemo(() => strengthOf(pw), [pw]);
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  const colors = ["bg-border", "bg-destructive", "bg-warning", "bg-info", "bg-success"];

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isLoading, navigate]);

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
    setFieldErrors({});

    if (pw !== confirm) {
      setFieldErrors({ confirm: "Passwords do not match" });
      return;
    }
    if (s < 2) {
      setFieldErrors({ password: "Password is too weak. Add uppercase letters and numbers." });
      return;
    }

    setLoading(true);
    try {
      await signup({ name, email, password: pw });
      setDone(true);
      toast.success("Welcome aboard, Commander.");
      setTimeout(() => navigate({ to: "/dashboard" }), 900);
    } catch (err) {
      if (err instanceof SpaceApiError) {
        if (err.status === 409) {
          setFieldErrors({ email: "An account with this email already exists." });
        } else if (err.status === 422) {
          setError("Please check your inputs and try again.");
        } else {
          setError(err.message || "Failed to create account.");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome aboard, Commander.");
      navigate({ to: "/dashboard" });
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
      <div className="flex flex-col px-6 py-10 sm:px-10 order-2 lg:order-1">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark /><span className="font-display text-sm font-semibold tracking-[0.18em]">SPACE TODAY</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="m-auto w-full max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Onboarding · Step 1 / 1</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Create your mission</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join thousands tracking the cosmos in real time.</p>

          {done ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="mt-3 font-display text-lg font-semibold">Account created</p>
              <p className="mt-1 text-sm text-muted-foreground">Redirecting to mission control…</p>
            </motion.div>
          ) : (
            <form id="signup-form" className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} disabled={loading} />
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i < s ? colors[s] : "bg-border"}`} />
                  ))}
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{labels[s]}</p>
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
                {fieldErrors.confirm && <p className="text-xs text-destructive">{fieldErrors.confirm}</p>}
              </div>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox className="mt-0.5" required /> <span>I agree to the <a className="text-foreground hover:underline" href="#">Terms</a> and <a className="text-foreground hover:underline" href="#">Privacy Policy</a>.</span>
              </label>
              <Button id="signup-submit" type="submit" className="h-11 w-full" disabled={loading || googleLoading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account</> : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
              <Button type="button" variant="outline" className="h-11 w-full" onClick={handleGoogleSignup} disabled={loading || googleLoading}>
                {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                {googleLoading ? "Connecting…" : "Sign up with Google"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:order-2 lg:block">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div className="relative flex h-full items-center justify-center p-10">
          <OrbitVisual className="max-w-[520px]" />
        </div>
      </div>
    </div>
  );
}
