-- ==============================================================================
-- DATABASE SEED DATA — ONLINE STORE FMCG PRODUCT CATALOG FOUNDATION (TAHAP 1)
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, sort_order)
VALUES
('c1111111-1111-1111-1111-111111111111', 'Kurma', 'kurma', 'Pilihan kurma berkualitas dari Timur Tengah dengan tekstur lembut, rasa manis alami, dan nutrisi tinggi.', 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=800&q=80', true, 1),
('c2222222-2222-2222-2222-222222222222', 'Wijen', 'wijen', 'Biji wijen pilihan murni, bersih tanpa kotoran, kaya aroma minyak alami untuk bakery dan masakan oriental.', 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80', true, 2),
('c3333333-3333-3333-3333-333333333333', 'Kacang-kacangan', 'kacang-kacangan', 'Aneka kacang pangan curah dan kemasan pilihan terbaik: kacang tanah, kedelai, kacang hijau, dan kacang mete.', 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80', true, 3),
('c4444444-4444-4444-4444-444444444444', 'Bawang', 'bawang', 'Bawang putih kating, bawang putih honan, dan bawang merah segar pilihan dengan aroma kuat dan kadar air seimbang.', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80', true, 4),
('c5555555-5555-5555-5555-555555555555', 'Rempah', 'rempah', 'Kemiri bulat utuh, ketumbar, merica, dan aneka rempah dapur Nusantara kualitas ekspor dan industri.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', true, 5),
('c6666666-6666-6666-6666-666666666666', 'Lainnya', 'lainnya', 'Bahan pangan kering, tepung pangan, dan komoditas pendukung industri pengolahan makanan.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', true, 6)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
slug = EXCLUDED.slug,
description = EXCLUDED.description,
image_url = EXCLUDED.image_url;

-- 2. SEED BRANDS
INSERT INTO public.brands (id, name, slug, description, logo_url, is_active)
VALUES
('b1111111-1111-1111-1111-111111111111', 'Nusantara Agro', 'nusantara-agro', 'Produsen hasil bumi dan rempah asli petani Indonesia.', null, true),
('b2222222-2222-2222-2222-222222222222', 'Barakah Dates', 'barakah-dates', 'Importir kurma Madinah dan Timur Tengah berstandar mutu tinggi.', null, true),
('b3333333-3333-3333-3333-333333333333', 'Sari Bumi Pangan', 'sari-bumi-pangan', 'Komoditas biji-bijian, kedelai, dan kacang tanah sortiran prima.', null, true),
('b4444444-4444-4444-4444-444444444444', 'Mitra Rempah Prima', 'mitra-rempah-prima', 'Spesialis kemiri, lada, dan rempah bumbu dapur siap pakai.', null, true)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
slug = EXCLUDED.slug;

-- 3. SEED PRODUCTS
INSERT INTO public.products (
    id, name, slug, sku, description, short_description,
    category_id, brand_id, price, compare_price, cost_price,
    weight, unit, stock, low_stock_threshold, is_active, is_featured, is_best_seller
)
VALUES
(
    'p1111111-1111-1111-1111-111111111111',
    'Kurma Ajwa 500g',
    'kurma-ajwa-500g',
    'KRM-AJW-500',
    'Kurma Ajwa premium hasil panen Madinah Al-Munawwarah. Dipilih secara higienis melalui proses sortasi ketat (Grade A). Memiliki tekstur kering di luar namun sangat lembut dan pulen di bagian dalam. Kaya akan antioksidan, serat pangan alami, zat besi, dan kalium yang sangat baik untuk stamina dan imunitas harian.',
    'Kurma Ajwa Al-Madinah asli, tekstur lembut pekat dengan garis-garis halus khas dan rasa manis seimbang.',
    'c1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    135000, 155000, 105000, 500, 'gram', 85, 15, true, true, true
),
(
    'p2222222-2222-2222-2222-222222222222',
    'Kurma Sukari 500g',
    'kurma-sukari-500g',
    'KRM-SKR-500',
    'Kurma Sukari sering disebut kurma raja karena kualitas rasa manisnya yang legit mirip madu karamel. Dikenal dengan tekstur daging buah yang sangat empuk dan basah. Sangat cocok disajikan dingin atau dijadikan pemanis alami untuk susu kurma dan hidangan penutup.',
    'Kurma Sukari basah (rutob) dengan warna keemasan dan sensasi lumer legit seperti karamel.',
    'c1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    48000, 60000, 36000, 500, 'gram', 140, 25, true, true, true
),
(
    'p3333333-3333-3333-3333-333333333333',
    'Wijen Hitam 500g',
    'wijen-hitam-500g',
    'WJN-HTM-500',
    'Black sesame seeds pilihan dengan aroma gurih yang intens saat disangrai. Butiran seragam, kering sempurna, dan bebas debu/batu kecil. Banyak digunakan untuk onde-onde, roti artisanal, sushi roll, bumbu marinasi teriyaki, hingga suplemen kesehatan rambut.',
    'Biji wijen hitam murni berkualitas, sudah dibersihkan dan siap sangrai untuk taburan roti dan masakan oriental.',
    'c2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    32000, 38000, 23000, 500, 'gram', 60, 15, true, false, false
),
(
    'p4444444-4444-4444-4444-444444444444',
    'Wijen Putih 500g',
    'wijen-putih-500g',
    'WJN-PTH-500',
    'Wijen putih murni kualitas ekspor. Diproses dengan pencucian higienis sehingga bebas dari pestisida dan debu. Biji utuh montok dengan kadar minyak nabati tinggi, memberikan aroma wangi khas saat dipanggang.',
    'Biji wijen putih bersih tanpa pemutih kimia, aroma wangi gurih untuk bakery dan restoran.',
    'c2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    28000, null, 20000, 500, 'gram', 92, 20, true, true, false
),
(
    'p5555555-5555-5555-5555-555555555555',
    'Kacang Tanah 1kg',
    'kacang-tanah-1kg',
    'KCG-TNH-1KG',
    'Kacang tanah kupas pilihan jenis super. Butirannya padat, renyah, dan manis alami. Sangat cocok digunakan untuk bumbu pecel, bumbu gado-gado, kacang bawang Lebaran, hingga olahan selai kacang industri.',
    'Kacang tanah kupas bulat (kacang tuban), biji besar padat dan bebas jamur aflatoksin.',
    'c3333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    34000, 39000, 27000, 1, 'kg', 210, 40, true, false, true
),
(
    'p6666666-6666-6666-6666-666666666666',
    'Kacang Hijau 1kg',
    'kacang-hijau-1kg',
    'KCG-HIJ-1KG',
    'Kacang hijau lokal kualitas super dengan warna hijau segar alami. Memiliki waktu perebusan lebih singkat karena kulit ari yang tidak alot. Sangat lezat untuk bubur kacang hijau, isian bakpia, minuman sari kacang hijau, dan kecambah tauge renyah.',
    'Kacang hijau butir seragam, cepat empuk dan merekah saat direbus, bebas batu kerikil.',
    'c3333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    26000, 30000, 19500, 1, 'kg', 125, 20, true, false, false
),
(
    'p7777777-7777-7777-7777-777777777777',
    'Bawang Putih 1kg',
    'bawang-putih-1kg',
    'BWG-PTH-1KG',
    'Bawang putih jenis Kating pilihan dengan karakteristik siung montok dan rapat. Kadar minyak atsiri tinggi membuat aroma tumisan jauh lebih sedap dibanding bawang biasa. Kering jemur alami, tidak mudah busuk saat disimpan dalam sirkulasi udara baik.',
    'Bawang putih kating utuh, siung padat tebal dengan aroma tajam harum gurih khas.',
    'c4444444-4444-4444-4444-444444444444',
    'b1111111-1111-1111-1111-111111111111',
    42000, 48000, 33000, 1, 'kg', 75, 15, true, true, true
),
(
    'p8888888-8888-8888-8888-888888888888',
    'Kemiri 500g',
    'kemiri-500g',
    'KMR-BLT-500',
    'Kemiri bulat kupas bersih berkualitas grade A. Minyak bumbu alami melimpah, memberikan rasa gurih mantap dan tekstur kuah masakan yang kental legit seperti soto, opor, rendang, dan sambal goreng.',
    'Kemiri bulat utuh pilihan, warna putih kekuningan alami tanpa klorin pemutih.',
    'c5555555-5555-5555-5555-555555555555',
    'b4444444-4444-4444-4444-444444444444',
    27000, 32000, 21000, 500, 'gram', 8, 10, true, false, false
),
(
    'p9999999-9999-9999-9999-999999999999',
    'Kacang Kedelai Import 1kg',
    'kacang-kedelai-import-1kg',
    'KCG-KDL-1KG',
    'Kedelai kuning grade 1 dengan kandungan protein nabati tinggi. Menghasilkan rendemen tahu yang lembut dan tempe yang padat dengan jamur merata. Kadar air rendah sehingga tahan disimpan lama.',
    'Kacang kedelai kuning biji besar berkualitas tinggi untuk bahan baku tahu, tempe, dan susu kedelai.',
    'c3333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    18500, 21000, 14000, 1, 'kg', 350, 50, true, false, true
)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
price = EXCLUDED.price,
stock = EXCLUDED.stock;

-- 4. SEED PRODUCT IMAGES
INSERT INTO public.product_images (id, product_id, image_url, alt_text, sort_order, is_primary)
VALUES
('img-101', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=800&q=80', 'Kurma Ajwa Madinah 500g', 1, true),
('img-102', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80', 'Detail tekstur kurma ajwa', 2, false),
('img-201', 'p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=800&q=80', 'Kurma Sukari 500g', 1, true),
('img-301', 'p3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80', 'Wijen hitam murni kemasan 500g', 1, true),
('img-401', 'p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80', 'Wijen putih murni premium 500g', 1, true),
('img-501', 'p5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80', 'Kacang tanah kupas super 1kg', 1, true),
('img-601', 'p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 'Kacang hijau pilihan 1kg', 1, true),
('img-701', 'p7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80', 'Bawang putih kating super 1kg', 1, true),
('img-801', 'p8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', 'Kemiri bulat utuh 500g', 1, true),
('img-901', 'p9999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80', 'Kacang kedelai kuning 1kg', 1, true)
ON CONFLICT (id) DO UPDATE SET
image_url = EXCLUDED.image_url;

-- ------------------------------------------------------------------------------
-- 5. INITIAL SHIPPING METHODS (TAHAP 3)
-- ------------------------------------------------------------------------------
INSERT INTO public.shipping_methods (id, name, code, description, price, estimated_days, is_active, sort_order)
VALUES
('sm-1111111-1111-1111-1111-111111111111', 'Kurir Regular', 'REG', 'Pengiriman hemat standar ke seluruh wilayah jangkauan armada.', 15000, '2-4 hari', true, 1),
('sm-2222222-2222-2222-2222-222222222222', 'Kurir Express', 'EXP', 'Layanan prioritas cepat sampai esok hari untuk kebutuhan mendesak.', 25000, '1-2 hari', true, 2),
('sm-3333333-3333-3333-3333-333333333333', 'Kargo / Truk Muatan', 'CARGO', 'Layanan khusus pesanan grosir, karungan, dan volume komoditas besar.', 50000, '3-7 hari', true, 3)
ON CONFLICT (code) DO UPDATE SET
price = EXCLUDED.price,
name = EXCLUDED.name,
estimated_days = EXCLUDED.estimated_days;

-- ------------------------------------------------------------------------------
-- 6. INITIAL PAYMENT METHODS (TAHAP 4)
-- ------------------------------------------------------------------------------
INSERT INTO public.payment_methods (id, code, name, provider, description, is_active, sort_order)
VALUES
('pm-1111111-1111-1111-1111-111111111111', 'bank_transfer', 'Virtual Account & Transfer Bank', 'midtrans', 'Bayar via BCA, Mandiri, BNI, BRI, & Permata Virtual Account dengan verifikasi otomatis 24 jam.', true, 1),
('pm-2222222-2222-2222-2222-222222222222', 'qris', 'QRIS (GoPay, ShopeePay, Dana, OVO)', 'midtrans', 'Scan kode QRIS langsung melalui seluruh aplikasi e-wallet dan mobile banking Indonesia.', true, 2),
('pm-3333333-3333-3333-3333-333333333333', 'credit_card', 'Kartu Kredit / Debit Online', 'midtrans', 'Pembayaran instan dengan proteksi 3D Secure untuk Visa, Mastercard, dan JCB.', true, 3),
('pm-4444444-4444-4444-4444-444444444444', 'manual_transfer', 'Transfer Bank Manual (BCA)', 'manual', 'Transfer konvensional langsung ke rekening operasional toko dengan verifikasi tim admin.', true, 4)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
provider = EXCLUDED.provider,
description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 7. INITIAL PERMISSIONS & ROLES (TAHAP 6)
-- ------------------------------------------------------------------------------
INSERT INTO public.permissions (id, code, name, description)
VALUES
('perm-1', 'products.view', 'Lihat Produk', 'Dapat melihat daftar dan detail produk'),
('perm-2', 'products.create', 'Tambah Produk', 'Dapat menambah produk baru ke katalog'),
('perm-3', 'products.update', 'Edit Produk', 'Dapat mengubah informasi dan harga produk'),
('perm-4', 'products.delete', 'Hapus Produk', 'Dapat menonaktifkan atau menghapus produk'),
('perm-5', 'orders.view', 'Lihat Pesanan', 'Dapat melihat daftar dan detail transaksi pesanan'),
('perm-6', 'orders.update', 'Kelola Pesanan', 'Dapat memperbarui status pesanan dan pembayaran'),
('perm-7', 'customers.view', 'Lihat Pelanggan', 'Dapat melihat daftar dan profil pelanggan'),
('perm-8', 'customers.export', 'Ekspor Pelanggan', 'Dapat mengunduh data pelanggan ke format CSV'),
('perm-9', 'inventory.view', 'Lihat Inventaris', 'Dapat memantau stok dan status persediaan komoditas'),
('perm-10', 'inventory.adjust', 'Penyesuaian Stok', 'Dapat melakukan adjustment dan mutasi stok'),
('perm-11', 'reports.view', 'Lihat Laporan Penjualan', 'Dapat membuka analitik dan laporan penjualan'),
('perm-12', 'reports.export', 'Ekspor Laporan Penjualan', 'Dapat mengunduh laporan penjualan ke CSV/Excel'),
('perm-13', 'users.manage', 'Kelola Admin & Peran', 'Dapat mengatur user admin dan penugasan role')
ON CONFLICT (code) DO NOTHING;

-- Super Admin has all permissions
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'super_admin', code FROM public.permissions
ON CONFLICT (role, permission_code) DO NOTHING;

-- Admin has products, orders, customers, inventory, reports
INSERT INTO public.role_permissions (role, permission_code)
VALUES
('admin', 'products.view'),
('admin', 'products.create'),
('admin', 'products.update'),
('admin', 'orders.view'),
('admin', 'orders.update'),
('admin', 'customers.view'),
('admin', 'customers.export'),
('admin', 'inventory.view'),
('admin', 'inventory.adjust'),
('admin', 'reports.view'),
('admin', 'reports.export')
ON CONFLICT (role, permission_code) DO NOTHING;

-- Staff has limited view and order processing permissions
INSERT INTO public.role_permissions (role, permission_code)
VALUES
('staff', 'products.view'),
('staff', 'orders.view'),
('staff', 'orders.update'),
('staff', 'customers.view'),
('staff', 'inventory.view')
ON CONFLICT (role, permission_code) DO NOTHING;

-- Initial Super Admin User
INSERT INTO public.admin_users (id, email, name, role, is_active)
VALUES
('adm-1111111-1111-1111-1111-111111111111', 'atdigitalstudio2026@gmail.com', 'Super Administrator', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET
role = 'super_admin',
name = EXCLUDED.name;

-- ------------------------------------------------------------------------------
-- 8. INITIAL CUSTOMER PRICE LEVELS (TAHAP 7)
-- ------------------------------------------------------------------------------
INSERT INTO public.customer_price_levels (id, code, name, description, priority, min_order_value, is_active)
VALUES
('cpl-1111111-1111-1111-1111-111111111111', 'RETAIL', 'Pelanggan Retail', 'Harga eceran umum untuk end-user perorangan dan rumah tangga.', 10, 0, true),
('cpl-2222222-2222-2222-2222-222222222222', 'RESELLER', 'Mitra Reseller', 'Harga mitra penjualan ulang dengan kuota minimum belanja fleksibel.', 20, 500000, true),
('cpl-3333333-3333-3333-3333-333333333333', 'WHOLESALE', 'Grosir & Toko Kelontong', 'Harga partai besar khusus toko retail pangan dan minimarket lokal.', 30, 1000000, true),
('cpl-4444444-4444-4444-4444-444444444444', 'DISTRIBUTOR', 'Distributor Wilayah', 'Harga komoditas skala tonase dengan kontrak logistik berkala.', 40, 5000000, true)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
min_order_value = EXCLUDED.min_order_value;

-- ------------------------------------------------------------------------------
-- 9. INITIAL PROMOTIONS & VOUCHERS (TAHAP 7)
-- ------------------------------------------------------------------------------
INSERT INTO public.promotions (id, name, code, description, type, value, minimum_purchase, maximum_discount, start_at, end_at, usage_limit, usage_count, customer_usage_limit, is_active, priority, stackable)
VALUES
('prm-1111111-1111-1111-1111-111111111111', 'Voucher Selamat Datang 10%', 'WELCOME10', 'Diskon 10% pesanan pertama dengan batas maksimal potongan Rp50.000.', 'percentage', 10, 500000, 50000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), 1000, 0, 1, true, 100, false),
('prm-2222222-2222-2222-2222-222222222222', 'Promo Spesial Ramadan 15%', 'RAMADAN2027', 'Potongan harga spesial kurma dan bahan pangan pokok 15%.', 'percentage', 15, 300000, 100000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), 500, 0, 2, true, 90, false),
('prm-3333333-3333-3333-3333-333333333333', 'Diskon Grosir Mitra 50k', 'RESELLER50', 'Potongan tetap Rp50.000 khusus pembelian mitra reseller dan grosir.', 'fixed_amount', 50000, 1000000, 50000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), 200, 0, 1, true, 80, false),
('prm-4444444-4444-4444-4444-444444444444', 'Gratis Ongkir Se-Jabodetabek', 'FREEONGKIR', 'Gratis biaya pengiriman kurir regular untuk belanja di atas Rp250.000.', 'free_shipping', 15000, 250000, 15000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), 1000, 0, 3, true, 50, false)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
value = EXCLUDED.value;

-- Vouchers linking to promotions
INSERT INTO public.vouchers (id, promotion_id, code, description, usage_limit, usage_count, customer_usage_limit, minimum_purchase, start_at, end_at, is_active)
VALUES
('vch-1111111-1111-1111-1111-111111111111', 'prm-1111111-1111-1111-1111-111111111111', 'WELCOME10', 'Kode voucher diskon 10% pengguna baru belanja minimal Rp500.000 (Maks Rp50.000).', 1000, 0, 1, 500000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), true),
('vch-2222222-2222-2222-2222-222222222222', 'prm-2222222-2222-2222-2222-222222222222', 'RAMADAN2027', 'Kode voucher Ramadan diskon 15% minimal belanja Rp300.000.', 500, 0, 2, 300000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), true),
('vch-3333333-3333-3333-3333-333333333333', 'prm-3333333-3333-3333-3333-333333333333', 'RESELLER50', 'Potongan langsung Rp50.000 untuk pesanan grosir di atas Rp1.000.000.', 200, 0, 1, 1000000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), true),
('vch-4444444-4444-4444-4444-444444444444', 'prm-4444444-4444-4444-4444-444444444444', 'FREEONGKIR', 'Gratis ongkos kirim s.d Rp15.000 minimal belanja Rp250.000.', 1000, 0, 3, 250000, timezone('utc'::text, now()), timezone('utc'::text, now() + INTERVAL '365 days'), true)
ON CONFLICT (code) DO UPDATE SET
description = EXCLUDED.description,
minimum_purchase = EXCLUDED.minimum_purchase;




