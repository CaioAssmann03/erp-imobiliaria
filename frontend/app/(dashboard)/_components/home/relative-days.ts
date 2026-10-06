const DAY = 86_400_000;

export { formatDate } from "@/lib/format";

/** "em 9 dias" / "hoje" / "há 12 dias", a partir de uma data ISO (AAAA-MM-DD). */
export function relativeDays(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / DAY);
  if (days === 0) return "hoje";
  return days > 0 ? `em ${days} dia${days > 1 ? "s" : ""}` : `há ${-days} dia${days < -1 ? "s" : ""}`;
}
