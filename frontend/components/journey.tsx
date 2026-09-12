"use client";

import { EnvStack, Icon } from "@/components/illustrations";

export interface JourneyMilestone {
  name: string;
  done?: boolean;
  current?: boolean;
}

const YS = [78, 60, 64, 42, 66];

/** Dotted journey path with milestone nodes. Positions spread to fit any count. */
export function JourneyPath({ items, tall }: { items: JourneyMilestone[]; tall?: boolean }) {
  if (items.length === 0) return null;
  const n = items.length;
  const xs = n === 1 ? [50] : items.map((_, i) => 6 + (i * 88) / (n - 1));
  const ys = items.map((_, i) => YS[i % YS.length]);
  const segs: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    segs.push(`M${x1} ${y1} Q ${(x1 + x2) / 2} ${y1 - 14}, ${x2} ${y2}`);
  }
  return (
    <div className={`journey${tall ? " world-journey" : ""}`} style={tall ? { height: 110 } : undefined}>
      <svg className="path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {segs.map((d, i) => (
          <path key={i} className={items[i].done ? "path-line-done" : "path-line"} d={d} style={{ vectorEffect: "non-scaling-stroke" } as React.CSSProperties} />
        ))}
      </svg>
      {items.map((m, i) => (
        <div
          key={i}
          className={`j-node${m.done ? " done" : ""}${m.current ? " current" : ""}`}
          style={{ left: `${xs[i]}%`, top: `${ys[i]}%` }}
        >
          <span className="j-dot">{m.done ? <Icon id="i-check" /> : null}</span>
          <span className="j-label">{m.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Compact campaign preview card (Today sidebar). */
export function CampaignPreview({
  title,
  theme,
  progressPct,
  milestones,
  nextText,
  onOpen,
}: {
  title: string;
  theme?: string;
  progressPct: number;
  milestones: JourneyMilestone[];
  nextText: string;
  onOpen: () => void;
}) {
  return (
    <div className="campaign-preview panel">
      <div className="cp-env">
        <EnvStack />
      </div>
      <div className="cp-body">
        <div className="sec-head" style={{ margin: 0 }}>
          <div>
            <h4>{title}</h4>
            <p className="cp-sub">
              {theme ? `${theme} · ` : ""}
              {progressPct}% complete
            </p>
          </div>
          <button className="link-btn" onClick={onOpen} aria-label={`Open ${title}`}>
            <Icon id="i-arrow-r" />
          </button>
        </div>
        <JourneyPath items={milestones} />
        <div className="cp-next">
          <Icon id="i-spark" />
          <span>{nextText}</span>
        </div>
      </div>
    </div>
  );
}

/** Full-width campaign world panel (Campaigns page hero). */
export function WorldPanel({
  title,
  theme,
  desc,
  milestones,
  nextText,
  onWork,
}: {
  title: string;
  theme?: string;
  desc?: string;
  milestones: JourneyMilestone[];
  nextText: string;
  onWork: () => void;
}) {
  return (
    <div className="world-panel">
      <div className="world-env">
        <EnvStack />
      </div>
      <div className="world-body">
        <div className="world-head">
          <div>
            {theme && <span className="tag">{theme}</span>}
            <h3 style={{ marginTop: theme ? 10 : 0 }}>{title}</h3>
            {desc && <p className="wsub">{desc}</p>}
          </div>
          <button className="btn btn--primary" onClick={onWork}>
            Work on this
          </button>
        </div>
        <JourneyPath items={milestones} tall />
        <div className="cp-next">
          <Icon id="i-spark" />
          <span>{nextText}</span>
        </div>
      </div>
    </div>
  );
}

/** Small campaign card for the journeys grid. */
export function WorldCard({
  title,
  meta,
  progressPct,
  onOpen,
}: {
  title: string;
  meta: string;
  progressPct: number;
  onOpen: () => void;
}) {
  return (
    <div className="world-card" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}>
      <div className="wc-env">
        <EnvStack />
      </div>
      <div className="wc-body">
        <h4>{title}</h4>
        <div className="wc-meta">{meta}</div>
        <div className="wc-prog">
          <i style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
        </div>
      </div>
    </div>
  );
}
