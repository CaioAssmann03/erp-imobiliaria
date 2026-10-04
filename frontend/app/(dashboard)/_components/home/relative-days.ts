const DAY = 86_400_000;

/** "2025-03-31" → "31/03/2025" */
export function formatDate(iso: string) {
  return iso.split("-").reverse().join("/");
}

/** "em 9 dias" / "hoje" / "há 12 dias", a partir de uma data ISO (AAAA-MM-DD). */
export function relativeDays(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / DAY);
  if (days === 0) return "hoje";
  return days > 0 ? `em ${days} dia${days > 1 ? "s" : ""}` : `há ${-days} dia${days < -1 ? "s" : ""}`;
}
