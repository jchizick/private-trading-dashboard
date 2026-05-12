import { describe, expect, it } from "vitest";
import {
  getEconomicCalendarEventsForDate,
  normalizeEconomicCalendarRows,
  normalizeExcelTimeFraction
} from "@/lib/economicCalendar";
import type { EconomicCalendarEvent } from "@/data/economicCalendar2026";

describe("economic calendar normalization", () => {
  it("inherits the most recent non-empty date for blank spreadsheet rows", () => {
    const events = normalizeEconomicCalendarRows([
      { date: "FriMay 1", time: 0.4166666666666667, currency: "USD", event: "ISM Manufacturing PMI" },
      { date: "", time: "", currency: "USD", event: "ISM Manufacturing Prices" },
      { date: "SatMay 2", time: "", currency: "", event: "" }
    ]);

    expect(events).toEqual([
      {
        date: "2026-05-01",
        time: "10:00",
        currency: "USD",
        event: "ISM Manufacturing PMI"
      },
      {
        date: "2026-05-01",
        time: null,
        currency: "USD",
        event: "ISM Manufacturing Prices"
      }
    ]);
  });

  it("converts Excel time fractions to HH:mm values", () => {
    expect(normalizeExcelTimeFraction(0.4166666666666667)).toBe("10:00");
    expect(normalizeExcelTimeFraction("0.625")).toBe("15:00");
    expect(normalizeExcelTimeFraction("Feb Data")).toBeNull();
  });

  it("filters by selected dashboard date and sorts null-time events last", () => {
    const events: EconomicCalendarEvent[] = [
      { date: "2026-05-05", time: null, currency: "USD", event: "JOLTS Job Openings" },
      { date: "2026-05-04", time: "15:30", currency: "CAD", event: "BOC Gov Macklem Speaks" },
      { date: "2026-05-05", time: "10:00", currency: "USD", event: "ISM Services PMI" },
      { date: "2026-05-05", time: "01:30", currency: "AUD", event: "RBA Press Conference" }
    ];

    expect(getEconomicCalendarEventsForDate(events, "2026-05-05")).toEqual([
      { date: "2026-05-05", time: "01:30", currency: "AUD", event: "RBA Press Conference" },
      { date: "2026-05-05", time: "10:00", currency: "USD", event: "ISM Services PMI" },
      { date: "2026-05-05", time: null, currency: "USD", event: "JOLTS Job Openings" }
    ]);
  });
});
