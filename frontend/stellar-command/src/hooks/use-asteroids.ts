import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAsteroids } from "@/lib/api/space";

const STALE_1H = 60 * 60 * 1000;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function useAsteroids(startDate?: string, endDate?: string) {
  const start = startDate ?? todayStr();
  const end = endDate ?? todayStr();
  return useQuery({
    queryKey: ["asteroids", start, end],
    queryFn: () => getAsteroids(start, end),
    staleTime: STALE_1H,
    retry: 2,
  });
}

export function useAsteroidsWithFilters() {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [hazardFilter, setHazardFilter] = useState<"all" | "hazardous" | "safe">("all");

  const query = useAsteroids(startDate, endDate);

  const filtered = (query.data ?? []).filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (hazardFilter === "hazardous" && !a.is_potentially_hazardous) return false;
    if (hazardFilter === "safe" && a.is_potentially_hazardous) return false;
    return true;
  });

  return {
    ...query,
    filtered,
    startDate, setStartDate,
    endDate, setEndDate,
    search, setSearch,
    hazardFilter, setHazardFilter,
    hazardousCount: filtered.filter((a) => a.is_potentially_hazardous).length,
  };
}
