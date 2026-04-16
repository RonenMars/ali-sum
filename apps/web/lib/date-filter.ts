import { format, startOfWeek, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";

export const DATE_FILTER_STORAGE_KEY = "ali-sum:date-filter";
export const DEFAULT_DATE_PRESET = "This month";

export const DATE_PRESETS = [
  { label: "This week", getRange: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 7 days", getRange: () => ({ from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "This month", getRange: () => ({ from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 30 days", getRange: () => ({ from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 3 months", getRange: () => ({ from: format(subMonths(new Date(), 3), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "This year", getRange: () => ({ from: format(startOfYear(new Date()), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
];

/** Returns the date range for the default preset (evaluated at call time). */
export function getDefaultDateRange() {
  const preset = DATE_PRESETS.find((p) => p.label === DEFAULT_DATE_PRESET)!;
  return preset.getRange();
}
