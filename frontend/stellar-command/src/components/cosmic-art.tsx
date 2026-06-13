import { motion } from "motion/react";

const COLORS = [
  "linear-gradient(135deg,#0b1a3a 0%,#1e3a8a 45%,#60a5fa 100%)",
  "linear-gradient(135deg,#2a0d3a 0%,#5b1d63 45%,#d97aa6 100%)",
  "linear-gradient(135deg,#0a2a2f 0%,#0f5252 50%,#4ade80 100%)",
  "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#9333ea 100%)",
  "linear-gradient(135deg,#2d0a0a 0%,#7a1313 50%,#fb923c 100%)",
];

export function CosmicArt({ seed = 0, className = "", showStars = true }: { seed?: number; className?: string; showStars?: boolean }) {
  const bg = COLORS[seed % COLORS.length];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: bg }} aria-hidden>
      {showStars && (
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => {
            const top = ((i * 41 + seed * 7) % 100);
            const left = ((i * 73 + seed * 11) % 100);
            return <span key={i} className="absolute h-[2px] w-[2px] rounded-full bg-white/70" style={{ top: `${top}%`, left: `${left}%`, opacity: 0.2 + ((i % 5) * 0.15) }} />;
          })}
        </div>
      )}
      {/* nebula glow */}
      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute -right-10 -top-10 h-[60%] w-[60%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35), transparent 60%)", filter: "blur(20px)" }}
      />
      {/* faint planet */}
      <div className="absolute bottom-[-30%] left-[-15%] h-[80%] w-[80%] rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(0,0,0,0.3) 70%)", filter: "blur(2px)" }} />
    </div>
  );
}

export function MarsArt({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  const hues = [18, 22, 14, 28, 10];
  const h = hues[seed % hues.length];
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(180deg, hsl(${h} 60% 55%) 0%, hsl(${h - 4} 55% 40%) 50%, hsl(${h - 10} 50% 22%) 100%)`,
      }}
      aria-hidden
    >
      {/* horizon */}
      <div className="absolute inset-x-0 top-[55%] h-px bg-black/30" />
      {/* sun haze */}
      <div className="absolute right-6 top-6 h-16 w-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,220,180,0.6), transparent 70%)" }} />
      {/* terrain mounds */}
      <svg viewBox="0 0 200 100" className="absolute inset-x-0 bottom-0 h-1/2 w-full">
        <path d="M0,80 Q40,40 80,60 T160,55 T200,70 V100 H0 Z" fill="rgba(0,0,0,0.35)" />
        <path d="M0,90 Q60,60 120,80 T200,85 V100 H0 Z" fill="rgba(0,0,0,0.5)" />
      </svg>
      {/* dust speckle */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 1px, transparent 1px) 0 0/4px 4px" }} />
    </div>
  );
}
