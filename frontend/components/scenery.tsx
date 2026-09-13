"use client";

import { useEffect, useState } from "react";
import { SCENERY_FILES } from "@/lib/media";

/** Live viewport detection (≤760px = mobile). Single source of truth so no
 *  caller can forget to pass the right art set. */
export function useIsMobileViewport(): boolean {
  const [mobile, setMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 760px)").matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    setMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

/**
 * Scenery — six hand-built animated SVG vignettes (Himalayan dawn, Thar gold,
 * monsoon hills, marigold dusk, Himalayan night, backwater emerald).
 * Zero image/video assets: pure inline SVG + CSS, offline-safe, theme-tinted.
 * Timer screens rotate one scene per minute; splash uses a dedicated montage.
 */

export const SCENERY_COUNT = 6;

/** Which scene for a given elapsed second (changes every 60s, cycles 6). */
export function sceneryIndexFor(elapsedSeconds: number): number {
  return Math.floor(Math.max(0, elapsedSeconds) / 60) % SCENERY_COUNT;
}

function Birds({ y = 60, color = "#3A3A3A" }: { y?: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} className="sc-birds">
      <path d={`M250 ${y} q7 -7 14 0 q7 -7 14 0`} />
      <path d={`M300 ${y + 14} q6 -6 12 0 q6 -6 12 0`} />
      <path d={`M205 ${y + 22} q5 -5 10 0 q5 -5 10 0`} />
    </g>
  );
}

function Stars({ count = 26 }: { count?: number }) {
  const pts: [number, number, number][] = [];
  let s = 42;
  for (let i = 0; i < count; i++) {
    s = (s * 16807) % 2147483647;
    const x = 20 + (s % 760);
    s = (s * 16807) % 2147483647;
    const y = 8 + (s % 130);
    s = (s * 16807) % 2147483647;
    pts.push([x, y, 1 + (s % 20) / 16]);
  }
  return (
    <g fill="#fff" className="sc-stars">
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} style={{ animationDelay: `${(i % 7) * 0.5}s` }} />
      ))}
    </g>
  );
}

function Clouds({ color = "#ffffff", y = 60, opacity = 0.85 }: { color?: string; y?: number; opacity?: number }) {
  return (
    <g fill={color} opacity={opacity} className="sc-clouds">
      <ellipse cx={180} cy={y} rx={52} ry={14} />
      <ellipse cx={225} cy={y - 10} rx={40} ry={13} />
      <ellipse cx={560} cy={y + 26} rx={60} ry={15} />
      <ellipse cx={620} cy={y + 14} rx={38} ry={12} />
    </g>
  );
}

function Peaks({ snow = "#F7F3EA", rock1 = "#6B7280", rock2 = "#4B5563" }: { snow?: string; rock1?: string; rock2?: string }) {
  return (
    <g>
      <path d="M0 210 L150 90 L260 190 L400 70 L540 200 L660 110 L800 210 V300 H0 Z" fill={rock1} />
      <path d="M150 90 L190 122 L150 140 L112 120 Z M400 70 L448 112 L400 134 L354 110 Z M660 110 L694 138 L660 154 L628 136 Z" fill={snow} />
      <path d="M0 240 L200 150 L360 235 L560 160 L800 245 V300 H0 Z" fill={rock2} opacity={0.92} />
    </g>
  );
}

function Temple({ x = 640, y = 236, color = "#2B2118" }: { x?: number; y?: number; color?: string }) {
  return (
    <g fill={color}>
      <rect x={x - 46} y={y - 34} width={92} height={34} rx={3} />
      <path d={`M${x - 30} ${y - 34} Q${x} ${y - 108} ${x + 30} ${y - 34} Z`} />
      <rect x={x - 5} y={y - 122} width={10} height={22} rx={3} />
      <circle cx={x} cy={y - 126} r={5} fill="#E8A33D" className="sc-diya" />
      <rect x={x - 12} y={y - 22} width={24} height={22} rx={8} fill="#E8A33D" opacity={0.9} />
    </g>
  );
}

function Diyas() {
  return (
    <g fill="#F2B23E" className="sc-diya">
      <circle cx={120} cy={272} r={3.4} />
      <circle cx={240} cy={278} r={2.6} />
      <circle cx={470} cy={276} r={3} />
      <circle cx={700} cy={272} r={3.4} />
      <circle cx={60} cy={280} r={2.4} />
    </g>
  );
}

export function Scenery({
  index,
  mobile = false,
  className,
  label,
  eager = false,
}: {
  index: number;
  mobile?: boolean;
  className?: string;
  label?: string;
  eager?: boolean;
}) {
  const i = ((index % SCENERY_COUNT) + SCENERY_COUNT) % SCENERY_COUNT;
  const [failed, setFailed] = useState(false);
  // Explicit prop wins (SSR/tests); otherwise the live viewport decides —
  // mobile art on mobile, desktop art on desktop, re-evaluated on resize.
  const autoMobile = useIsMobileViewport();
  const isMobile = mobile ?? autoMobile;
  const src = isMobile ? SCENERY_FILES[i].mobile : SCENERY_FILES[i].desktop;
  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        role="presentation"
        aria-label={label ?? `Scenery ${i + 1} of ${SCENERY_COUNT}`}
        className={`scenery-photo${className ? ` ${className}` : ""}`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return <ScenerySvg index={i} mobile={isMobile} className={className} label={label} />;
}

function ScenerySvg({
  index,
  mobile = false,
  className,
  label,
}: {
  index: number;
  mobile?: boolean;
  className?: string;
  label?: string;
}) {
  const i = ((index % SCENERY_COUNT) + SCENERY_COUNT) % SCENERY_COUNT;
  return (
    <svg
      viewBox="0 0 800 300"
      preserveAspectRatio="xMidYMid slice"
      className={`scenery${mobile ? " scenery--mobile" : ""}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={label ?? `Scenery ${i + 1} of ${SCENERY_COUNT}`}
    >
      {i === 0 && (
        <g>
          <defs>
            <linearGradient id="sc-sky0" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F7C8B0" />
              <stop offset="0.55" stopColor="#F2D8C2" />
              <stop offset="1" stopColor="#E9E4D2" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sc-sky0)" />
          <circle cx="400" cy="150" r="44" fill="#F5B453" className="sc-sun" />
          <circle cx="400" cy="150" r="62" fill="#F5B453" opacity={0.25} />
          <Clouds y={56} />
          <Birds y={88} />
          <Peaks />
          <path d="M0 268 Q400 250 800 268 V300 H0 Z" fill="#7C8A5A" />
          <g fill="#C93A5B" opacity={0.9}>
            <circle cx={140} cy={280} r={4} /><circle cx={168} cy={282} r={4} /><circle cx={640} cy={280} r={4} /><circle cx={668} cy={282} r={4} />
          </g>
        </g>
      )}
      {i === 1 && (
        <g>
          <defs>
            <linearGradient id="sc-sky1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E8913A" />
              <stop offset="0.6" stopColor="#F2C063" />
              <stop offset="1" stopColor="#E8D9A8" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sc-sky1)" />
          <circle cx="600" cy="96" r="40" fill="#FFF3D6" className="sc-sun" />
          <path d="M0 200 Q200 160 420 195 Q620 225 800 190 V300 H0 Z" fill="#C97E2E" />
          <path d="M0 240 Q260 205 520 235 Q680 250 800 235 V300 H0 Z" fill="#A86422" />
          <path d="M0 275 Q300 255 560 272 Q700 280 800 272 V300 H0 Z" fill="#8A4E1B" />
          <Temple x={170} y={252} color="#4A2E18" />
          <Birds y={70} color="#5A3A1A" />
        </g>
      )}
      {i === 2 && (
        <g>
          <defs>
            <linearGradient id="sc-sky2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5E7D7B" />
              <stop offset="0.6" stopColor="#8AA5A0" />
              <stop offset="1" stopColor="#C4CFC0" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sc-sky2)" />
          <g stroke="#E8F0EC" strokeWidth={1.4} opacity={0.65} className="sc-rain">
            {Array.from({ length: 26 }).map((_, k) => {
              const x = 20 + ((k * 173) % 760);
              const y = 10 + ((k * 97) % 150);
              return <line key={k} x1={x} y1={y} x2={x - 8} y2={y + 22} />;
            })}
          </g>
          <path d="M0 200 L180 110 L330 195 L520 100 L700 195 L800 150 V300 H0 Z" fill="#3E5A50" />
          <path d="M0 245 Q400 220 800 242 V300 H0 Z" fill="#5E8A7A" />
          <ellipse cx="400" cy="272" rx="180" ry="16" fill="#DCE8E2" opacity={0.8} className="sc-water" />
          <Temple x={660} y={250} color="#2E443C" />
        </g>
      )}
      {i === 3 && (
        <g>
          <defs>
            <linearGradient id="sc-sky3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4A2333" />
              <stop offset="0.55" stopColor="#A03A2E" />
              <stop offset="1" stopColor="#E08A3C" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sc-sky3)" />
          <circle cx="400" cy="205" r="52" fill="#F7D774" className="sc-sun" />
          <circle cx="400" cy="205" r="76" fill="#F7D774" opacity={0.22} />
          <Clouds color="#7A3040" y={60} opacity={0.7} />
          <path d="M0 250 Q400 235 800 250 V300 H0 Z" fill="#33202A" />
          <Temple x={150} y={262} color="#1E1420" />
          <Temple x={650} y={262} color="#1E1420" />
          <Diyas />
          <g fill="#F2B23E" opacity={0.85}>
            <circle cx={330} cy={266} r={2.4} /><circle cx={470} cy={266} r={2.4} />
          </g>
        </g>
      )}
      {i === 4 && (
        <g>
          <defs>
            <linearGradient id="sc-sky4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0E1330" />
              <stop offset="0.65" stopColor="#232B55" />
              <stop offset="1" stopColor="#3E4470" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sc-sky4)" />
          <Stars />
          <circle cx="620" cy="70" r="30" fill="#F2ECDA" className="sc-moon" />
          <circle cx="610" cy="62" r="26" fill="#232B55" opacity={0.35} />
          <Peaks snow="#DCE4F2" rock1="#3A4368" rock2="#2A3152" />
          <path d="M0 268 Q400 252 800 268 V300 H0 Z" fill="#1A2040" />
          <ellipse cx="400" cy="282" rx="170" ry="12" fill="#8A94C8" opacity={0.35} className="sc-water" />
          <Diyas />
        </g>
      )}
      {i === 5 && (
        <g>
          <defs>
            <linearGradient id="sc-sky5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#BFE3CE" />
              <stop offset="0.6" stopColor="#DFF0DC" />
              <stop offset="1" stopColor="#F2EEDC" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sc-sky5)" />
          <circle cx="200" cy="70" r="34" fill="#FFF6DC" className="sc-sun" />
          <Clouds y={48} />
          <path d="M0 190 Q400 170 800 190 V300 H0 Z" fill="#4E7A4E" />
          <g stroke="#2E5232" strokeWidth={5} strokeLinecap="round" fill="none">
            <path d="M120 190 Q118 130 122 96" />
            <path d="M680 190 Q682 130 678 96" />
          </g>
          <g fill="#3A6B3E">
            <ellipse cx={92} cy={108} rx={34} ry={10} transform="rotate(-18 92 108)" />
            <ellipse cx={152} cy={108} rx={34} ry={10} transform="rotate(18 152 108)" />
            <ellipse cx={650} cy={108} rx={34} ry={10} transform="rotate(-18 650 108)" />
            <ellipse cx={710} cy={108} rx={34} ry={10} transform="rotate(18 710 108)" />
          </g>
          <ellipse cx="400" cy={252} rx={230} ry={26} fill="#9CC4B4" />
          <ellipse cx="400" cy={252} rx={150} ry={16} fill="#C4DED2" opacity={0.85} className="sc-water" />
          <g>
            <path d="M360 250 h80 l-12 12 h-56 Z" fill="#6B4A2E" />
            <rect x={394} y={228} width={5} height={24} fill="#6B4A2E" />
            <circle cx={397} cy={224} r={7} fill="#2E443C" />
          </g>
          <Birds y={120} color="#2E5232" />
        </g>
      )}
    </svg>
  );
}
