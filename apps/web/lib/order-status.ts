const TERMINAL_STATUS_PATTERNS = [
  /delivered/i,
  /order\s*complete/i,
  /completed/i,
  /received/i,
  /cancel/i,
  /refund/i,
] as const;

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUS_PATTERNS.some((pattern) => pattern.test(status.trim()));
}
