import { differenceInDays, format, parseISO, startOfDay } from "date-fns";

export function getDaysTogether(startDateStr: string): number {
  try {
    const start = startOfDay(parseISO(startDateStr));
    const now = startOfDay(new Date());
    const days = differenceInDays(now, start);
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

export function getYearsMonthsDays(startDateStr: string): { years: number; months: number; days: number } {
  try {
    const start = parseISO(startDateStr);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
  } catch {
    return { years: 0, months: 0, days: 0 };
  }
}

export function getDaysUntil(targetDateStr: string, isAnnual: boolean = true): number {
  try {
    const target = parseISO(targetDateStr);
    const now = startOfDay(new Date());
    
    if (isAnnual) {
      // Annual recurring date (anniversary, birthday, special day)
      const currentYearTarget = new Date(now.getFullYear(), target.getMonth(), target.getDate());
      if (currentYearTarget < now) {
        currentYearTarget.setFullYear(now.getFullYear() + 1);
      }
      return differenceInDays(currentYearTarget, now);
    } else {
      // Fixed event date
      const targetDay = startOfDay(target);
      return differenceInDays(targetDay, now);
    }
  } catch {
    return 0;
  }
}

export function getCountdownBadge(targetDateStr: string, type?: string): string {
  const isAnnual = !type || ['anniversary', 'birthday', 'special'].includes(type);
  const diff = getDaysUntil(targetDateStr, isAnnual);
  
  if (diff === 0) return "Today! 🎉";
  if (diff === 1) return "Tomorrow! 💖";
  if (diff > 1) return `${diff} days away`;
  return `${Math.abs(diff)} days ago`;
}

export function formatRomanticDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d");
  } catch {
    return dateStr;
  }
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning, love ♡";
  if (hour >= 12 && hour < 17) return "Good afternoon, darling ♡";
  if (hour >= 17 && hour < 22) return "Good evening, sweetheart ♡";
  return "Good night, angel ♡";
}
