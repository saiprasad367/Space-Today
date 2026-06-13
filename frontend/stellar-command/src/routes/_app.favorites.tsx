import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Trash2, AlertCircle, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui-bits";
import { useFavorites, useRemoveFavorite } from "@/hooks/use-favorites";
import type { Favorite } from "@/lib/api/favorites";

export const Route = createFileRoute("/_app/favorites")({
  head: () => ({ meta: [{ title: "Favorites — Space Today" }] }),
  component: FavoritesPage,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "apod", label: "APOD" },
  { key: "asteroid", label: "Asteroids" },
  { key: "mars_photo", label: "Mars Photos" },
  { key: "earth_event", label: "Earth Events" },
] as const;

type TabKey = typeof TABS[number]["key"];

function FavoriteCard({ fav }: { fav: Favorite }) {
  const remove = useRemoveFavorite();
  const p = fav.item_payload;

  const title =
    (p.title as string) ||
    (p.name as string) ||
    (p.title as string) ||
    (fav.item_type === "mars_photo" ? `Sol ${p.sol} — ${p.camera_name}` : "Unknown");

  const subtitle =
    fav.item_type === "apod" ? (p.date as string) ?? "" :
    fav.item_type === "asteroid" ? `${(p.miss_distance_au as number)?.toFixed(4)} au miss distance` :
    fav.item_type === "mars_photo" ? `${p.rover_name} · ${p.camera_abbrev}` :
    fav.item_type === "earth_event" ? "Earth event" :
    "";

  const image = (p.url as string) || (p.img_src as string);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-foreground/20 transition"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 font-mono text-[10px] capitalize">
              {fav.item_type.replace("_", " ")}
            </Badge>
            <p className="truncate font-semibold leading-snug">{title}</p>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove.mutate(fav.id)}
            disabled={remove.isPending}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Remove from favorites"
          >
            {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Saved {new Date(fav.saved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </motion.div>
  );
}

function FavoritesPage() {
  const { data, isLoading, error } = useFavorites();
  const [tab, setTab] = useState<TabKey>("all");

  const all = data?.favorites ?? [];
  const filtered = tab === "all" ? all : all.filter((f) => f.item_type === tab);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Saved items</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Your favorites</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${all.length} items saved across all categories`}
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => {
            const count = key === "all" ? all.length : all.filter((f) => f.item_type === key).length;
            return (
              <Button
                key={key}
                variant={tab === key ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(key)}
              >
                {label} ({count})
              </Button>
            );
          })}
        </div>
      </FadeIn>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load favorites. Please try again.</span>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card h-48" />
          ))}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <FadeIn>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Star className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-semibold">No favorites yet</p>
            <p className="text-sm text-muted-foreground">
              {tab === "all"
                ? "Save APOD images, asteroids, Mars photos, and Earth events here."
                : `No ${tab.replace("_", " ")} favorites saved yet.`}
            </p>
          </div>
        </FadeIn>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fav) => (
            <FavoriteCard key={fav.id} fav={fav} />
          ))}
        </div>
      )}
    </div>
  );
}
