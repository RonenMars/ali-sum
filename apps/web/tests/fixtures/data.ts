export const TEST_USER = {
  email: "test@playwright.dev",
  password: "Test1234!",
  name: "Test User",
};

// 10 orders seeded within the last 30 days from 2026-04-14
// so they all appear in the dashboard's default "last 30 days" view.
export const SEED_ORDERS = [
  {
    aliOrderId: "ORDER001",
    orderDate: new Date("2026-04-14"),
    totalAmount: 45.99,
    currency: "USD",
    status: "completed",
    sellerName: "GreatStore",
    shippingCost: 0,
    items: [{ title: "Wireless Mouse", price: 45.99, quantity: 1, category: "Electronics" }],
  },
  {
    aliOrderId: "ORDER002",
    orderDate: new Date("2026-04-10"),
    totalAmount: 23.50,
    currency: "USD",
    status: "completed",
    sellerName: "TechShop",
    shippingCost: 0,
    items: [
      { title: "USB Cable", price: 8.50, quantity: 1, category: "Electronics" },
      { title: "Phone Stand", price: 15.00, quantity: 1, category: "Accessories" },
    ],
  },
  {
    aliOrderId: "ORDER003",
    orderDate: new Date("2026-04-05"),
    totalAmount: 89.99,
    currency: "USD",
    status: "shipped",
    sellerName: "FancyGoods",
    shippingCost: 2.99,
    items: [{ title: "Smartwatch Band", price: 89.99, quantity: 1, category: "Accessories" }],
  },
  {
    aliOrderId: "ORDER004",
    orderDate: new Date("2026-03-30"),
    totalAmount: 12.75,
    currency: "USD",
    status: "completed",
    sellerName: "BudgetDeals",
    shippingCost: 0,
    items: [{ title: "Keychain Set", price: 12.75, quantity: 3, category: "Accessories" }],
  },
  {
    aliOrderId: "ORDER005",
    orderDate: new Date("2026-03-25"),
    totalAmount: 156.00,
    currency: "USD",
    status: "completed",
    sellerName: "GreatStore",
    shippingCost: 0,
    items: [{ title: "Bluetooth Speaker", price: 78.00, quantity: 2, category: "Electronics" }],
  },
  {
    aliOrderId: "ORDER006",
    orderDate: new Date("2026-03-22"),
    totalAmount: 34.20,
    currency: "USD",
    status: "completed",
    sellerName: "QuickShip",
    shippingCost: 1.50,
    items: [{ title: "LED Strip Lights", price: 34.20, quantity: 1, category: "Home" }],
  },
  {
    aliOrderId: "ORDER007",
    orderDate: new Date("2026-03-19"),
    totalAmount: 67.50,
    currency: "USD",
    status: "shipped",
    sellerName: "TechShop",
    shippingCost: 0,
    items: [{ title: "Mechanical Keyboard", price: 67.50, quantity: 1, category: "Electronics" }],
  },
  {
    aliOrderId: "ORDER008",
    orderDate: new Date("2026-03-18"),
    totalAmount: 19.99,
    currency: "USD",
    status: "completed",
    sellerName: "BudgetDeals",
    shippingCost: 0,
    items: [
      { title: "Phone Case", price: 9.99, quantity: 1, category: "Accessories" },
      { title: "Screen Protector", price: 10.00, quantity: 1, category: "Accessories" },
    ],
  },
  {
    aliOrderId: "ORDER009",
    orderDate: new Date("2026-03-17"),
    totalAmount: 103.45,
    currency: "USD",
    status: "processing",
    sellerName: "FancyGoods",
    shippingCost: 3.45,
    items: [{ title: "Portable Charger", price: 103.45, quantity: 1, category: "Electronics" }],
  },
  {
    aliOrderId: "ORDER010",
    orderDate: new Date("2026-03-15"),
    totalAmount: 8.50,
    currency: "USD",
    status: "completed",
    sellerName: "QuickShip",
    shippingCost: 0,
    items: [{ title: "Cable Organizer", price: 8.50, quantity: 2, category: "Home" }],
  },
];

// Derived totals for use in assertions
export const TOTAL_ORDERS = SEED_ORDERS.length; // 10
export const TOTAL_SPENT = SEED_ORDERS.reduce((sum, o) => sum + o.totalAmount, 0); // 561.87
export const TOTAL_ITEMS = SEED_ORDERS.reduce((sum, o) => sum + o.items.length, 0); // 12
