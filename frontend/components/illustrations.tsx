"use client";

import type { CSSProperties } from "react";

/* ============================================================
   Illustration system + icon set ("Aki" hero, "Momo" companion,
   day/night environments). Rendered once as an SVG sprite;
   consumed everywhere via <use>.
   ============================================================ */

export type IconId =
  | "i-today" | "i-quests" | "i-campaigns" | "i-focus" | "i-realm"
  | "i-chronicle" | "i-store" | "i-settings" | "i-search" | "i-bell"
  | "i-coin" | "i-plus" | "i-check" | "i-play" | "i-pause" | "i-flame"
  | "i-close" | "i-arrow-r" | "i-sun" | "i-moon" | "i-spark" | "i-clock"
  | "i-strength" | "i-vitality" | "i-intellect" | "i-focusattr"
  | "i-discipline" | "i-craft" | "i-connection" | "i-exploration"
  | "i-level" | "i-trophy";

export function Icon({ id, style }: { id: IconId; style?: CSSProperties }) {
  return (
    <svg className="ic" style={style} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

export function Hero({ width = "100%", className }: { width?: string | number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 360" width={width} aria-hidden="true">
      <use href="#ill-hero" />
    </svg>
  );
}

export function Companion({ width = "100%" }: { width?: string | number }) {
  return (
    <svg viewBox="0 0 140 120" width={width} aria-hidden="true">
      <use href="#ill-companion" />
    </svg>
  );
}

export function EnvStack() {
  return (
    <div className="env-stack" aria-hidden="true">
      <svg className="env-layer env-day" aria-hidden="true">
        <use href="#ill-env-day" />
      </svg>
      <svg className="env-layer env-night" aria-hidden="true">
        <use href="#ill-env-night" />
      </svg>
    </div>
  );
}

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {/* HERO: "Aki" */}
        <symbol id="ill-hero" viewBox="0 0 220 360">
          <path d="M70 84 Q64 26 110 22 Q156 26 150 84 L153 134 Q142 124 141 100 L79 100 Q78 124 67 134 Z" fill="#2C3040" />
          <path d="M77 318 q0-7 8-7 h13 v14 h-14 q-7 0-7-7z" fill="#F5F2EA" />
          <rect x="73" y="324" width="28" height="7" rx="3.5" fill="#33363E" />
          <path d="M143 318 q0-7-8-7 h-13 v14 h14 q7 0 7-7z" fill="#F5F2EA" />
          <rect x="119" y="324" width="28" height="7" rx="3.5" fill="#33363E" />
          <path d="M87 190 h46 v14 l-3 110 h-16 l-4 -88 -4 88 h-16 l-3 -110 z" fill="#3B3E47" />
          <path d="M76 104 Q74 96 86 94 L134 94 Q146 96 144 104 L149 172 Q151 196 130 199 L90 199 Q69 196 71 172 Z" fill="#93AC8E" />
          <path d="M71 176 h78 v6 q1 16 -20 17 h-38 q-21 -1 -20 -17 z" fill="#86A081" />
          <path d="M110 118 v80" stroke="#7C9478" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M82 160 q8 6 16 4 M122 164 q8 2 16 -4" stroke="#7C9478" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M77 104 Q63 110 61 130 L57 172 q-1 13 9 14 q10 1 12 -11 l5 -38 z" fill="#86A081" />
          <circle cx="66" cy="193" r="7.5" fill="#F2CBAD" />
          <path d="M143 104 Q157 110 159 130 L162 164 q1 12 -9 13 q-10 1 -12 -11 l-5 -30 z" fill="#86A081" />
          <path d="M97 96 L110 119 L123 96 z" fill="#F3EAD8" />
          <path d="M100 78 h20 v14 q-10 8 -20 0 z" fill="#F2CBAD" />
          <path d="M92 95 Q110 106 128 95 L131 104 Q110 116 89 104 Z" fill="#D4694A" />
          <path d="M123 107 l3 26 9 -2 -4 -26 z" fill="#C05A3C" />
          <ellipse cx="110" cy="60" rx="27" ry="28.5" fill="#F6D7BF" />
          <ellipse cx="83" cy="64" rx="3.5" ry="5" fill="#F2CBAD" />
          <ellipse cx="137" cy="64" rx="3.5" ry="5" fill="#F2CBAD" />
          <ellipse cx="99" cy="66" rx="3" ry="4.2" fill="#2C3040" />
          <circle cx="100" cy="64.6" r="1.1" fill="#fff" />
          <ellipse cx="121" cy="66" rx="3" ry="4.2" fill="#2C3040" />
          <circle cx="122" cy="64.6" r="1.1" fill="#FFF" />
          <path d="M94 58 q4 -2.5 8 -.8 M118 57.2 q4 -1.7 8 .8" stroke="#2C3040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <ellipse cx="92" cy="73" rx="4" ry="2.4" fill="#F0A184" opacity=".55" />
          <ellipse cx="128" cy="73" rx="4" ry="2.4" fill="#F0A184" opacity=".55" />
          <path d="M107 78 q3 2.6 6 0" stroke="#B96B4E" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M80 70 Q75 26 110 23 Q145 26 140 70 L137 58 Q137 42 125 39 Q128 50 120 53 Q115 40 100 42 Q89 44 87 59 Q83 62 80 70 Z" fill="#2C3040" />
          <path d="M80 58 q-4 20 1 34 q6 3 8 -7 l-3 -29 z" fill="#2C3040" />
          <path d="M140 58 q4 20 -1 34 q-6 3 -8 -7 l3 -29 z" fill="#2C3040" />
          <path d="M85 46 Q97 32 117 34" stroke="#4A5168" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".8" />
        </symbol>

        {/* COMPANION: "Momo" */}
        <symbol id="ill-companion" viewBox="0 0 140 120">
          <path d="M100 82 q26 -4 26 -28 q2 18 -22 24 z" fill="#F1E2C8" />
          <path d="M118 60 q8 -2 8 -6 q3 8 -8 10 z" fill="#D4694A" />
          <path d="M42 50 L34 22 L60 40 Z" fill="#F5E7CF" />
          <path d="M45 45 L41 31 L54 41 Z" fill="#E8A183" />
          <path d="M94 50 L102 22 L76 40 Z" fill="#F5E7CF" />
          <path d="M91 45 L95 31 L82 41 Z" fill="#E8A183" />
          <ellipse cx="67" cy="76" rx="35" ry="31" fill="#F5E7CF" />
          <ellipse cx="67" cy="92" rx="20" ry="12" fill="#FBF3E2" />
          <circle cx="54" cy="72" r="3.6" fill="#3A342B" />
          <circle cx="55.2" cy="70.6" r="1.2" fill="#fff" />
          <circle cx="80" cy="72" r="3.6" fill="#3A342B" />
          <circle cx="81.2" cy="70.6" r="1.2" fill="#fff" />
          <path d="M64 81 q3 3 6 0" stroke="#3A342B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="67" cy="78" r="1.7" fill="#D48A6A" />
          <ellipse cx="46" cy="80" rx="4.5" ry="2.6" fill="#F0A184" opacity=".6" />
          <ellipse cx="88" cy="80" rx="4.5" ry="2.6" fill="#F0A184" opacity=".6" />
          <path d="M50 97 q17 10 34 0 l0 7 q-17 10 -34 0 z" fill="#D4694A" />
          <circle cx="67" cy="106" r="4.5" fill="#E9B95C" />
          <circle cx="67" cy="104.6" r="1.4" fill="#B98A2E" />
        </symbol>

        {/* ENVIRONMENT: DAY */}
        <symbol id="ill-env-day" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice">
          <rect width="800" height="300" fill="#E9F0E5" />
          <circle cx="640" cy="82" r="34" fill="#F0C97E" />
          <g fill="#FFFFFF" opacity=".8">
            <rect x="80" y="62" width="130" height="18" rx="9" /><rect x="118" y="46" width="86" height="16" rx="8" />
            <rect x="420" y="40" width="100" height="15" rx="7.5" /><rect x="450" y="28" width="62" height="13" rx="6.5" />
          </g>
          <path d="M0 192 Q150 118 320 178 Q480 230 640 168 Q720 140 800 158 V300 H0 Z" fill="#CBD9C0" />
          <g fill="#D4694A">
            <rect x="596" y="146" width="6" height="36" rx="2" /><rect x="630" y="146" width="6" height="36" rx="2" />
            <rect x="587" y="142" width="58" height="6" rx="3" /><rect x="592" y="154" width="48" height="5" rx="2.5" />
          </g>
          <path d="M0 224 Q210 152 430 212 Q620 260 800 202 V300 H0 Z" fill="#ACC9A2" />
          <g>
            <circle cx="130" cy="196" r="17" fill="#7FA374" /><rect x="127" y="206" width="6" height="16" rx="3" fill="#8A7256" />
            <circle cx="170" cy="206" r="12" fill="#93B489" /><rect x="167.5" y="213" width="5" height="13" rx="2.5" fill="#8A7256" />
            <circle cx="700" cy="212" r="15" fill="#7FA374" /><rect x="697.5" y="220" width="5" height="14" rx="2.5" fill="#8A7256" />
          </g>
          <path d="M0 262 Q240 212 520 254 Q670 274 800 246 V300 H0 Z" fill="#93B28B" />
        </symbol>

        {/* ENVIRONMENT: NIGHT */}
        <symbol id="ill-env-night" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice">
          <rect width="800" height="300" fill="#1A1E2C" />
          <circle cx="640" cy="80" r="30" fill="#EDE4CC" />
          <circle cx="630" cy="72" r="27" fill="#1A1E2C" opacity=".25" />
          <g fill="#D8D2C2">
            <circle cx="120" cy="50" r="1.6" /><circle cx="220" cy="90" r="1.2" /><circle cx="320" cy="40" r="1.8" />
            <circle cx="440" cy="70" r="1.2" /><circle cx="540" cy="36" r="1.5" /><circle cx="740" cy="120" r="1.4" />
            <circle cx="60" cy="120" r="1.2" /><circle cx="380" cy="110" r="1.1" />
          </g>
          <g fill="#242A3C" opacity=".8">
            <rect x="90" y="64" width="120" height="16" rx="8" /><rect x="430" y="42" width="92" height="14" rx="7" />
          </g>
          <path d="M0 192 Q150 118 320 178 Q480 230 640 168 Q720 140 800 158 V300 H0 Z" fill="#232B38" />
          <g fill="#F0C97E">
            <circle cx="616" cy="168" r="4" /><circle cx="616" cy="168" r="9" opacity=".2" />
            <circle cx="700" cy="158" r="3" /><circle cx="700" cy="158" r="7" opacity=".2" />
          </g>
          <path d="M0 224 Q210 152 430 212 Q620 260 800 202 V300 H0 Z" fill="#1F2A2C" />
          <g fill="#F0C97E">
            <circle cx="130" cy="200" r="3.4" /><circle cx="130" cy="200" r="8" opacity=".18" />
            <circle cx="175" cy="212" r="2.6" /><circle cx="175" cy="212" r="6" opacity=".18" />
          </g>
          <path d="M0 262 Q240 212 520 254 Q670 274 800 246 V300 H0 Z" fill="#19221F" />
        </symbol>

        {/* ICONS */}
        <symbol id="i-today" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10.5h16" /><path d="M9.5 15.5l2 2 3.5-4" /></g></symbol>
        <symbol id="i-quests" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></g></symbol>
        <symbol id="i-campaigns" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H14a3.4 3.4 0 0 0 0-6.8h-4a3.4 3.4 0 0 1 0-6.8h5.4" /></g></symbol>
        <symbol id="i-focus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><path d="M12 2.5v2M21.5 12h-2M12 21.5v-2M2.5 12h2" /></g></symbol>
        <symbol id="i-realm" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" /></g></symbol>
        <symbol id="i-chronicle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h13" /><path d="M9 7.5h6" /></g></symbol>
        <symbol id="i-store" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1.1 12H7.1z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></g></symbol>
        <symbol id="i-settings" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="9" cy="7" r="2.1" /><circle cx="15" cy="12" r="2.1" /><circle cx="11" cy="17" r="2.1" /></g></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.2" /><path d="M15.8 15.8L20 20" /></g></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.6 2.6H4.4z" /><path d="M10 21a2.2 2.2 0 0 0 4 0" /></g></symbol>
        <symbol id="i-coin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="3.4" /></g></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></g></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8.5 5.5v13l10.5-6.5z" /></symbol>
        <symbol id="i-pause" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M9 5.5v13M15 5.5v13" /></g></symbol>
        <symbol id="i-flame" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12 3c.5 3.2-4.6 5.4-4.6 9.6a4.9 4.9 0 0 0 9.8 0C17.2 8.6 13.2 7.2 12 3zM12 13.5c-1.1.9-1.6 1.7-1.6 2.6a1.9 1.9 0 0 0 3.8 0c0-1.1-1-1.8-2.2-2.6z" /></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></g></symbol>
        <symbol id="i-arrow-r" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></g></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" /></g></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M20 13.6A8.2 8.2 0 0 1 10.4 4 8.2 8.2 0 1 0 20 13.6z" /></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2 6.6 6.6 2-6.6 2-2 6.6-2-6.6-6.6-2 6.6-2z" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8" /><path d="M12 7.5v4.8l3 1.8" /></g></symbol>
        <symbol id="i-strength" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7.5 8v8M4.5 9.8v4.4M16.5 8v8M19.5 9.8v4.4M7.5 12h9" /></g></symbol>
        <symbol id="i-vitality" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12 20s-7.2-4.6-7.2-9.7A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.2 3.1C19.2 15.4 12 20 12 20z" /></symbol>
        <symbol id="i-intellect" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 6.2C10 4.6 7 4.2 4 4.7V18.4c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.7c-3-.5-6-.1-8 1.5z" /><path d="M12 6.2v13.7" /></g></symbol>
        <symbol id="i-focusattr" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.4" /></g></symbol>
        <symbol id="i-discipline" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12 3l7 2.5v5.6c0 4.9-3 7.9-7 9.9-4-2-7-5-7-9.9V5.5z" /></symbol>
        <symbol id="i-craft" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M14.5 4.5l5 5L8.5 20.5H3.5v-5z" /><path d="M12.5 6.5l5 5" /></g></symbol>
        <symbol id="i-connection" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.8-3 2.9-4.6 5.5-4.6s4.7 1.6 5.5 4.6" /><circle cx="17" cy="9.5" r="2.2" /><path d="M16.2 14.6c2.1.3 3.6 1.6 4.3 3.9" /></g></symbol>
        <symbol id="i-exploration" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M15 9l-1.8 4.5L8.8 15.2l1.8-4.5z" /></g></symbol>
        <symbol id="i-level" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" /></g></symbol>
        <symbol id="i-trophy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0z" /><path d="M8 5.5H4.5A3.5 3.5 0 0 0 8 9M16 5.5h3.5A3.5 3.5 0 0 1 16 9" /><path d="M12 14v3M8.5 20h7M10 17h4" /></g></symbol>
      </defs>
    </svg>
  );
}
