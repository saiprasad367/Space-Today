// Mock NASA-style data for the design showcase
export const APOD = {
  title: "The Tarantula Nebula in Three Wavelengths",
  date: "2026-06-12",
  explanation:
    "Captured by the James Webb Space Telescope, the Tarantula Nebula spans more than 1,000 light-years in the Large Magellanic Cloud. This composite combines near-infrared, mid-infrared, and visible light to reveal newborn stars carving cavities in dense clouds of cosmic dust.",
  url: "https://images-assets.nasa.gov/image/PIA23646/PIA23646~orig.jpg",
  copyright: "NASA / JWST / ESA",
};

export const STATS = [
  { label: "APOD Views Today", value: 12480, delta: "+8.2%", tone: "primary" as const },
  { label: "Asteroids Detected", value: 27, delta: "3 hazardous", tone: "warning" as const },
  { label: "Mars Photos", value: 1843, delta: "+412 today", tone: "info" as const },
  { label: "Earth Events", value: 64, delta: "Live", tone: "success" as const },
];

export const ASTEROIDS = [
  { name: "2026 KX1", velocity: 18.4, distance: 0.018, size: 142, hazard: true, date: "2026-06-12" },
  { name: "2026 LM4", velocity: 12.1, distance: 0.042, size: 78, hazard: false, date: "2026-06-13" },
  { name: "2026 JN9", velocity: 21.7, distance: 0.009, size: 310, hazard: true, date: "2026-06-13" },
  { name: "2026 KP2", velocity: 9.6, distance: 0.071, size: 56, hazard: false, date: "2026-06-14" },
  { name: "2025 YR3", velocity: 14.8, distance: 0.054, size: 188, hazard: false, date: "2026-06-15" },
  { name: "2026 LL8", velocity: 23.3, distance: 0.012, size: 244, hazard: true, date: "2026-06-16" },
  { name: "2024 BX7", velocity: 11.2, distance: 0.088, size: 64, hazard: false, date: "2026-06-17" },
  { name: "2026 MM1", velocity: 17.0, distance: 0.034, size: 121, hazard: false, date: "2026-06-18" },
];

export const MARS = [
  { id: "m1", title: "Curiosity • Sol 4321", camera: "MAST", rover: "Curiosity", color: "#c47a3d" },
  { id: "m2", title: "Perseverance • Sol 1208", camera: "NAVCAM", rover: "Perseverance", color: "#9b5d31" },
  { id: "m3", title: "Curiosity • Sol 4322", camera: "MAHLI", rover: "Curiosity", color: "#a86638" },
  { id: "m4", title: "Perseverance • Sol 1209", camera: "Mastcam-Z", rover: "Perseverance", color: "#b56a36" },
  { id: "m5", title: "Curiosity • Sol 4323", camera: "RHAZ", rover: "Curiosity", color: "#8d5530" },
  { id: "m6", title: "Perseverance • Sol 1210", camera: "SHERLOC", rover: "Perseverance", color: "#a96234" },
  { id: "m7", title: "Curiosity • Sol 4324", camera: "MAST", rover: "Curiosity", color: "#b8703a" },
  { id: "m8", title: "Perseverance • Sol 1211", camera: "NAVCAM", rover: "Perseverance", color: "#95582f" },
  { id: "m9", title: "Curiosity • Sol 4325", camera: "MAHLI", rover: "Curiosity", color: "#a85f33" },
];

export const EVENTS = [
  { id: "e1", title: "Wildfire — Northern Alberta", category: "Wildfires", severity: "high", location: "Canada", status: "Active", date: "2026-06-12" },
  { id: "e2", title: "Severe Storm — Bay of Bengal", category: "Storms", severity: "medium", location: "India", status: "Active", date: "2026-06-12" },
  { id: "e3", title: "Volcanic Activity — Mt. Etna", category: "Volcanoes", severity: "medium", location: "Italy", status: "Monitoring", date: "2026-06-11" },
  { id: "e4", title: "Iceberg Calved — Larsen Shelf", category: "Sea & Lake Ice", severity: "low", location: "Antarctica", status: "Closed", date: "2026-06-10" },
  { id: "e5", title: "Dust Storm — Sahara", category: "Dust & Haze", severity: "medium", location: "Algeria", status: "Active", date: "2026-06-10" },
  { id: "e6", title: "Flood — Yangtze Basin", category: "Floods", severity: "high", location: "China", status: "Active", date: "2026-06-09" },
];

export const ACTIVITY = Array.from({ length: 24 }).map((_, i) => ({
  hour: `${i}:00`,
  asteroids: Math.round(8 + Math.sin(i / 2) * 4 + (i % 5)),
  events: Math.round(4 + Math.cos(i / 3) * 2 + (i % 3)),
  apod: Math.round(20 + Math.sin(i / 4) * 8),
}));
