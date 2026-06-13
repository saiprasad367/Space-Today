import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Telescope,
  Orbit,
  Mountain,
  Activity,
  ShieldCheck,
  Database,
  Star,
  Layers,
  Smartphone,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitVisual } from "@/components/orbit-visual";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Space Today — Real-Time Space Intelligence" },
      { name: "description", content: "Access NASA imagery, asteroid tracking, Mars exploration data, and global natural event monitoring through a single intelligent dashboard." },
      { property: "og:title", content: "Space Today" },
      { property: "og:description", content: "Real-time space intelligence, unified." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Telescope, title: "Astronomy Picture of the Day", desc: "Daily curated NASA imagery with rich scientific context and shareable cards." },
  { icon: Orbit, title: "Near-Earth Object Tracking", desc: "Live asteroid telemetry with hazard scoring, velocity, distance and approach windows." },
  { icon: Mountain, title: "Mars Rover Exploration", desc: "Browse every photo from Curiosity & Perseverance with camera and sol filters." },
  { icon: Activity, title: "Global Natural Events", desc: "Wildfires, storms, volcanoes — monitor Earth from orbit, in real time." },
];

const why = [
  { icon: Database, title: "Official NASA APIs", desc: "Direct, attributed feeds — APOD, NeoWs, Mars Rover, EONET." },
  { icon: ShieldCheck, title: "Secure backend", desc: "Authenticated sessions, encrypted at rest, RLS on every query." },
  { icon: Layers, title: "Smart caching", desc: "Edge caches keep responses sub-100ms, even at peak load." },
  { icon: Star, title: "Personal favorites", desc: "Save and organize photos, asteroids and events across devices." },
  { icon: Smartphone, title: "Responsive everywhere", desc: "Desktop mission control, laptop, tablet and a true mobile experience." },
];

function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-[0.18em]">SPACE TODAY</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#why" className="hover:text-foreground">Why Space Today</a>
            <a href="#mission" className="hover:text-foreground">Mission</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/login">Get started <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-60" aria-hidden />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="status-dot" style={{ backgroundColor: "var(--success)", color: "var(--success)" }} />
              Live NASA telemetry
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-[64px]">
              Explore the universe through{" "}
              <span className="text-primary">real-time space intelligence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Access NASA imagery, asteroid tracking, Mars exploration data, and global natural-event monitoring through a single intelligent dashboard — built for scientists, students and curious minds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-sm">
                <Link to="/login">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm">
                <Link to="/dashboard">Explore demo</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { k: "API uptime", v: "99.99%" },
                { k: "Data sources", v: "4 NASA APIs" },
                { k: "Refresh", v: "<60s" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.k}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold tabular">{s.v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto aspect-square w-full max-w-[560px] rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.15)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">ORBITAL MAP / LEO</span>
                <span className="font-mono text-[11px] text-muted-foreground">12.06.2026 · 14:22 UTC</span>
              </div>
              <OrbitVisual />
              <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>27 NEOs tracked</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="status-dot" style={{ backgroundColor: "var(--primary)", color: "var(--primary)" }} />
                  Streaming
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Logo ticker */}
        <div className="relative border-t border-border/70 bg-surface/60 py-6">
          <div className="mx-auto max-w-7xl overflow-hidden px-6">
            <div className="flex animate-ticker gap-12 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {[..."NASA · JPL · ESA · SpaceX · ESO · JAXA · CSA · Roscosmos · NOAA · ISRO · NASA · JPL · ESA · SpaceX · ESO · JAXA".split(" · ")].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border/70 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Capabilities</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Four NASA datasets. One unified surface.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built with the same rigor as enterprise observability tools, tuned for the cosmos.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative bg-card p-8 transition hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-b border-border/70 bg-surface py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Why Space Today</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Built like enterprise software. Priced for explorers.
            </h2>
          </div>
          <ol className="relative space-y-8 border-l border-border pl-8">
            {why.map((w, i) => (
              <motion.li
                key={w.title}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-[42px] grid h-8 w-8 place-items-center rounded-full border border-border bg-background">
                  <w.icon className="h-4 w-4 text-primary" />
                </span>
                <h3 className="font-display text-lg font-semibold">{w.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section id="mission" className="border-b border-border/70 py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Mission</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Humanity's window into the universe — in one tab.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Whether you're tracking a rover, monitoring a wildfire, or just looking up — Space Today gives you a clear, fast, beautiful view of what's happening beyond our world.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6"><Link to="/signup">Create your account</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6"><Link to="/dashboard">Open dashboard</Link></Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="font-display text-sm font-semibold tracking-[0.18em]">SPACE TODAY</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Real-time space intelligence powered by official NASA open data APIs.
            </p>
          </div>
          {[
            { h: "Product", l: ["Dashboard", "APOD", "Asteroids", "Mars"] },
            { h: "Company", l: ["About", "Changelog", "Press", "Contact"] },
            { h: "Resources", l: ["Docs", "API status", "Privacy", "Terms"] },
          ].map((c) => (
            <div key={c.h}>
              <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{c.h}</h4>
              <ul className="mt-4 space-y-2 text-sm">
                {c.l.map((i) => <li key={i}><a className="text-foreground/80 hover:text-foreground" href="#">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-border px-6 pt-6 text-xs text-muted-foreground">
          <span>© 2026 Space Today. Data courtesy of NASA Open APIs.</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export function LogoMark() {
  return (
    <span className="relative inline-grid h-7 w-7 place-items-center rounded-md border border-border bg-background">
      <span className="absolute h-4 w-4 rounded-full border border-foreground/40" />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="absolute h-5 w-[1px] rotate-45 bg-foreground/20" />
    </span>
  );
}
