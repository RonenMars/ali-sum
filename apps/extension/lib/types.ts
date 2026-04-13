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
  items: ScrapedOrderItem[];
}

export interface SyncProgress {
  status: "idle" | "syncing" | "completed" | "failed";
  currentPage: number;
  totalPages: number | null;
  ordersFound: number;
  error?: string;
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
  | { type: "GET_STATUS" }
  | { type: "STATUS"; lastSync: string | null; orderCount: number; connected: boolean };
