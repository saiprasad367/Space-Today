import { useQuery } from "@tanstack/react-query";
import { getEarthEvents } from "@/lib/api/space";

const STALE_1H = 60 * 60 * 1000;

export function useEarthEvents(limit = 50) {
  return useQuery({
    queryKey: ["earth-events", limit],
    queryFn: () => getEarthEvents(limit),
    staleTime: STALE_1H,
    retry: 2,
  });
}
