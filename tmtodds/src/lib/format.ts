// Small, dependency-free date helpers used across the UI. Everything
// is stored as UTC ISO timestamps in the database; these just format
// them for display in the visitor's local time.

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${weekday} ${time}`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
