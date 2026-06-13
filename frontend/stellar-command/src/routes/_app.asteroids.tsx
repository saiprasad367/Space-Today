import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2, AlertCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FadeIn } from "@/components/ui-bits";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";
import { useAsteroidsWithFilters } from "@/hooks/use-asteroids";
import { useAddFavorite } from "@/hooks/use-favorites";

export const Route = createFileRoute("/_app/asteroids")({
  head: () => ({ meta: [{ title: "Asteroids — Space Today" }] }),
  component: AsteroidsPage,
});

function AsteroidsPage() {
  const {
    filtered, isLoading, error,
    search, setSearch,
    hazardFilter, setHazardFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    hazardousCount,
  } = useAsteroidsWithFilters();

  const addFavorite = useAddFavorite();

  const chartData = filtered.slice(0, 12).map((a) => ({
    name: a.name.replace(/\(|\)/g, "").split(" ").pop(),
    distance: parseFloat(a.miss_distance_au.toFixed(4)),
  }));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">NeoWs · Live</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Near-Earth objects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${filtered.length} objects tracked · ${hazardousCount} flagged hazardous`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 w-36" />
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-36" />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 w-64 pl-9"
                placeholder="Search by designation…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={hazardFilter} onValueChange={(v: any) => setHazardFilter(v)}>
              <SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All objects</SelectItem>
                <SelectItem value="hazardous">Hazardous</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeIn>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load asteroid data. Please try again.</span>
        </div>
      )}

      <FadeIn delay={0.05}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Miss distance distribution (au)</p>
            {isLoading ? (
              <div className="animate-pulse mt-4 h-[180px] rounded bg-border" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="distance" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Risk summary</p>
            <div className="mt-4 space-y-3">
              {[
                { l: "Hazardous", v: hazardousCount, c: "bg-destructive" },
                { l: "Safe", v: filtered.length - hazardousCount, c: "bg-success" },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-sm">
                    <span>{r.l}</span>
                    <span className="tabular text-muted-foreground">{isLoading ? "—" : r.v}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-border">
                    <div className={`h-full rounded-full ${r.c}`} style={{ width: filtered.length ? `${(r.v / filtered.length) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="animate-pulse space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 rounded bg-border" />)}
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">No asteroids found for the selected filters.</p>
            </div>
          ) : (
            <>
              <table className="min-w-full text-sm">
                <thead className="bg-surface">
                  <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-5 py-3 font-normal">Name</th>
                    <th className="px-5 py-3 font-normal">Velocity (km/s)</th>
                    <th className="px-5 py-3 font-normal">Distance (au)</th>
                    <th className="px-5 py-3 font-normal">Approach</th>
                    <th className="px-5 py-3 font-normal">Status</th>
                    <th className="px-5 py-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-t border-border hover:bg-surface">
                      <td className="px-5 py-3 font-medium">{a.name}</td>
                      <td className="px-5 py-3 tabular">{a.relative_velocity_km_s.toFixed(1)}</td>
                      <td className="px-5 py-3 tabular">{a.miss_distance_au.toFixed(4)}</td>
                      <td className="px-5 py-3 tabular text-muted-foreground">{a.close_approach_date ?? "—"}</td>
                      <td className="px-5 py-3">
                        {a.is_potentially_hazardous ? (
                          <Badge className="border-transparent bg-destructive/10 text-destructive">Hazardous</Badge>
                        ) : (
                          <Badge variant="outline">Safe</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addFavorite.mutate({ item_type: "asteroid", item_payload: a as Record<string, unknown> })}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
