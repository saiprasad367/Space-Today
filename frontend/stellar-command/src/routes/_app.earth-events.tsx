import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { AlertCircle, Star, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui-bits";
import { useEarthEvents } from "@/hooks/use-earth-events";
import { useAddFavorite } from "@/hooks/use-favorites";
import type { EarthEvent } from "@/lib/api/space";

export const Route = createFileRoute("/_app/earth-events")({
  head: () => ({ meta: [{ title: "Earth Events — Space Today" }] }),
  component: EarthEventsPage,
});

const CATEGORY_COLORS: Record<string, string> = {
  wildfires: "bg-orange-500/10 text-orange-400",
  severeStorms: "bg-blue-500/10 text-blue-400",
  volcanoes: "bg-red-500/10 text-red-400",
  drought: "bg-yellow-500/10 text-yellow-400",
  landslides: "bg-brown-500/10 text-amber-400",
  floods: "bg-cyan-500/10 text-cyan-400",
  earthquakes: "bg-purple-500/10 text-purple-400",
  snow: "bg-sky-500/10 text-sky-400",
  seaLakeIce: "bg-indigo-500/10 text-indigo-400",
  dustHaze: "bg-zinc-500/10 text-zinc-400",
};

function getCategoryColor(id: string): string {
  return CATEGORY_COLORS[id] ?? "bg-primary/10 text-primary";
}

function EarthEventsPage() {
  const { data = [], isLoading, error } = useEarthEvents(100);
  const addFavorite = useAddFavorite();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = Array.from(
    new Map(data.flatMap((e) => e.categories).map((c) => [c.id, c.title])).entries()
  );

  const filtered = activeCategory === "all"
    ? data
    : data.filter((e) => e.categories.some((c) => c.id === activeCategory));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <FadeIn>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">EONET · Live</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Earth event monitor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${data.length} active natural events tracked via NASA EONET`}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
          >
            All ({data.length})
          </Button>
          {categories.map(([id, title]) => (
            <Button
              key={id}
              variant={activeCategory === id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(id)}
            >
              {title} ({data.filter((e) => e.categories.some((c) => c.id === id)).length})
            </Button>
          ))}
        </div>
      </FadeIn>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load Earth events. Please try again.</span>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5 h-32" />
          ))}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">No events found for this category.</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 6) * 0.04 }}
              className="group relative rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {event.categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="outline"
                      className={`text-[11px] ${getCategoryColor(cat.id)}`}
                    >
                      {cat.title}
                    </Badge>
                  ))}
                </div>
                <Badge variant="outline" className={event.closed ? "text-muted-foreground" : "text-success border-success/20 bg-success/5"}>
                  {event.closed ? "Closed" : "Active"}
                </Badge>
              </div>
              <p className="mt-3 font-semibold leading-snug">{event.title}</p>
              {event.date && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              {event.coordinates.latitude !== null && event.coordinates.longitude !== null && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {event.coordinates.latitude?.toFixed(2)}°N {event.coordinates.longitude?.toFixed(2)}°E
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addFavorite.mutate({ item_type: "earth_event", item_payload: event as Record<string, unknown> })}
                >
                  <Star className="mr-1.5 h-3.5 w-3.5" /> Save
                </Button>
                {event.sources && event.sources.length > 0 && event.sources[0].url ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={event.sources[0].url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Source ({event.sources[0].id})
                    </a>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={event.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> EONET API
                    </a>
                  </Button>
                )}
                {event.coordinates.latitude !== null && event.coordinates.longitude !== null && (
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${event.coordinates.latitude},${event.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="mr-1.5 h-3.5 w-3.5" /> Map
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
