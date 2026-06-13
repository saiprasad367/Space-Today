import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Telescope,
  Orbit,
  Mountain,
  Activity,
  Star,
  Share2,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountUp, FadeIn, SectionHeader } from "@/components/ui-bits";
import { useDashboard, isSectionError } from "@/hooks/use-dashboard";
import { useAddFavorite } from "@/hooks/use-favorites";
import { useAuth } from "@/contexts/auth-context";
import type { ApodData, Asteroid, MarsPhoto, EarthEvent } from "@/lib/api/space";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Space Today" }] }),
  component: Dashboard,
});

const iconFor = (i: number) => [Telescope, Orbit, Mountain, Activity][i] ?? Telescope;
const toneClasses = (t: string) =>
  ({
    primary: "text-primary bg-primary/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
    success: "text-success bg-success/10",
  }[t] || "text-primary bg-primary/10");

function SectionError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-border" />
        <div className="h-5 w-16 rounded bg-border" />
      </div>
      <div className="mt-5 h-3 w-24 rounded bg-border" />
      <div className="mt-2 h-8 w-16 rounded bg-border" />
    </div>
  );
}

function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const { user } = useAuth();
  const addFavorite = useAddFavorite();

  const today = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "Commander";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load dashboard. Please try again.</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const apod = data?.apod;
  const asteroids = data?.asteroids;
  const marsPhotos = data?.mars_photos;
  const earthEvents = data?.earth_events;

  // Compute stats from real data
  const stats = [
    {
      label: "APOD Available",
      value: apod && !isSectionError(apod) ? 1 : 0,
      delta: apod && !isSectionError(apod) ? "Updated" : "Unavailable",
      tone: "primary" as const,
    },
    {
      label: "Asteroids Today",
      value: asteroids && !isSectionError(asteroids) ? (asteroids as Asteroid[]).length : 0,
      delta: asteroids && !isSectionError(asteroids)
        ? `${(asteroids as Asteroid[]).filter((a) => a.is_potentially_hazardous).length} hazardous`
        : "Unavailable",
      tone: "warning" as const,
    },
    {
      label: "Mars Photos",
      value: marsPhotos && !isSectionError(marsPhotos) ? (marsPhotos as MarsPhoto[]).length : 0,
      delta: "Latest sol",
      tone: "info" as const,
    },
    {
      label: "Earth Events",
      value: earthEvents && !isSectionError(earthEvents) ? (earthEvents as EarthEvent[]).length : 0,
      delta: "Live",
      tone: "success" as const,
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Welcome */}
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Mission control · {today}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">All NASA telemetry streams are nominal.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
            <span className="status-dot" style={{ backgroundColor: "var(--success)", color: "var(--success)" }} />
            <div className="text-xs">
              <div className="font-medium">All systems nominal</div>
              <div className="font-mono uppercase tracking-[0.18em] text-muted-foreground">APOD · NeoWs · Mars · EONET</div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((s, i) => {
              const Icon = iconFor(i);
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/20"
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneClasses(s.tone)}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">{s.delta}</Badge>
                  </div>
                  <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
                    <CountUp value={s.value} />
                  </p>
                </motion.div>
              );
            })}
      </div>

      {/* APOD Hero */}
      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn delay={0.05}>
          <div className="group relative overflow-hidden rounded-3xl border border-border bg-card lg:col-span-2">
            {isLoading ? (
              <div className="animate-pulse aspect-[16/9] bg-surface" />
            ) : isSectionError(apod) ? (
              <div className="aspect-[16/9] flex items-center justify-center bg-surface">
                <SectionError message={apod.error} />
              </div>
            ) : apod ? (
              <>
                <img
                  src={(apod as ApodData).url}
                  alt={(apod as ApodData).title}
                  className="aspect-[16/9] w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute left-5 top-5 flex items-center gap-2">
                  <Badge className="border-transparent bg-background/90 text-foreground">APOD · Today</Badge>
                </div>
                <div className="p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {(apod as ApodData).date} · {(apod as ApodData).copyright}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{(apod as ApodData).title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{(apod as ApodData).explanation}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button asChild><Link to="/apod">Open full view <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
                    <Button
                      variant="outline"
                      onClick={() => addFavorite.mutate({ item_type: "apod", item_payload: apod as Record<string, unknown> })}
                      disabled={addFavorite.isPending}
                    >
                      <Star className="mr-2 h-4 w-4" /> {addFavorite.isPending ? "Saving…" : "Save favorite"}
                    </Button>
                    <Button variant="ghost"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-5">
            <SectionHeader eyebrow="Near-Earth Objects" title="Asteroid summary" />
            {isLoading ? (
              <div className="flex-1 animate-pulse space-y-3 mt-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-6 rounded bg-border" />)}
              </div>
            ) : isSectionError(asteroids) ? (
              <SectionError message={asteroids.error} />
            ) : asteroids ? (
              <div className="mt-4 space-y-3">
                {(() => {
                  const list = asteroids as Asteroid[];
                  const hazardous = list.filter((a) => a.is_potentially_hazardous).length;
                  return [
                    { l: "Total tracked", v: list.length, c: "bg-primary" },
                    { l: "Hazardous", v: hazardous, c: "bg-destructive" },
                    { l: "Safe", v: list.length - hazardous, c: "bg-success" },
                  ].map((r) => (
                    <div key={r.l}>
                      <div className="flex justify-between text-sm">
                        <span>{r.l}</span>
                        <span className="tabular text-muted-foreground">{r.v}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-border">
                        <div className={`h-full rounded-full ${r.c}`} style={{ width: list.length ? `${(r.v / list.length) * 100}%` : "0%" }} />
                      </div>
                    </div>
                  ));
                })()}
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <Link to="/asteroids">View all <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            ) : null}
          </div>
        </FadeIn>
      </div>

      {/* Asteroid table + Earth events */}
      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn delay={0.05}>
          <div className="rounded-3xl border border-border bg-card p-5 lg:col-span-2">
            <SectionHeader
              eyebrow="Near-Earth objects"
              title="Asteroid monitoring"
              action={<Button asChild variant="ghost" size="sm"><Link to="/asteroids">View all <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
            />
            {isLoading ? (
              <div className="animate-pulse space-y-3 mt-4">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded bg-border" />)}
              </div>
            ) : isSectionError(asteroids) ? (
              <SectionError message={asteroids.error} />
            ) : !(asteroids as Asteroid[])?.length ? (
              <p className="mt-4 text-sm text-muted-foreground">No asteroids tracked today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="py-2 pr-4 font-normal">Object</th>
                      <th className="py-2 pr-4 font-normal">Velocity</th>
                      <th className="py-2 pr-4 font-normal">Distance</th>
                      <th className="py-2 pr-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(asteroids as Asteroid[]).slice(0, 5).map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface">
                        <td className="py-3 pr-4 font-medium">{a.name}</td>
                        <td className="py-3 pr-4 tabular">{a.relative_velocity_km_s.toFixed(1)} km/s</td>
                        <td className="py-3 pr-4 tabular">{a.miss_distance_au.toFixed(4)} au</td>
                        <td className="py-3 pr-4">
                          {a.is_potentially_hazardous ? (
                            <Badge className="border-transparent bg-destructive/10 text-destructive">Hazardous</Badge>
                          ) : (
                            <Badge variant="outline">Safe</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-5">
            <SectionHeader
              eyebrow="EONET feed"
              title="Earth events"
              action={<Button asChild variant="ghost" size="sm"><Link to="/earth-events">All <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
            />
            {isLoading ? (
              <div className="animate-pulse space-y-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded bg-border" />)}
              </div>
            ) : isSectionError(earthEvents) ? (
              <SectionError message={earthEvents.error} />
            ) : !(earthEvents as EarthEvent[])?.length ? (
              <p className="mt-4 text-sm text-muted-foreground">No active events detected.</p>
            ) : (
              <ol className="relative ml-1 mt-4 space-y-4 border-l border-border pl-5">
                {(earthEvents as EarthEvent[]).slice(0, 4).map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full border-2 border-warning bg-warning/20" />
                    <p className="text-sm font-medium leading-snug">{e.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {e.categories[0]?.title ?? "Event"} · {e.closed ? "Closed" : "Active"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Mars gallery */}
      <FadeIn delay={0.05}>
        <div className="rounded-3xl border border-border bg-card p-5">
          <SectionHeader
            eyebrow="Mars rover"
            title="Latest photographs"
            action={<Button asChild variant="ghost" size="sm"><Link to="/mars">Open gallery <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
          />
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse aspect-[4/5] rounded-xl bg-border" />
              ))}
            </div>
          ) : isSectionError(marsPhotos) ? (
            <SectionError message={marsPhotos.error} />
          ) : !(marsPhotos as MarsPhoto[])?.length ? (
            <p className="mt-4 text-sm text-muted-foreground">No Mars photos available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mt-4">
              {(marsPhotos as MarsPhoto[]).slice(0, 4).map((m, i) => (
                <motion.div
                  key={m.id}
                  whileHover={{ y: -3 }}
                  className="group relative overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={m.img_src}
                    alt={`Sol ${m.sol} — ${m.camera_name}`}
                    className="aspect-[4/5] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                    <p className="text-xs font-medium">{m.rover_name} · Sol {m.sol}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider opacity-80">{m.camera_abbrev}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
