/** Canonical URL for opening an order on AliExpress. */
export function aliOrderDetailUrl(aliOrderId: string): string {
  return `https://www.aliexpress.com/p/order/detail.html?orderId=${encodeURIComponent(aliOrderId)}`;
}

/** Standard props for any anchor that opens an AliExpress order page. */
export const ALI_ORDER_LINK_PROPS = {
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
};
