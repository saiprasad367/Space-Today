import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarsPhotos } from "@/lib/api/space";

const STALE_1H = 60 * 60 * 1000;

export function useMarsPhotos(options?: {
  rover?: string;
  camera?: string;
  sol?: number;
  earth_date?: string;
}) {
  return useQuery({
    queryKey: ["mars", options?.rover ?? "curiosity", options?.camera ?? "all", options?.sol ?? "latest"],
    queryFn: () => getMarsPhotos(options),
    staleTime: STALE_1H,
    retry: 2,
  });
}

export function useMarsWithFilters() {
  const [rover, setRover] = useState("curiosity");
  const [camera, setCamera] = useState<string | undefined>(undefined);
  const [sol, setSol] = useState<number | undefined>(undefined);

  const query = useMarsPhotos({ rover, camera, sol });

  return {
    ...query,
    rover, setRover,
    camera, setCamera,
    sol, setSol,
  };
}
