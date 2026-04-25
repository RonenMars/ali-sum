export type ShippingStatusInfo = {
  label: string;
  className: string;
};

// Maps AliExpress order status strings (case-insensitive substring match) to
// display label + tone color classes for the badge. Callers wrap these in a
// pill (rounded-full + padding); only the bg/text tokens live here.
const TONE_WARNING = "bg-[color:var(--warning)]/15 text-[color:var(--warning)]";
const TONE_INFO = "bg-[color:var(--info)]/15 text-[color:var(--info)]";
const TONE_PRIMARY = "bg-[color:var(--accent-soft)] text-primary";
const TONE_POSITIVE = "bg-[color:var(--positive)]/15 text-[color:var(--positive)]";
const TONE_DESTRUCTIVE = "bg-destructive/15 text-destructive";
const TONE_MUTED = "bg-muted text-muted-foreground";

const STATUS_MAP: Array<{ patterns: RegExp; label: string; className: string }> = [
  { patterns: /payment\s*pending|awaiting\s*payment|unpaid/i, label: "Payment Pending", className: TONE_WARNING },
  { patterns: /payment\s*accepted|paid|payment\s*complete/i, label: "Payment Accepted", className: TONE_INFO },
  { patterns: /processing|preparing|seller\s*ship|ready\s*to\s*ship/i, label: "Processing", className: TONE_WARNING },
  { patterns: /shipped|dispatched/i, label: "Shipped", className: TONE_PRIMARY },
  { patterns: /in\s*transit|on\s*the\s*way|awaiting\s*delivery/i, label: "In Transit", className: TONE_PRIMARY },
  { patterns: /out\s*for\s*delivery|delivering/i, label: "Out for Delivery", className: TONE_PRIMARY },
  { patterns: /delivered|order\s*complete|completed|received/i, label: "Delivered", className: TONE_POSITIVE },
  { patterns: /return|refund/i, label: "Return / Refund", className: TONE_DESTRUCTIVE },
  { patterns: /cancel/i, label: "Cancelled", className: TONE_MUTED },
];

export function getShippingStatus(status: string): ShippingStatusInfo {
  for (const entry of STATUS_MAP) {
    if (entry.patterns.test(status)) {
      return { label: entry.label, className: entry.className };
    }
  }
  return {
    label: status,
    className: "bg-secondary text-secondary-foreground",
  };
}

// Canonical status keys used for filter UI
export const SHIPPING_STATUS_FILTERS = [
  "Payment Pending",
  "Payment Accepted",
  "Processing",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Return / Refund",
  "Cancelled",
] as const;
