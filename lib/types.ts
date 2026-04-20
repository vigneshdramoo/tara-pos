import type { PaymentMethod } from "@prisma/client";

export type ProductCardData = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  collection: string;
  description: string;
  notes: string;
  mood: string;
  sizeMl: number;
  priceCents: number;
  stock: number;
  reorderLevel: number;
  accentHex: string;
};

export type RecentCustomerOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lastPurchaseAt: string | null;
  lifetimeValueCents: number;
};

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CheckoutPayload = {
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  notes?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
};

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type SalesTrendPoint = {
  label: string;
  salesCents: number;
  orders: number;
};

export type TopProductInsight = {
  id: string;
  name: string;
  collection: string;
  quantitySold: number;
  revenueCents: number;
  stock: number;
  reorderLevel: number;
  accentHex: string;
};

export type LowStockInsight = {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  recommendedRestock: number;
  accentHex: string;
};

export type RecentOrderInsight = {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  createdAt: string;
  itemCount: number;
};

export type DashboardData = {
  stats: DashboardStat[];
  salesTrend: SalesTrendPoint[];
  topProducts: TopProductInsight[];
  lowStockProducts: LowStockInsight[];
  recentOrders: RecentOrderInsight[];
};

export type CustomerInsight = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  ordersCount: number;
  lifetimeValueCents: number;
  lastPurchaseAt: string | null;
};

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  createdAt: string;
  customerName: string;
  notes: string | null;
  itemSummary: Array<{
    productName: string;
    quantity: number;
    totalPriceCents: number;
  }>;
};

export type AssistantReply = {
  prompt: string;
  reply: string;
  restocks: LowStockInsight[];
};
