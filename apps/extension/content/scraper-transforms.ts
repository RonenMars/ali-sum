export function parsePrice(text: string): number {
  // Strip everything except digits and the last decimal separator
  const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export function parseCurrency(text: string): string {
  if (/US\s*\$|USD/.test(text)) return "USD";
  if (/€|EUR/.test(text)) return "EUR";
  if (/£|GBP/.test(text)) return "GBP";
  if (/¥|CNY|JPY/.test(text)) return "CNY";
  if (/₪|ILS|NIS/.test(text)) return "ILS";
  // Fallback: grab first uppercase letter sequence
  const m = text.match(/([A-Z]{3})/);
  return m ? m[1] : "USD";
}

export function parseOrderDate(text: string): string {
  // Input: "Order date: Jan 01, 2024" or "Jan 01, 2024" or similar
  const cleaned = text.replace(/Order\s+date[:\s]*/i, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function parseOrderId(text: string): string {
  return text
    .replace(/Order\s+ID[:\s]*/i, "")
    .replace(/Copy/gi, "")
    .trim();
}

export function parseOrderIdFromUrl(url: string): string {
  try {
    return new URL(url).searchParams.get("orderId") || "";
  } catch {
    return "";
  }
}

export function cleanImageUrl(url: string): string {
  // Normalize AliExpress CDN image URLs to a consistent thumbnail size
  // and strip query parameters for cleaner storage.
  try {
    const u = new URL(url);
    u.search = "";
    // Normalize to 640x640 for consistent quality
    return u.toString().replace(/_\d+x\d+\.\w+$/, "_640x640.jpg");
  } catch {
    return url;
  }
}

export type TransformName =
  | "parseOrderId"
  | "parseOrderIdFromUrl"
  | "parseOrderDate"
  | "parsePrice"
  | "parseCurrency"
  | "cleanImageUrl";

export const transforms: Record<TransformName, (input: string) => string | number> = {
  parseOrderId,
  parseOrderIdFromUrl,
  parseOrderDate,
  parsePrice,
  parseCurrency,
  cleanImageUrl,
};
