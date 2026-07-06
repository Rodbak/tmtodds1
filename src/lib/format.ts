// Small, dependency-free date helpers used across the UI. Everything
// is stored as UTC ISO timestamps in the database; these just format
// them for display in the visitor's local time.

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// "Today 15:00" / "Tomorrow 20:00" / "Sun 15:00" -- matches how the
// board and ledger reference kickoff times throughout the design.
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  if (isSameDay(d, now)) return `Today ${time}`;
  if (isSameDay(d, addDays(now, 1))) return `Tomorrow ${time}`;
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${time}`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
