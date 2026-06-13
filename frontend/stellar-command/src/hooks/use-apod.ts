import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApod } from "@/lib/api/space";

// NASA caches APOD for 24h — match staleTime
const STALE_24H = 24 * 60 * 60 * 1000;

export function useApod(date?: string) {
  return useQuery({
    queryKey: ["apod", date ?? "today"],
    queryFn: () => getApod(date),
    staleTime: STALE_24H,
    retry: 2,
  });
}

export function useApodWithNav() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const query = useApod(date);

  function goBack() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split("T")[0]);
  }

  function goForward() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split("T")[0];
    if (next <= today) setDate(next);
  }

  return { ...query, date, setDate, goBack, goForward, isToday: date === today };
}
