export const TERMINAL_STATUSES = ["delivered", "cancelled", "refunded"] as const;

export function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status.trim().toLowerCase());
}
