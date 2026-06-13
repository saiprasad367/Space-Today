import { createFileRoute } from "@tanstack/react-router";
import { Star, Share2, Download, ChevronLeft, ChevronRight, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui-bits";
import { useApodWithNav } from "@/hooks/use-apod";
import { useAddFavorite } from "@/hooks/use-favorites";

export const Route = createFileRoute("/_app/apod")({
  head: () => ({ meta: [{ title: "APOD — Space Today" }] }),
  component: APODPage,
});

function APODPage() {
  const { data, isLoading, error, date, setDate, goBack, goForward, isToday } = useApodWithNav();
  const addFavorite = useAddFavorite();

  return (
    <div className="space-y-8 p-4 md:p-8">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Astronomy Picture of the Day</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {isLoading ? "Loading…" : data?.title ?? "APOD"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goBack} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm outline-none"
              />
            </Button>
            <Button variant="outline" size="icon" onClick={goForward} disabled={isToday} aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {isLoading ? (
            <div className="animate-pulse aspect-[21/9] bg-surface flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="aspect-[21/9] flex flex-col items-center justify-center gap-2 bg-surface text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm">Failed to load APOD for this date.</p>
            </div>
          ) : data?.media_type === "video" ? (
            <div className="aspect-[21/9]">
              <iframe src={data.url} className="h-full w-full" allowFullScreen title={data.title} />
            </div>
          ) : (
            <img
              src={data?.hdurl ?? data?.url}
              alt={data?.title}
              className="aspect-[21/9] w-full object-cover"
            />
          )}

          {data && (
            <div className="grid gap-8 p-6 md:grid-cols-3 md:p-8">
              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{data.media_type === "video" ? "Video" : "Image"}</Badge>
                  <Badge variant="outline">{data.copyright}</Badge>
                </div>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{data.explanation}</p>
              </div>
              <aside className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Metadata</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Date</dt><dd className="tabular">{data.date}</dd>
                    <dt className="text-muted-foreground">Credit</dt><dd>{data.copyright}</dd>
                    <dt className="text-muted-foreground">Type</dt><dd className="capitalize">{data.media_type}</dd>
                    <dt className="text-muted-foreground">License</dt><dd>Public domain</dd>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => addFavorite.mutate({ item_type: "apod", item_payload: data as Record<string, unknown> })}
                    disabled={addFavorite.isPending}
                  >
                    <Star className="mr-2 h-4 w-4" /> {addFavorite.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                  <Button variant="outline" asChild>
                    <a href={data.hdurl ?? data.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
