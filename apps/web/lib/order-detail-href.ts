/** Search-param key used to drive the Order Detail drawer/page. */
export const ORDER_DETAIL_PARAM = "order";

/**
 * Build a URL that opens the Order Detail drawer for a given internal order id,
 * preserving the rest of the current query string. Pass `null` to construct a
 * "close" URL (drops the order param).
 */
export function withOrderDetailParam(
  pathname: string,
  currentSearch: string | URLSearchParams,
  orderId: string | null
): string {
  const params =
    currentSearch instanceof URLSearchParams
      ? new URLSearchParams(currentSearch)
      : new URLSearchParams(currentSearch);
  if (orderId) params.set(ORDER_DETAIL_PARAM, orderId);
  else params.delete(ORDER_DETAIL_PARAM);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
