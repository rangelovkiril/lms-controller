export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toLocal(iso: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    min: d.getMinutes(),
  };
}

export function fromParts(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
): string {
  return `${y}-${pad(m + 1)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}
