import type { EconomicCalendarEvent } from "@/data/economicCalendar2026";

const MONTH_BY_NAME: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12"
};

export type EconomicCalendarSpreadsheetRow = {
  date?: string | null;
  time?: string | number | null;
  currency?: string | null;
  event?: string | null;
};

function normalizeDateText(dateText: string, year: number) {
  const match = dateText
    .trim()
    .match(/^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*)?([A-Za-z]{3,9})\s*(\d{1,2})$/i);

  if (!match) {
    throw new Error(`Unsupported economic calendar date: ${dateText}`);
  }

  const month = MONTH_BY_NAME[match[1].toLowerCase()];

  if (!month) {
    throw new Error(`Unsupported economic calendar month: ${match[1]}`);
  }

  return `${year}-${month}-${match[2].padStart(2, "0")}`;
}

export function normalizeExcelTimeFraction(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  let minutes = Math.round((numericValue % 1) * 24 * 60);

  if (minutes >= 24 * 60) {
    minutes = 0;
  }

  const hours = Math.floor(minutes / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function normalizeEconomicCalendarRows(
  rows: EconomicCalendarSpreadsheetRow[],
  year = 2026
): EconomicCalendarEvent[] {
  let currentDate: string | null = null;
  const events: EconomicCalendarEvent[] = [];

  for (const row of rows) {
    const dateText = row.date?.trim();

    if (dateText) {
      currentDate = normalizeDateText(dateText, year);
    }

    const event = row.event?.trim();

    if (!event || !currentDate) {
      continue;
    }

    const currency = row.currency?.trim() || null;

    events.push({
      date: currentDate,
      time: normalizeExcelTimeFraction(row.time),
      currency,
      event
    });
  }

  return events;
}

function getTimeSortValue(time: string | null) {
  if (!time) {
    return Number.POSITIVE_INFINITY;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function compareEconomicCalendarEvents(
  first: EconomicCalendarEvent,
  second: EconomicCalendarEvent
) {
  return getTimeSortValue(first.time) - getTimeSortValue(second.time);
}

export function getEconomicCalendarEventsForDate(
  events: EconomicCalendarEvent[],
  selectedDate: string
) {
  return events
    .filter((event) => event.date === selectedDate)
    .sort(compareEconomicCalendarEvents);
}
