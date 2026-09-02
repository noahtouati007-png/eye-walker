import { format, startOfWeek, differenceInCalendarDays, addWeeks } from "date-fns";

/** ISO week key "YYYY-Www" (Monday start). */
export function weekKey(date: Date = new Date()): string {
  return format(date, "RRRR-'W'II");
}

/** Monday of the week containing `date`. */
export function mondayOf(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function weekKeyOffset(baseDate: Date, offsetWeeks: number): string {
  return weekKey(addWeeks(baseDate, offsetWeeks));
}

export function todayISO(): string {
  return new Date().toISOString();
}

export function dayKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function calendarDayGap(fromISO: string, to: Date = new Date()): number {
  const from = new Date(fromISO);
  if (isNaN(from.getTime())) return Infinity;
  return differenceInCalendarDays(to, from);
}

export { format, addWeeks };
