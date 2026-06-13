import { api } from "./client";

export interface ApodData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright: string;
}

export interface Asteroid {
  id: string;
  name: string;
  nasa_jpl_url?: string;
  is_potentially_hazardous: boolean;
  diameter_min_m?: number;
  diameter_max_m?: number;
  close_approach_date?: string;
  relative_velocity_km_s: number;
  miss_distance_au: number;
  miss_distance_km: number;
  orbiting_body: string;
}

export interface MarsPhoto {
  id: number;
  sol: number;
  earth_date: string;
  img_src: string;
  camera_name: string;
  camera_abbrev: string;
  rover_name: string;
  rover_status: string;
}

export interface EarthEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  closed?: string;
  categories: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; url: string }>;
  date?: string;
  coordinates: { longitude?: number; latitude?: number };
  geometry_type?: string;
}

export interface DashboardData {
  apod: ApodData | { error: string };
  asteroids: Asteroid[] | { error: string };
  mars_photos: MarsPhoto[] | { error: string };
  earth_events: EarthEvent[] | { error: string };
  fetched_at: string;
}

export function getApod(date?: string): Promise<ApodData> {
  const params = date ? `?date=${date}` : "";
  return api.get<ApodData>(`/space/apod${params}`);
}

export function getAsteroids(startDate?: string, endDate?: string): Promise<Asteroid[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const q = params.toString();
  return api.get<Asteroid[]>(`/space/asteroids${q ? `?${q}` : ""}`);
}

export function getMarsPhotos(options?: {
  rover?: string;
  camera?: string;
  sol?: number;
  earth_date?: string;
}): Promise<MarsPhoto[]> {
  const params = new URLSearchParams();
  if (options?.rover) params.set("rover", options.rover);
  if (options?.camera) params.set("camera", options.camera);
  if (options?.sol !== undefined) params.set("sol", String(options.sol));
  if (options?.earth_date) params.set("earth_date", options.earth_date);
  const q = params.toString();
  return api.get<MarsPhoto[]>(`/space/mars-photos${q ? `?${q}` : ""}`);
}

export function getEarthEvents(limit = 50): Promise<EarthEvent[]> {
  return api.get<EarthEvent[]>(`/space/earth-events?limit=${limit}`);
}

export function getDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>("/space/dashboard");
}
