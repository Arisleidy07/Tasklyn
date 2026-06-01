// Premium date utilities for Tasklyn

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DAYS_SHORT = ["D", "L", "M", "M", "J", "V", "S"];
const DAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function formatDate(
  dateStr: string,
  opts?: { short?: boolean; withYear?: boolean },
): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff === 7) return "Próxima semana";

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  if (opts?.short) return `${day} ${month.slice(0, 3)}`;
  if (opts?.withYear) return `${day} de ${month}, ${date.getFullYear()}`;
  return `${day} de ${month}`;
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDateTime(
  dateStr: string,
  timeStr?: string | null,
): string {
  const date = formatDate(dateStr);
  if (!timeStr) return date;
  return `${date} · ${formatTime(timeStr)}`;
}

export function getDueStatus(
  dueDate?: string | null,
  dueTime?: string | null,
): "overdue" | "dueSoon" | "upcoming" | "noDue" {
  if (!dueDate) return "noDue";
  const now = new Date();
  const due = new Date(dueDate + (dueTime ? `T${dueTime}` : "T23:59:59"));
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) return "overdue";
  if (diffHours <= 24) return "dueSoon";
  return "upcoming";
}

export function generateCalendarDays(
  year: number,
  month: number,
): {
  date: number;
  currentMonth: boolean;
  fullDate: string;
}[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const days: { date: number; currentMonth: boolean; fullDate: string }[] = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const date = new Date(year, month - 1, d);
    days.push({ date: d, currentMonth: false, fullDate: toISODate(date) });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({ date: d, currentMonth: true, fullDate: toISODate(date) });
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({ date: d, currentMonth: false, fullDate: toISODate(date) });
  }

  return days;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export { MONTHS, DAYS_SHORT, DAYS_FULL };
