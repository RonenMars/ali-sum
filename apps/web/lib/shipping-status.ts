export type ShippingStatusInfo = {
  label: string;
  className: string;
};

// Maps AliExpress order status strings (case-insensitive substring match) to
// display label + Tailwind color classes for the badge.
const STATUS_MAP: Array<{ patterns: RegExp; label: string; className: string }> = [
  {
    patterns: /payment\s*pending|awaiting\s*payment|unpaid/i,
    label: "Payment Pending",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    patterns: /payment\s*accepted|paid|payment\s*complete/i,
    label: "Payment Accepted",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    patterns: /processing|preparing|seller\s*ship/i,
    label: "Processing",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    patterns: /shipped|dispatched/i,
    label: "Shipped",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    patterns: /in\s*transit|on\s*the\s*way/i,
    label: "In Transit",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    patterns: /out\s*for\s*delivery|delivering/i,
    label: "Out for Delivery",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    patterns: /delivered|order\s*complete|completed|received/i,
    label: "Delivered",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    patterns: /return|refund/i,
    label: "Return / Refund",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    patterns: /cancel/i,
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  },
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
