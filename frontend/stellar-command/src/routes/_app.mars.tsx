import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FadeIn } from "@/components/ui-bits";
import { useMarsWithFilters } from "@/hooks/use-mars";
import { useAddFavorite } from "@/hooks/use-favorites";

export const Route = createFileRoute("/_app/mars")({
  head: () => ({ meta: [{ title: "Mars Photos — Space Today" }] }),
  component: MarsPage,
});

function MarsPage() {
  const { data, isLoading, error, rover, setRover, camera, setCamera, sol, setSol } = useMarsWithFilters();
  const addFavorite = useAddFavorite();

  return (
    <div className="space-y-6 p-4 md:p-8">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Mars Rover Photos</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Postcards from Mars</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${data?.length ?? 0} photos from ${rover} rover`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={rover} onValueChange={(v) => { setRover(v); setSol(undefined); setCamera(undefined); }}>
              <SelectTrigger className="h-10 w-36"><SelectValue placeholder="Rover" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curiosity">Curiosity</SelectItem>
                <SelectItem value="perseverance">Perseverance</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={camera ?? "all"} onValueChange={(v) => setCamera(v === "all" ? undefined : v)}>
              <SelectTrigger className="h-10 w-36"><SelectValue placeholder="Camera" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cameras</SelectItem>
                <SelectItem value="MAST">MAST</SelectItem>
                <SelectItem value="NAVCAM">NAVCAM</SelectItem>
                <SelectItem value="MAHLI">MAHLI</SelectItem>
                <SelectItem value="FHAZ">FHAZ</SelectItem>
                <SelectItem value="RHAZ">RHAZ</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setSol(undefined)}>Latest sol</Button>
          </div>
        </div>
      </FadeIn>

      {isLoading && (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid animate-pulse rounded-2xl bg-border aspect-square" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm">Failed to load Mars photos. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">No photos found for the selected filters.</p>
          <p className="text-xs">Try a different rover or camera combination.</p>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {data.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="mb-4 break-inside-avoid"
            >
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card">
                <img
                  src={m.img_src}
                  alt={`${m.rover_name} Sol ${m.sol} — ${m.camera_name}`}
                  className="w-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                />
                <button
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100"
                  aria-label="Save favorite"
                  onClick={() => addFavorite.mutate({ item_type: "mars_photo", item_payload: m as Record<string, unknown> })}
                >
                  <Star className="h-4 w-4" />
                </button>
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-medium">{m.rover_name} · Sol {m.sol}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px]">{m.camera_abbrev}</Badge>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.earth_date}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
