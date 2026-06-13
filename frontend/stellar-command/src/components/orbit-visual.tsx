import { motion } from "motion/react";

export function OrbitVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-full ${className}`} aria-hidden>
      {/* Star field */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => {
          const top = (i * 37) % 100;
          const left = (i * 53) % 100;
          const size = (i % 3) + 1;
          return (
            <span
              key={i}
              className="animate-twinkle absolute rounded-full bg-foreground/40"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: size,
                height: size,
                animationDelay: `${(i % 7) * 0.4}s`,
              }}
            />
          );
        })}
      </div>

      {/* Concentric orbital rings */}
      <div className="absolute inset-0 grid place-items-center">
        {[92, 76, 60, 44, 28].map((s, i) => (
          <div
            key={s}
            className="absolute rounded-full border border-foreground/10"
            style={{ width: `${s}%`, height: `${s}%` }}
          >
            {i % 2 === 0 && (
              <div
                className={`absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_18px_2px_var(--color-primary)] ${i === 0 ? "animate-orbit-slow" : i === 2 ? "animate-orbit-med" : "animate-orbit-fast"}`}
                style={{ transformOrigin: `50% ${s / 2}%` }}
              />
            )}
          </div>
        ))}
        {/* Planet */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative h-[22%] w-[22%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #fff, #f1f3f5 40%, #d9dde2 70%, #aab1ba 100%)",
            boxShadow:
              "inset -10px -10px 30px rgba(0,0,0,0.18), 0 0 60px rgba(37,99,235,0.15)",
          }}
        >
          {/* meridian lines */}
          <span className="absolute inset-0 rounded-full border border-foreground/10" />
          <span className="absolute inset-x-0 top-1/2 h-px bg-foreground/10" />
        </motion.div>
      </div>

      {/* Diagonal trajectory */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="traj" x1="0" x2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          d="M5,90 Q 50,10 95,40"
          stroke="url(#traj)"
          className="text-primary"
          strokeWidth="0.4"
          strokeDasharray="1 1.5"
        />
      </svg>
    </div>
  );
}
