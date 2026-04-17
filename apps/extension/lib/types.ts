export interface ScrapedOrderItem {
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  productUrl: string;
}

export interface ScrapedOrder {
  aliOrderId: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  sellerName: string;
  shippingCost: number;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  items: ScrapedOrderItem[];
}

export interface SyncProgress {
  status: "idle" | "syncing" | "completed" | "failed";
  currentPage: number;
  totalPages: number | null;
  ordersFound: number;
  error?: string;
  message?: string;
}

export interface SyncResult {
  created: number;
  skipped: number;
  syncLogId: string;
}

export type MessageType =
  | { type: "START_SYNC" }
  | { type: "SYNC_PROGRESS"; progress: SyncProgress }
  | { type: "SCRAPE_ORDERS" }
  | { type: "SCRAPE_RESULT"; orders: ScrapedOrder[]; hasNextPage: boolean }
  | { type: "LOAD_MORE" }
  | { type: "LOAD_MORE_RESULT"; loaded: boolean; hasNextPage: boolean }
  | { type: "SCRAPE_TRACKING_DETAIL" }
  | { type: "SCRAPE_TRACKING_DETAIL_RESULT"; trackingNumber?: string; carrier?: string; estimatedDelivery?: string }
  | { type: "GET_STATUS" }
  | { type: "STATUS"; lastSync: string | null; orderCount: number; connected: boolean };
