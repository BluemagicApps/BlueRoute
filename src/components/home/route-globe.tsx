import { cn } from "@/lib/utils";

/**
 * Stylized animated globe with live shipping routes.
 * Pure SVG + SMIL + CSS — no JS, renders on the server, animates everywhere.
 * Dots travel along great-circle-style arcs between glowing port nodes.
 */
export function RouteGlobe({ className }: { className?: string }) {
  const routes = [
    { d: "M150 250 C 200 120, 360 110, 430 200", dur: "5s", delay: "0s" },
    { d: "M170 320 C 280 360, 380 320, 440 260", dur: "6.5s", delay: "1.2s" },
    { d: "M150 250 C 120 350, 230 430, 360 400", dur: "7s", delay: "0.6s" },
    { d: "M430 200 C 470 280, 440 360, 360 400", dur: "6s", delay: "2s" },
  ];

  const ports = [
    { x: 150, y: 250 },
    { x: 430, y: 200 },
    { x: 360, y: 400 },
    { x: 170, y: 320 },
    { x: 440, y: 260 },
  ];

  return (
    <svg
      viewBox="0 0 560 520"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Animated globe showing live Blue Route shipping lanes"
    >
      <defs>
        <radialGradient id="globeFill" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#dbe7ff" />
          <stop offset="55%" stopColor="#eef3fb" />
          <stop offset="100%" stopColor="#f7f9fc" />
        </radialGradient>
        <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b8cff" />
          <stop offset="100%" stopColor="#1e5bff" />
        </linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Ambient glow */}
      <circle cx="290" cy="280" r="210" fill="#1e5bff" opacity="0.1" filter="url(#soft)" />

      {/* Globe body */}
      <g className="animate-float">
        <circle cx="290" cy="280" r="180" fill="url(#globeFill)" stroke="#1e5bff" strokeWidth="2.4" />

        {/* Longitude / latitude grid */}
        <g stroke="#c4d3e8" strokeWidth="1" fill="none" opacity="0.7">
          <ellipse cx="290" cy="280" rx="180" ry="60" />
          <ellipse cx="290" cy="280" rx="180" ry="120" />
          <ellipse cx="290" cy="280" rx="60" ry="180" />
          <ellipse cx="290" cy="280" rx="120" ry="180" />
          <line x1="110" y1="280" x2="470" y2="280" />
          <line x1="290" y1="100" x2="290" y2="460" />
        </g>

        {/* Abstract landmasses */}
        <g fill="#cdd9ec" opacity="0.85">
          <path d="M180 210 q40 -30 80 -10 q30 15 10 45 q-25 30 -70 20 q-40 -15 -20 -55Z" />
          <path d="M330 180 q50 -10 70 25 q10 35 -30 45 q-45 5 -55 -30 q-5 -30 15 -40Z" />
          <path d="M250 330 q40 -5 55 25 q10 35 -35 45 q-45 5 -55 -30 q-5 -30 35 -40Z" />
        </g>

        {/* Routes */}
        {routes.map((r, i) => (
          <g key={i}>
            <path
              d={r.d}
              fill="none"
              stroke="url(#routeStroke)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
              strokeDasharray="2 6"
              className="animate-dash"
            />
            {/* Traveling cargo pulse */}
            <circle r="4" fill="#1e5bff">
              <animateMotion dur={r.dur} begin={r.delay} repeatCount="indefinite" path={r.d} rotate="auto" />
              <animate attributeName="opacity" values="0;1;1;0" dur={r.dur} begin={r.delay} repeatCount="indefinite" />
            </circle>
            <circle r="9" fill="#1e5bff" opacity="0.25">
              <animateMotion dur={r.dur} begin={r.delay} repeatCount="indefinite" path={r.d} />
            </circle>
          </g>
        ))}

        {/* Port nodes with sonar ping */}
        {ports.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#1e5bff" />
            <circle cx={p.x} cy={p.y} r="3.5" fill="none" stroke="#1e5bff" strokeWidth="1.2">
              <animate attributeName="r" values="3.5;16" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </g>

      {/* Orbiting AI satellite ring */}
      <g className="animate-spin-slow" style={{ transformOrigin: "290px 280px" }}>
        <ellipse cx="290" cy="280" rx="230" ry="95" fill="none" stroke="#1e5bff" strokeWidth="1" strokeDasharray="1 9" opacity="0.5" />
        <circle cx="520" cy="280" r="3" fill="#5b8cff" />
      </g>
    </svg>
  );
}
