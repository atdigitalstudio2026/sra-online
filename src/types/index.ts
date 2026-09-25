export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  short_description: string | null;
  category_id: string;
  brand_id: string | null;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  minimum_selling_price?: number | null;
  minimum_margin_percentage?: number | null;
  weight: number; // in grams or kg depending on unit
  unit: string;   // e.g. "kg", "gram", "karung", "dus", "pack"
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  price_tiers?: ProductPrice[];
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  category?: Category | null;
  brand?: Brand | null;
  images?: ProductImage[];
  primary_image?: string;
}

export type SortField = 'created_at' | 'name' | 'price';
export type SortOrder = 'asc' | 'desc';

export interface ProductFilterParams {
  search?: string;
  category_slug?: string;
  category_id?: string;
  brand_id?: string;
  min_price?: number;
  max_price?: number;
  stock_status?: 'all' | 'in_stock' | 'out_of_stock' | 'low_stock';
  is_active?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  sort_by?: SortField;
  sort_order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_brands: number;
  active_products: number;
  low_stock_products: number;
}

export type CartStatus = 'active' | 'converted' | 'abandoned';

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithProduct extends CartItem {
  product: ProductWithDetails;
  hasPriceChanged?: boolean;
  previousPrice?: number;
  currentPrice?: number;
  hasStockChanged?: boolean;
  maxAvailableStock?: number;
  isUnavailable?: boolean;
}

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
  total_items: number; // total quantity
  subtotal: number;
}

export interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  brand_id: string;
  short_description: string;
  description: string;
  price: number;
  compare_price?: number | null;
  cost_price?: number | null;
  weight: number;
  unit: string;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  images: {
    id?: string;
    image_url: string;
    alt_text?: string;
    sort_order: number;
    is_primary: boolean;
    file?: File;
  }[];
}

// ==============================================================================
// TAHAP 3 — CHECKOUT & ORDER SYSTEM TYPES
// ==============================================================================

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string; // 'Rumah' | 'Kantor' | 'Gudang' | etc.
  recipient_name: string;
  phone: string;
  address_line: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
  delivery_note?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string; // 'REG' | 'EXP' | 'CARGO'
  description: string;
  price: number;
  estimated_days: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  guest_token?: string | null;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  shipping_province: string;
  shipping_city: string;
  shipping_district: string;
  shipping_subdistrict: string;
  shipping_postal_code: string;
  delivery_note?: string | null;
  shipping_method_id: string;
  shipping_method_name: string;
  shipping_cost: number;
  subtotal: number;
  discount: number;
  product_discount?: number;
  voucher_discount?: number;
  shipping_discount?: number;
  applied_voucher_code?: string | null;
  customer_price_level_code?: string;
  grand_total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string | null;
  unit_price: number; // Final effective unit price
  original_unit_price?: number;
  discount_amount?: number;
  final_unit_price?: number;
  promotion_id?: string | null;
  voucher_id?: string | null;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  note?: string | null;
  created_at: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  history?: OrderStatusHistory[];
  shipping_method?: ShippingMethod | null;
  payments?: PaymentRecord[];
  latest_payment?: PaymentRecord | null;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address_line: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
  delivery_note?: string;
  shipping_method_id: string;
  save_address?: boolean;
  address_label?: string;
}

// ==============================================================================
// TAHAP 4 — PAYMENT GATEWAY & PAYMENT VERIFICATION TYPES
// ==============================================================================

export type PaymentAttemptStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export interface PaymentRecord {
  id: string;
  order_id: string;
  provider: string; // 'midtrans' | 'xendit' | 'manual' | 'simulator'
  provider_transaction_id?: string | null;
  payment_method?: string | null; // e.g. 'bank_transfer', 'qris', 'credit_card', 'bca_va'
  amount: number;
  currency: string;
  status: PaymentAttemptStatus;
  payment_url?: string | null;
  payment_token?: string | null;
  expires_at?: string | null;
  paid_at?: string | null;
  failure_reason?: string | null;
  raw_response?: any | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodConfig {
  id: string;
  code: string;
  name: string;
  provider: string;
  description?: string | null;
  icon_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentParams {
  order_id: string;
  payment_method_code?: string;
  customer_details?: {
    first_name: string;
    email?: string;
    phone: string;
  };
}

export interface CreatePaymentResult {
  success: boolean;
  payment_id: string;
  order_id: string;
  order_number: string;
  amount: number;
  currency: string;
  provider: string;
  payment_token?: string;
  payment_url?: string;
  expires_at?: string;
  payment_method?: string;
  status: PaymentAttemptStatus;
  message?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  order_id: string;
  payment_id: string;
  status: PaymentAttemptStatus;
  order_payment_status: PaymentStatus;
  paid_at?: string | null;
  failure_reason?: string | null;
  raw_response?: any;
}

// ==============================================================================
// TAHAP 6 — ADMIN, CUSTOMER MANAGEMENT, SALES ANALYTICS & INVENTORY
// ==============================================================================

export type AdminRole = 'super_admin' | 'admin' | 'staff';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface AdminUser {
  id: string;
  user_id?: string | null;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type InventoryMovementType =
  | 'sale'
  | 'reservation'
  | 'release'
  | 'adjustment'
  | 'restock'
  | 'return';

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: InventoryMovementType;
  quantity: number; // positive for addition, negative for reduction
  reference_type?: string | null; // 'order', 'manual_adjustment', 'restock_batch'
  reference_id?: string | null;   // e.g. ORD-20260925-0001
  previous_stock: number;
  new_stock: number;
  note?: string | null;
  created_by: string;
  created_at: string;
  product_name?: string;
  product_sku?: string;
}

export interface AdminAuditLog {
  id: string;
  user_id?: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string | null;
  created_at: string;
}

export type NotificationType =
  | 'new_order'
  | 'payment_received'
  | 'low_stock'
  | 'shipment_issue';

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | '12m'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all'
  | 'custom';

export interface DateFilterRange {
  preset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface SalesSummary {
  gross_sales: number;
  discounts: number;
  shipping_revenue: number;
  net_sales: number;
  total_orders: number;
  valid_orders: number;
  cancelled_orders: number;
  items_sold: number;
  average_order_value: number;
  today_sales: number;
  this_week_sales: number;
  this_month_sales: number;
  this_year_sales: number;
  pending_payments_count: number;
  orders_to_process_count: number;
  orders_to_ship_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_customers_count: number;
  total_products_count: number;
  order_status_counts: Record<OrderStatus, number>;
  payment_status_counts: Record<PaymentAttemptStatus, number>;
  shipping_status_counts?: Record<string, number>;
}

export interface DailySalesRow {
  date: string;
  orders: number;
  items_sold: number;
  gross_sales: number;
  discount: number;
  shipping: number;
  net_sales: number;
}

export interface MonthlySalesRow {
  month: string;
  orders: number;
  items_sold: number;
  gross_sales: number;
  discount: number;
  net_sales: number;
}

export interface YearlySalesRow {
  year: string;
  orders: number;
  items_sold: number;
  gross_sales: number;
  discount: number;
  net_sales: number;
}

export interface ProductPerformanceItem {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  brand_name: string;
  units_sold: number;
  revenue: number;
  orders_count: number;
  average_selling_price: number;
}

export interface SalesOverTimePoint {
  date: string;
  label: string;
  sales: number;
  orders: number;
}

export interface TopSellingProduct {
  rank: number;
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name: string;
  units_sold: number;
  revenue: number;
}

export interface CategoryAnalytics {
  category_id: string;
  category_name: string;
  products_sold: number;
  revenue: number;
  orders_count: number;
  percentage_of_sales: number;
}

export interface BrandAnalytics {
  brand_id: string;
  brand_name: string;
  units_sold: number;
  revenue: number;
  orders_count: number;
}

export type CustomerSegmentation = 'new' | 'active' | 'repeat' | 'inactive';

export interface CustomerMetric {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spending: number;
  average_order_value: number;
  last_order_date?: string | null;
  segmentation: CustomerSegmentation;
  status: 'active' | 'inactive';
  registration_date: string;
}

export interface CustomerDetailWithOrders extends CustomerMetric {
  orders: OrderWithDetails[];
}

export interface InventoryStockItem {
  product: ProductWithDetails;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// ==============================================================================
// TAHAP 7 — PROMOTION ENGINE, VOUCHER, DISCOUNT & B2B / WHOLESALE PRICING
// ==============================================================================

export type CustomerPriceLevelCode = 'RETAIL' | 'RESELLER' | 'WHOLESALE' | 'DISTRIBUTOR';

export interface CustomerPriceLevel {
  id: string;
  code: CustomerPriceLevelCode;
  name: string;
  description?: string | null;
  priority: number;
  min_order_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  price_level_id: string;
  price_level?: CustomerPriceLevel;
  price: number;
  min_quantity: number;
  max_quantity?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  price_level_id?: string | null;
  old_price?: number | null;
  new_price: number;
  changed_by: string;
  reason: string;
  created_at: string;
}

export type PromotionType =
  | 'percentage'
  | 'fixed_amount'
  | 'buy_x_get_y'
  | 'tier_discount'
  | 'free_shipping';

export interface Promotion {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  type: PromotionType;
  value: number; // e.g. 10 for 10%, 25000 for Rp25.000
  minimum_purchase: number;
  maximum_discount?: number | null;
  start_at: string;
  end_at: string;
  usage_limit?: number | null;
  usage_count: number;
  customer_usage_limit: number;
  is_active: boolean;
  priority: number;
  stackable: boolean;
  target_product_ids?: string[];
  target_category_ids?: string[];
  target_brand_ids?: string[];
  target_price_level_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface Voucher {
  id: string;
  promotion_id: string;
  code: string;
  description?: string | null;
  usage_limit?: number | null;
  usage_count: number;
  customer_usage_limit: number;
  minimum_purchase: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  promotion?: Promotion;
  created_at: string;
  updated_at: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_id: string;
  user_id?: string | null;
  order_id?: string | null;
  customer_identifier: string;
  discount_amount: number;
  redeemed_at: string;
}

export type B2BApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface B2BApplication {
  id: string;
  user_id?: string | null;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  business_type: string;
  tax_id?: string | null;
  estimated_monthly_purchase: number;
  notes?: string | null;
  requested_level: CustomerPriceLevelCode;
  assigned_price_level_id?: string | null;
  assigned_price_level?: CustomerPriceLevel;
  status: B2BApplicationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartPricedItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string | null;
  quantity: number;
  base_price: number;
  original_unit_price: number;
  discount_amount: number;
  final_unit_price: number;
  subtotal: number;
  applied_price_level?: CustomerPriceLevelCode;
  applied_tier_min?: number;
  applied_promotion_name?: string;
  promotion_id?: string;
}

export interface CartPriceCalculationResult {
  items: CartPricedItem[];
  original_subtotal: number;
  product_discount: number;
  voucher_discount: number;
  shipping_discount: number;
  subtotal: number; // original_subtotal - product_discount
  shipping_cost: number;
  grand_total: number;
  total_savings: number;
  applied_voucher: Voucher | null;
  applied_promotions: Promotion[];
  customer_price_level: CustomerPriceLevelCode;
  min_order_met: boolean;
  min_order_required?: number;
  warnings: string[];
}

export interface PromotionAnalyticsItem {
  promotion_id: string;
  promotion_name: string;
  promotion_code?: string;
  type: PromotionType;
  usage_count: number;
  total_discount_given: number;
  total_sales_generated: number;
  average_order_value: number;
}

export interface B2BSalesAnalytics {
  retail: { orders: number; revenue: number; units_sold: number; aov: number };
  reseller: { orders: number; revenue: number; units_sold: number; aov: number };
  wholesale: { orders: number; revenue: number; units_sold: number; aov: number };
  distributor: { orders: number; revenue: number; units_sold: number; aov: number };
}

export interface MarginAnalytics {
  net_sales: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_percentage: number;
}




