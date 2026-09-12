export function toDayKey(d: Date = new Date()): string {
  // UTC day key YYYY-MM-DD — streaks computed server-side on UTC day boundaries.
  return d.toISOString().slice(0, 10);
}

export function addDays(dayKey: string, delta: number): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00.000Z`).getTime();
  const db = new Date(`${b}T00:00:00.000Z`).getTime();
  return Math.round((db - da) / 86_400_000);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function paginate(query: { limit?: unknown; cursor?: unknown }) {
  const limit = clamp(Number(query.limit ?? 20) || 20, 1, 100);
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  return { limit, cursor };
}
