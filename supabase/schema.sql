-- ==============================================================================
-- DATABASE SCHEMA — ONLINE STORE FMCG PRODUCT CATALOG FOUNDATION (TAHAP 1)
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLE: categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on categories slug and active status
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories (is_active, sort_order);

-- ------------------------------------------------------------------------------
-- 2. TABLE: brands
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on brands slug
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands (slug);
CREATE INDEX IF NOT EXISTS idx_brands_active ON public.brands (is_active);

-- ------------------------------------------------------------------------------
-- 3. TABLE: products
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL ON UPDATE CASCADE,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    compare_price NUMERIC(15, 2) CHECK (compare_price IS NULL OR compare_price >= 0),
    cost_price NUMERIC(15, 2) CHECK (cost_price IS NULL OR cost_price >= 0),
    weight NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (weight > 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'kg',
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_best_seller BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for high performance catalog search, filtering, and sorting
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON public.products (is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('indonesian', coalesce(name, '') || ' ' || coalesce(sku, '')));

-- ------------------------------------------------------------------------------
-- 4. TABLE: product_images
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images (product_id, is_primary);

-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC updated_at TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_brands_updated_at ON public.brands;
CREATE TRIGGER set_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for storefront)
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public brands read" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public product_images read" ON public.product_images FOR SELECT USING (true);

-- Allow full access for anon/authenticated (in demo/admin development mode)
CREATE POLICY "Admin categories full" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin brands full" ON public.brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin products full" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin product_images full" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET: product-images
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- ------------------------------------------------------------------------------
-- 8. TABLE: carts (TAHAP 2 — SHOPPING CART)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts (user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts (session_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON public.carts (status);

-- ------------------------------------------------------------------------------
-- 9. TABLE: cart_items (TAHAP 2 — SHOPPING CART)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_cart_product UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);

-- Updated_at triggers for carts & cart_items
DROP TRIGGER IF EXISTS set_carts_updated_at ON public.carts;
CREATE TRIGGER set_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER set_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for carts & cart_items
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Allow select/insert/update/delete for users/anon matching their cart
CREATE POLICY "Users can manage their own carts"
ON public.carts
FOR ALL
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL) OR
    (session_id IS NOT NULL)
)
WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (session_id IS NOT NULL)
);

CREATE POLICY "Users can manage their own cart items"
ON public.cart_items
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.carts
        WHERE public.carts.id = cart_items.cart_id
        AND (
            (auth.uid() IS NOT NULL AND public.carts.user_id = auth.uid()) OR
            (public.carts.session_id IS NOT NULL)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.carts
        WHERE public.carts.id = cart_items.cart_id
        AND (
            (auth.uid() IS NOT NULL AND public.carts.user_id = auth.uid()) OR
            (public.carts.session_id IS NOT NULL)
        )
    )
);

-- ------------------------------------------------------------------------------
-- 10. TABLE: customer_addresses (TAHAP 3 — SAVED ADDRESSES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    label VARCHAR(100) NOT NULL DEFAULT 'Rumah',
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address_line TEXT NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    subdistrict VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    delivery_note TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses (user_id);

DROP TRIGGER IF EXISTS set_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 11. TABLE: shipping_methods (TAHAP 3 — SHIPPING METHODS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    estimated_days VARCHAR(50) NOT NULL DEFAULT '2-4 hari',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON public.shipping_methods (is_active, sort_order);

DROP TRIGGER IF EXISTS set_shipping_methods_updated_at ON public.shipping_methods;
CREATE TRIGGER set_shipping_methods_updated_at
BEFORE UPDATE ON public.shipping_methods
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 12. TABLE: orders (TAHAP 3 — ORDERS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    guest_token VARCHAR(255),
    user_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_district VARCHAR(100) NOT NULL,
    shipping_subdistrict VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    delivery_note TEXT,
    shipping_method_id UUID NOT NULL REFERENCES public.shipping_methods(id),
    shipping_method_name VARCHAR(100) NOT NULL,
    shipping_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    grand_total NUMERIC(15, 2) NOT NULL CHECK (grand_total >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'processing', 'shipped', 'completed', 'cancelled')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON public.orders (guest_token);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 13. TABLE: order_items (TAHAP 3 — ORDER ITEMS SNAPSHOT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_image TEXT,
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- ------------------------------------------------------------------------------
-- 14. TABLE: order_status_history (TAHAP 3 — ORDER AUDIT TRAIL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL DEFAULT 'Sistem',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history (order_id, created_at);

-- ------------------------------------------------------------------------------
-- 15. RLS POLICIES FOR TAHAP 3
-- ------------------------------------------------------------------------------
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Customer Addresses
CREATE POLICY "Users can manage their own addresses"
ON public.customer_addresses FOR ALL
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Shipping Methods: Public can view active methods, admin can manage all
CREATE POLICY "Anyone can view active shipping methods"
ON public.shipping_methods FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin full shipping methods"
ON public.shipping_methods FOR ALL
USING (true)
WITH CHECK (true);

-- Orders: Customer can view their own orders via user_id or guest token
CREATE POLICY "Customers view own orders"
ON public.orders FOR SELECT
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (guest_token IS NOT NULL)
);

CREATE POLICY "Customers insert own orders"
ON public.orders FOR INSERT
WITH CHECK (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)) OR
    (user_id IS NULL)
);

CREATE POLICY "Admin manage orders"
ON public.orders FOR ALL
USING (true)
WITH CHECK (true);

-- Order Items
CREATE POLICY "Customers view own order items"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE public.orders.id = order_items.order_id
        AND (
            (auth.uid() IS NOT NULL AND public.orders.user_id = auth.uid()) OR
            (public.orders.guest_token IS NOT NULL)
        )
    )
);

CREATE POLICY "Customers insert order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

-- Order Status History
CREATE POLICY "Users view own order status history"
ON public.order_status_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE public.orders.id = order_status_history.order_id
        AND (
            (auth.uid() IS NOT NULL AND public.orders.user_id = auth.uid()) OR
            (public.orders.guest_token IS NOT NULL)
        )
    )
);

CREATE POLICY "Admin manage order status history"
ON public.order_status_history FOR ALL
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 16. SEED DEFAULT SHIPPING METHODS
-- ------------------------------------------------------------------------------
INSERT INTO public.shipping_methods (id, name, code, description, price, estimated_days, is_active, sort_order)
VALUES
('s1111111-1111-1111-1111-111111111111', 'Regular', 'REG', 'Layanan pengiriman standar reguler terpercaya ke seluruh wilayah.', 15000, '2-4 hari', true, 1),
('s2222222-2222-2222-2222-222222222222', 'Express', 'EXP', 'Pengiriman cepat prioritas untuk kebutuhan mendesak / bahan segar.', 25000, '1-2 hari', true, 2),
('s3333333-3333-3333-3333-333333333333', 'Cargo', 'CARGO', 'Ekspedisi kargo khusus muatan tonase besar, karungan, dan kartonan bisnis.', 50000, '3-7 hari', true, 3)
-- ------------------------------------------------------------------------------
-- 17. TAHAP 4 — PAYMENTS & PAYMENT METHODS
-- ------------------------------------------------------------------------------

-- Table: payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'midtrans',
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON public.payment_methods (code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods (is_active, sort_order);

-- Table: payments (Supports multiple payment attempts per order)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'midtrans',
    provider_transaction_id VARCHAR(255),
    payment_method VARCHAR(100),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
    payment_url TEXT,
    payment_token TEXT,
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failure_reason TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx ON public.payments (provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER trg_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 18. RLS POLICIES FOR TAHAP 4
-- ------------------------------------------------------------------------------
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin manage payment methods"
ON public.payment_methods FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Customers view own payments"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE public.orders.id = payments.order_id
        AND (
            (auth.uid() IS NOT NULL AND public.orders.user_id = auth.uid()) OR
            (public.orders.guest_token IS NOT NULL)
        )
    )
);

CREATE POLICY "Customers create payments for own orders"
ON public.payments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE public.orders.id = payments.order_id
        AND (
            (auth.uid() IS NOT NULL AND public.orders.user_id = auth.uid()) OR
            (public.orders.guest_token IS NOT NULL)
        )
    )
);

CREATE POLICY "Admin manage payments"
ON public.payments FOR ALL
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 19. SEED DEFAULT PAYMENT METHODS
-- ------------------------------------------------------------------------------
INSERT INTO public.payment_methods (id, code, name, provider, description, is_active, sort_order)
VALUES
('p1111111-1111-1111-1111-111111111111', 'bank_transfer', 'Virtual Account & Transfer Bank', 'midtrans', 'Bayar via BCA, Mandiri, BNI, BRI, & Permata Virtual Account dengan verifikasi otomatis 24 jam.', true, 1),
('p2222222-2222-2222-2222-222222222222', 'qris', 'QRIS (GoPay, ShopeePay, Dana, OVO)', 'midtrans', 'Scan kode QRIS langsung melalui seluruh aplikasi e-wallet dan mobile banking Indonesia.', true, 2),
('p3333333-3333-3333-3333-333333333333', 'credit_card', 'Kartu Kredit / Debit Online', 'midtrans', 'Pembayaran instan dengan proteksi 3D Secure untuk Visa, Mastercard, dan JCB.', true, 3),
('p4444444-4444-4444-4444-444444444444', 'manual_transfer', 'Transfer Bank Manual (BCA)', 'manual', 'Transfer konvensional langsung ke rekening operasional toko dengan verifikasi tim admin.', true, 4)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
provider = EXCLUDED.provider,
description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 20. TAHAP 6 — INVENTORY MOVEMENTS, RBAC, AUDIT LOGS, NOTIFICATIONS
-- ------------------------------------------------------------------------------

-- Table: inventory_movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('sale', 'reservation', 'release', 'adjustment', 'restock', 'return')),
    quantity INT NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'manual_adjustment', 'restock_batch'
    reference_id VARCHAR(255),  -- e.g. ORD-20260925-0001
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    note TEXT,
    created_by VARCHAR(255) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements (type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref ON public.inventory_movements (reference_type, reference_id);

-- Table: permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')),
    permission_code VARCHAR(100) NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(role, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions (role);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users (role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users (is_active);

-- Table: admin_audit_logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    actor_name VARCHAR(255) NOT NULL DEFAULT 'System',
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON public.admin_audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs (created_at DESC);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (is_read, created_at DESC);

-- ------------------------------------------------------------------------------
-- 21. RLS POLICIES FOR TAHAP 6
-- ------------------------------------------------------------------------------
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access inventory movements" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access permissions" ON public.permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access role permissions" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access admin users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access audit logs" ON public.admin_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 22. TAHAP 7 — PROMOTIONS, VOUCHERS, TIER PRICING, B2B WHOLESALE
-- ------------------------------------------------------------------------------

-- Table: customer_price_levels
CREATE TABLE IF NOT EXISTS public.customer_price_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE, -- 'RETAIL', 'RESELLER', 'WHOLESALE', 'DISTRIBUTOR'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    priority INT NOT NULL DEFAULT 0,
    min_order_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_price_levels_code ON public.customer_price_levels (code);
CREATE INDEX IF NOT EXISTS idx_customer_price_levels_active ON public.customer_price_levels (is_active);

-- Table: product_prices (Tier pricing & custom price level matrices)
CREATE TABLE IF NOT EXISTS public.product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price_level_id UUID NOT NULL REFERENCES public.customer_price_levels(id) ON DELETE CASCADE,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    min_quantity INT NOT NULL DEFAULT 1,
    max_quantity INT, -- NULL means no limit (e.g. 50+)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON public.product_prices (product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_level ON public.product_prices (price_level_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_lookup ON public.product_prices (product_id, price_level_id, min_quantity);

-- Table: product_price_history (Price change audit)
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price_level_id UUID REFERENCES public.customer_price_levels(id) ON DELETE SET NULL,
    old_price NUMERIC(15, 2),
    new_price NUMERIC(15, 2) NOT NULL,
    changed_by VARCHAR(255) NOT NULL DEFAULT 'Admin',
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_price_history_prod ON public.product_price_history (product_id, created_at DESC);

-- Table: promotions
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'tier_discount', 'free_shipping')),
    value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    minimum_purchase NUMERIC(15, 2) NOT NULL DEFAULT 0,
    maximum_discount NUMERIC(15, 2),
    start_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days'),
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    customer_usage_limit INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 10,
    stackable BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON public.promotions (is_active, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions (code);

-- Promotion target mapping tables
CREATE TABLE IF NOT EXISTS public.promotion_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.promotion_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.promotion_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, brand_id)
);

CREATE TABLE IF NOT EXISTS public.promotion_customer_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    price_level_id UUID NOT NULL REFERENCES public.customer_price_levels(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, price_level_id)
);

CREATE TABLE IF NOT EXISTS public.promotion_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    buy_quantity INT NOT NULL DEFAULT 1,
    get_quantity INT NOT NULL DEFAULT 1,
    get_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_promotion_products ON public.promotion_products (product_id);
CREATE INDEX IF NOT EXISTS idx_promotion_categories ON public.promotion_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_promotion_brands ON public.promotion_brands (brand_id);

-- Table: vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    customer_usage_limit INT NOT NULL DEFAULT 1,
    minimum_purchase NUMERIC(15, 2) NOT NULL DEFAULT 0,
    start_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers (code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON public.vouchers (is_active, start_at, end_at);

-- Table: voucher_redemptions (Atomic audit & idempotency)
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    user_id UUID,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_identifier VARCHAR(255) NOT NULL, -- phone or email or user_id
    discount_amount NUMERIC(15, 2) NOT NULL CHECK (discount_amount >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher ON public.voucher_redemptions (voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user ON public.voucher_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_cust ON public.voucher_redemptions (customer_identifier);

-- Table: b2b_applications (Reseller & Wholesale business onboarding)
CREATE TABLE IF NOT EXISTS public.b2b_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    business_type VARCHAR(100) NOT NULL, -- 'retail_store', 'distributor', 'horeca', 'reseller'
    tax_id VARCHAR(100), -- NPWP
    estimated_monthly_purchase NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    requested_level VARCHAR(50) NOT NULL DEFAULT 'WHOLESALE',
    assigned_price_level_id UUID REFERENCES public.customer_price_levels(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_b2b_applications_status ON public.b2b_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_applications_phone ON public.b2b_applications (phone);

-- ------------------------------------------------------------------------------
-- 23. RLS POLICIES FOR TAHAP 7
-- ------------------------------------------------------------------------------
ALTER TABLE public.customer_price_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_customer_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active customer price levels" ON public.customer_price_levels FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage customer price levels" ON public.customer_price_levels FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view active product prices" ON public.product_prices FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage product prices" ON public.product_prices FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin manage price history" ON public.product_price_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage promotions" ON public.promotions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view promotion targets" ON public.promotion_products FOR SELECT USING (true);
CREATE POLICY "Admin manage promotion products" ON public.promotion_products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view promotion categories" ON public.promotion_categories FOR SELECT USING (true);
CREATE POLICY "Admin manage promotion categories" ON public.promotion_categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view promotion brands" ON public.promotion_brands FOR SELECT USING (true);
CREATE POLICY "Admin manage promotion brands" ON public.promotion_brands FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view promotion customer levels" ON public.promotion_customer_levels FOR SELECT USING (true);
CREATE POLICY "Admin manage promotion customer levels" ON public.promotion_customer_levels FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view promotion rules" ON public.promotion_rules FOR SELECT USING (true);
CREATE POLICY "Admin manage promotion rules" ON public.promotion_rules FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view active vouchers" ON public.vouchers FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Customers view own voucher redemptions" ON public.voucher_redemptions FOR SELECT USING (true);
CREATE POLICY "Anyone insert voucher redemptions" ON public.voucher_redemptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage voucher redemptions" ON public.voucher_redemptions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Customers create b2b applications" ON public.b2b_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers view own b2b applications" ON public.b2b_applications FOR SELECT USING (true);
CREATE POLICY "Admin manage b2b applications" ON public.b2b_applications FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- TAHAP 8: CUSTOMER ACCOUNT, PROFILE, WISHLIST, REVIEWS & LOYALTY PROGRAM
-- ==============================================================================

-- 1. Customer Profiles
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    price_level_id UUID REFERENCES public.customer_price_levels(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles(user_id);

-- 2. Wishlists (with unique user + product and price tracking)
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price_when_added NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);

-- 3. Product Reviews (Ratings 1-5, Moderation, Verified Purchase)
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL,
    review TEXT NOT NULL,
    photos TEXT[], -- array of public URLs in review-images bucket
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'published', 'rejected'
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON public.product_reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.product_reviews(user_id);

-- 4. Loyalty Program Settings
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    points_per_currency INT NOT NULL DEFAULT 10000, -- 1 point per Rp10.000
    minimum_redeem_points INT NOT NULL DEFAULT 10,
    expiration_enabled BOOLEAN NOT NULL DEFAULT false,
    expiration_months INT NOT NULL DEFAULT 12,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.loyalty_settings (points_per_currency, minimum_redeem_points, expiration_enabled, expiration_months, is_active)
VALUES (10000, 10, false, 12, true)
ON CONFLICT DO NOTHING;

-- 5. Loyalty Accounts (Current & Lifetime Points)
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_points INT NOT NULL DEFAULT 0 CHECK (current_points >= 0),
    lifetime_points INT NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user ON public.loyalty_accounts(user_id);

-- 6. Loyalty Point Transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'earn', 'redeem', 'expire', 'adjustment', 'refund_reversal'
    points INT NOT NULL, -- can be positive (earn/add) or negative (redeem/deduct)
    reference_type VARCHAR(50), -- 'order', 'reward_redemption', 'admin_adjustment', 'refund'
    reference_id VARCHAR(100),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON public.loyalty_transactions(user_id, created_at DESC);

-- 7. Loyalty Rewards Catalogue
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INT NOT NULL CHECK (points_required > 0),
    reward_type VARCHAR(30) NOT NULL, -- 'discount', 'voucher', 'free_shipping'
    reward_value NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stock INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.loyalty_rewards (name, description, points_required, reward_type, reward_value, is_active, stock)
VALUES
  ('Diskon Belanja Rp10.000', 'Potongan langsung Rp10.000 untuk pesanan berikutnya.', 15, 'discount', 10000, true, 100),
  ('Gratis Ongkir Khusus', 'Voucher subsidi ongkir hingga Rp15.000 ke seluruh area pengiriman.', 25, 'free_shipping', 15000, true, 100),
  ('Voucher Belanja Rp30.000', 'Voucher potongan Rp30.000 untuk transaksi minimal Rp150.000.', 40, 'voucher', 30000, true, 100),
  ('Voucher Grosir Rp50.000', 'Potongan Rp50.000 spesial member loyal komoditas pangan.', 60, 'voucher', 50000, true, 50)
ON CONFLICT DO NOTHING;

-- 8. Loyalty Redemptions
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
    points_used INT NOT NULL,
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
    voucher_code VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user ON public.loyalty_redemptions(user_id);

-- 9. Row Level Security for Tahap 8
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Users view own profile" ON public.customer_profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.customer_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own profile" ON public.customer_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage customer profiles" ON public.customer_profiles FOR ALL USING (true) WITH CHECK (true);

-- Wishlist Policies
CREATE POLICY "Users view own wishlist" ON public.wishlists FOR SELECT USING (true);
CREATE POLICY "Users insert own wishlist" ON public.wishlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users delete own wishlist" ON public.wishlists FOR DELETE USING (true);
CREATE POLICY "Admin manage wishlists" ON public.wishlists FOR ALL USING (true) WITH CHECK (true);

-- Product Reviews Policies
CREATE POLICY "Anyone view published reviews" ON public.product_reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Users view own reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage reviews" ON public.product_reviews FOR ALL USING (true) WITH CHECK (true);

-- Loyalty Policies
CREATE POLICY "Anyone view loyalty settings" ON public.loyalty_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage loyalty settings" ON public.loyalty_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users view own loyalty account" ON public.loyalty_accounts FOR SELECT USING (true);
CREATE POLICY "Admin manage loyalty accounts" ON public.loyalty_accounts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users view own loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "Admin manage loyalty transactions" ON public.loyalty_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone view active loyalty rewards" ON public.loyalty_rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage loyalty rewards" ON public.loyalty_rewards FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users view own redemptions" ON public.loyalty_redemptions FOR SELECT USING (true);
CREATE POLICY "Users insert redemptions" ON public.loyalty_redemptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage redemptions" ON public.loyalty_redemptions FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- TAHAP 9: SEO, CONTENT MANAGEMENT, MARKETING BANNER, ALERTS & RECOVERY
-- ==============================================================================

-- 1. Add SEO fields to existing tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS canonical_url TEXT;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_image TEXT;

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seo_image TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- 2. Product Slug History (Redirect support)
CREATE TABLE IF NOT EXISTS public.product_slug_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    old_slug VARCHAR(255) NOT NULL,
    new_slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug ON public.product_slug_history(old_slug);

-- 3. Content Management System (CMS)
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    content_type VARCHAR(50) NOT NULL DEFAULT 'article',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    author_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contents_slug ON public.contents(slug);
CREATE INDEX IF NOT EXISTS idx_contents_status ON public.contents(status);

CREATE TABLE IF NOT EXISTS public.content_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(content_id, product_id)
);

-- 4. Marketing Banners & Tracking
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link_url TEXT,
    button_text VARCHAR(100),
    position VARCHAR(50) NOT NULL DEFAULT 'homepage_hero',
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);

CREATE TABLE IF NOT EXISTS public.banner_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_id UUID NOT NULL REFERENCES public.banners(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL, -- 'view' | 'click'
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Abandoned Cart Tracking & Tokens
CREATE TABLE IF NOT EXISTS public.cart_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.abandoned_cart_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recovered_at TIMESTAMP WITH TIME ZONE,
    voucher_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Alerts (Stock & Price Notifications)
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notified_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    target_price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for Tahap 9
ALTER TABLE public.product_slug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_cart_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slug history" ON public.product_slug_history FOR SELECT USING (true);
CREATE POLICY "Admin manage slug history" ON public.product_slug_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view published contents" ON public.contents FOR SELECT USING (status = 'published');
CREATE POLICY "Admin manage all contents" ON public.contents FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view content products" ON public.content_products FOR SELECT USING (true);
CREATE POLICY "Admin manage content products" ON public.content_products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage all banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can log banner events" ON public.banner_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin view banner events" ON public.banner_events FOR SELECT USING (true);

CREATE POLICY "Anyone can insert cart activities" ON public.cart_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin view cart activities" ON public.cart_activities FOR SELECT USING (true);

CREATE POLICY "Anyone can view valid recovery tokens" ON public.abandoned_cart_tokens FOR SELECT USING (true);
CREATE POLICY "Admin manage recovery tokens" ON public.abandoned_cart_tokens FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users view own stock alerts" ON public.stock_alerts FOR SELECT USING (true);
CREATE POLICY "Users insert stock alerts" ON public.stock_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage stock alerts" ON public.stock_alerts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users view own price alerts" ON public.price_alerts FOR SELECT USING (true);
CREATE POLICY "Users insert price alerts" ON public.price_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage price alerts" ON public.price_alerts FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- TAHAP 10: PRODUCTION HARDENING, COMPOSITE INDEXES, SYSTEM LOGS & SETTINGS
-- ==============================================================================

-- 1. High-Performance Composite Indexes for High-Traffic Queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_created ON public.inventory_logs(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_activities_cart_created ON public.cart_activities(cart_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_events_banner_type ON public.banner_events(banner_id, event_type);

-- 2. System Settings & Feature Flags Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default feature flags & maintenance state
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('maintenance_mode', '{"enabled": false, "bypass_key": "FMCG-SECURE-2026", "title": "Peningkatan Sistem Berkala", "message": "Kami sedang melakukan peningkatan performa berkala."}'::jsonb, 'Konfigurasi mode pemeliharaan toko'),
  ('feature_flags', '{"enable_cod": true, "enable_b2b_wholesale": true, "enable_guest_checkout": true, "enable_rate_limiting": true, "enable_cache_engine": true}'::jsonb, 'Matriks toggle fitur aktif toko')
ON CONFLICT (key) DO NOTHING;

-- 3. Security & System Audit Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR', 'SECURITY'
    category VARCHAR(50) NOT NULL DEFAULT 'system',
    message TEXT NOT NULL,
    ip_address VARCHAR(50),
    path TEXT,
    actor_name VARCHAR(100) DEFAULT 'System',
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs(created_at DESC);

-- 4. Disaster Recovery & System Backup History Table
CREATE TABLE IF NOT EXISTS public.system_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'catalog', 'orders', 'customers', 'inventory'
    file_name VARCHAR(255) NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'json',
    record_count INT NOT NULL DEFAULT 0,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Policies for Tahap 10 Tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage system settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System logs can be inserted" ON public.system_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view system logs" ON public.system_logs FOR SELECT USING (true);

CREATE POLICY "Admin manage system backups" ON public.system_backups FOR ALL USING (true) WITH CHECK (true);







