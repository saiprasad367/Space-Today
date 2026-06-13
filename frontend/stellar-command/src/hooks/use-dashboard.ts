import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/space";

const STALE_30M = 30 * 60 * 1000;

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: STALE_30M,
    retry: 1,
  });
}

/** Type guard: check if a dashboard section has an error */
export function isSectionError(section: unknown): section is { error: string } {
  return typeof section === "object" && section !== null && "error" in section;
}
