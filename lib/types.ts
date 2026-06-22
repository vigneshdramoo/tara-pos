import type { CheckoutPromotionId } from "@/lib/checkout-pricing";
import type { StaffRole } from "@/lib/staff";
import type { StaffCommissionProgress } from "@/lib/commissions";
import type {
  InventoryMovementType,
  OrderStatus,
  OrderVoidInventoryAction,
  PaymentMethod,
  PurchaseIntent,
  QuizLeadSource,
} from "@prisma/client";

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
  imageUrl: string | null;
};

export type ProductVariantOption = {
  label: string;
  product: ProductCardData;
};

export type ProductFamilyCardData = {
  id: string;
  slug: string;
  name: string;
  collection: string;
  description: string;
  notes: string;
  mood: string;
  accentHex: string;
  imageUrl: string | null;
  options: ProductVariantOption[];
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
  promotionId?: CheckoutPromotionId;
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
  comparison?: string;
  tone?: "default" | "positive" | "warning" | "muted";
};

export type SalesTrendPoint = {
  key: string;
  label: string;
  salesCents: number;
  orders: number;
  isToday: boolean;
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
  salespersonName: string | null;
  paymentMethod: PaymentMethod;
  totalCents: number;
  commissionCents: number;
  createdAt: string;
  itemCount: number;
};

export type PromotionInsight = {
  id: string;
  label: string;
  detail: string;
  orders: number;
  revenueCents: number;
  highlight: string;
};

export type Stop04CheckpointStatus = "met" | "behind" | "pending";

export type Stop04CheckpointProgress = {
  id: string;
  label: string;
  targetLabel: string;
  dueAt: string;
  targetPercent: number;
  targetUnits: number;
  soldUnits: number;
  unitsGap: number;
  status: Stop04CheckpointStatus;
};

export type Stop04OfferMixInsight = {
  label: string;
  count: number;
  units: number;
};

export type Stop04ScentMixInsight = {
  name: string;
  units: number;
};

export type Stop04StrategyProgress = {
  label: string;
  eventWindow: string;
  booth: string;
  activePromotionId: CheckoutPromotionId;
  openingEightMlUnits: number;
  soldEightMlUnits: number;
  remainingEightMlUnits: number;
  sellThroughPercent: number;
  orderCount: number;
  strategyOrderCount: number;
  eventRevenueCents: number;
  strategyRevenueCents: number;
  averageOrderCents: number;
  currentCheckpoint: Stop04CheckpointProgress;
  checkpoints: Stop04CheckpointProgress[];
  offerMix: Stop04OfferMixInsight[];
  scentMix: Stop04ScentMixInsight[];
  nextAction: string;
};

export type DashboardData = {
  stats: DashboardStat[];
  salesTrend: SalesTrendPoint[];
  topProducts: TopProductInsight[];
  lowStockProducts: LowStockInsight[];
  recentOrders: RecentOrderInsight[];
  promotionInsights: PromotionInsight[];
  stop04Progress: Stop04StrategyProgress | null;
  databaseIssue?: string;
};

export type PosData = {
  products: ProductCardData[];
  recentCustomers: RecentCustomerOption[];
  databaseIssue?: string;
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

export type CustomersData = {
  customers: CustomerInsight[];
  databaseIssue?: string;
};

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  commissionCents: number;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  voidedByName: string | null;
  voidInventoryAction: OrderVoidInventoryAction | null;
  customerName: string;
  customerSocialHandle: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  salespersonName: string | null;
  notes: string | null;
  itemSummary: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    productSizeMl: number;
    productStock: number;
    productReorderLevel: number;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
    commissionCents: number;
  }>;
};

export type OrderAmendmentProduct = {
  id: string;
  name: string;
  sku: string;
  sizeMl: number;
  priceCents: number;
  stock: number;
  reorderLevel: number;
};

export type OrdersData = {
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  orders: OrderHistoryItem[];
  databaseIssue?: string;
};

export type AssistantReply = {
  prompt: string;
  reply: string;
  restocks: LowStockInsight[];
};

export type InventoryAdminProduct = ProductCardData & {
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementInsight = {
  id: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantityDelta: number;
  note: string | null;
  createdAt: string;
  orderNumber: string | null;
};

export type InventoryAdminData = {
  products: InventoryAdminProduct[];
  recentMovements: InventoryMovementInsight[];
  databaseIssue?: string;
};

export type StaffUserInsight = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: StaffRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  commissionProgress: StaffCommissionProgress;
};

export type StaffUsersData = {
  staffUsers: StaffUserInsight[];
  databaseIssue?: string;
};

export type QuizLeadInsight = {
  id: string;
  leadNumber: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ageRange: string | null;
  genderIdentity: string | null;
  city: string | null;
  eventName: string | null;
  source: QuizLeadSource;
  resultScent: string;
  secondaryScent: string | null;
  purchaseIntent: PurchaseIntent;
  marketingConsent: boolean;
  notes: string | null;
  convertedCustomerId: string | null;
  convertedCustomerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuizLeadsData = {
  leads: QuizLeadInsight[];
  databaseIssue?: string;
};
