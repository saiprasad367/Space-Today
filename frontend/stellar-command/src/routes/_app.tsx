import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Telescope,
  Orbit,
  Mountain,
  Activity,
  Star,
  UserRound,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Menu,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoMark } from "@/routes/index";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/apod", label: "APOD", icon: Telescope },
  { to: "/asteroids", label: "Asteroids", icon: Orbit },
  { to: "/mars", label: "Mars Photos", icon: Mountain },
  { to: "/earth-events", label: "Earth Events", icon: Activity },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const mobileNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/apod", label: "APOD", icon: Telescope },
  { to: "/mars", label: "Mars", icon: Mountain },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/profile", label: "Profile", icon: UserRound },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate({ to: "/login" });
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <LogoMark />
        <span className="font-display text-sm font-semibold tracking-[0.18em]">SPACE TODAY</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Workspace</p>
        {nav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-surface font-medium text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span layoutId="nav-active" className="absolute left-0 h-5 w-[2px] rounded-r bg-primary" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link to="/profile" className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user ? getInitials(user.name) : "??"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? "Loading…"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-50"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = nav.find((n) => n.to === pathname);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
        <span className="font-mono uppercase tracking-[0.18em]">Workspace</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{current?.label ?? "Page"}</span>
      </div>
      <div className="relative ml-auto hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 rounded-lg border-border bg-surface pl-9 placeholder:text-muted-foreground" placeholder="Search asteroids, photos, events…" />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">⌘K</kbd>
      </div>
      <Button variant="outline" size="icon" className="ml-auto md:ml-0 relative" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
      </Button>
      <Avatar className="h-9 w-9 ring-1 ring-border">
        <AvatarFallback>{user ? getInitials(user.name) : "??"}</AvatarFallback>
      </Avatar>
    </header>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

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

  if (!isAuthenticated) {
    // Preserve the intended destination for redirect-after-login
    const currentPath = window.location.pathname;
    navigate({ to: "/login", search: { redirect: currentPath } });
    return null;
  }

  return <>{children}</>;
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-background">
        <div className="flex">
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-card md:block">
            <SidebarBody pathname={pathname} />
          </aside>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="hidden" />
            <SheetContent side="left" className="w-72 p-0">
              <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onMenu={() => setOpen(true)} />
            <div className="flex-1 pb-24 md:pb-0">
              <Outlet />
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur md:hidden">
          {mobileNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </AuthGuard>
  );
}
