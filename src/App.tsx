/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './components/common/Toast';
import { CartProvider } from './context/CartContext';
import { StorefrontLayout } from './components/layout/StorefrontLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoryProductsPage } from './pages/CategoryProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductCreatePage } from './pages/admin/AdminProductCreatePage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminShippingMethodsPage } from './pages/admin/AdminShippingMethodsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminPaymentMethodsPage } from './pages/admin/AdminPaymentMethodsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminCustomerDetailPage } from './pages/admin/AdminCustomerDetailPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSalesReportPage } from './pages/admin/AdminSalesReportPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSystemHealthPage } from './pages/admin/AdminSystemHealthPage';
import { AdminSecurityAuditPage } from './pages/admin/AdminSecurityAuditPage';
import { AdminSystemSettingsPage } from './pages/admin/AdminSystemSettingsPage';
import { AdminBackupRestorePage } from './pages/admin/AdminBackupRestorePage';
import { AdminMarketingHubPage } from './pages/admin/AdminMarketingHubPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminAbandonedCartsPage } from './pages/admin/AdminAbandonedCartsPage';
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage';
import { AdminConversionFunnelPage } from './pages/admin/AdminConversionFunnelPage';
import { AdminMarketingAnalyticsPage } from './pages/admin/AdminMarketingAnalyticsPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { PromoLandingPage } from './pages/PromoLandingPage';
import { CartRecoveryPage } from './pages/CartRecoveryPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { MaintenanceOverlay } from './components/common/MaintenanceOverlay';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';
import { isStorefrontInMaintenance, getMaintenanceConfig } from './services/maintenanceService';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { AccountLayout } from './components/account/AccountLayout';
import { AccountDashboardPage } from './pages/account/AccountDashboardPage';
import { AccountProfilePage } from './pages/account/AccountProfilePage';
import { AccountOrdersPage } from './pages/account/AccountOrdersPage';
import { AccountAddressesPage } from './pages/account/AccountAddressesPage';
import { AccountWishlistPage } from './pages/account/AccountWishlistPage';
import { AccountReviewsPage } from './pages/account/AccountReviewsPage';
import { AccountLoyaltyPage } from './pages/account/AccountLoyaltyPage';
import { AccountOrderDetailPage } from './pages/account/AccountOrderDetailPage';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';
import { useCategories } from './hooks/useCategories';
import { useBrands } from './hooks/useBrands';
import { useProducts } from './hooks/useProducts';
import { useProduct } from './hooks/useProduct';
import { ProductWithDetails } from './types';
import { siteConfig } from './config/site';

export default function App() {
  // Navigation & URL state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Global Categories & Brands
  const { categories, isLoading: loadingCategories, error: errorCategories, refetch: refetchCategories } = useCategories();
  const { brands, isLoading: loadingBrands } = useBrands();

  // Handle client-side routing
  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Products catalog hook for /products page
  const {
    products,
    total,
    page,
    totalPages,
    limit,
    isLoading: loadingProducts,
    filters,
    updateFilters,
    resetFilters,
    refetch: refetchProducts,
  } = useProducts({ limit: siteConfig.catalog.itemsPerPage });

  // Featured and Best Seller hooks for homepage
  const {
    products: featuredProducts,
    isLoading: loadingFeatured,
  } = useProducts({ is_featured: true, limit: 4 });

  const {
    products: bestSellerProducts,
    isLoading: loadingBestSellers,
  } = useProducts({ is_best_seller: true, limit: 4 });

  // Route matching helpers
  const pathname = currentPath.split('?')[0];

  // 1. Product Detail Route: /products/:slug
  const productDetailMatch = pathname.match(/^\/products\/([^/]+)$/);
  const productSlug = productDetailMatch ? productDetailMatch[1] : undefined;
  const isProductDetailPage = Boolean(productSlug && productSlug !== 'new');

  // Hook for single product detail
  const {
    product: currentDetailProduct,
    isLoading: loadingDetail,
    error: errorDetail,
  } = useProduct(isProductDetailPage ? productSlug : undefined);

  // 2. Category Route: /category/:slug
  const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
  const categorySlug = categoryMatch ? categoryMatch[1] : undefined;
  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  // 3. Admin Edit Route: /admin/products/:id/edit
  const adminEditMatch = pathname.match(/^\/admin\/products\/([^/]+)\/edit$/);
  const editProductId = adminEditMatch ? adminEditMatch[1] : undefined;

  // 4. Order Success Route: /order-success/:orderNumber
  const orderSuccessMatch = pathname.match(/^\/order-success\/([^/]+)$/);
  const successOrderNumber = orderSuccessMatch ? decodeURIComponent(orderSuccessMatch[1]) : undefined;

  // 5. Order Detail Route: /orders/:orderNumber
  const orderDetailMatch = pathname.match(/^\/orders\/([^/]+)$/);
  const detailOrderNumber = orderDetailMatch ? decodeURIComponent(orderDetailMatch[1]) : undefined;

  // 6. Admin Order Detail Route: /admin/orders/:orderId
  const adminOrderDetailMatch = pathname.match(/^\/admin\/orders\/([^/]+)$/);
  const adminDetailOrderId = adminOrderDetailMatch ? decodeURIComponent(adminOrderDetailMatch[1]) : undefined;

  // 7. Admin Customer Detail Route: /admin/customers/:customerId
  const adminCustomerDetailMatch = pathname.match(/^\/admin\/customers\/([^/]+)$/);
  const adminDetailCustomerId = adminCustomerDetailMatch ? decodeURIComponent(adminCustomerDetailMatch[1]) : undefined;

  // 8. Blog Post Detail Route: /blog/:slug
  const blogDetailMatch = pathname.match(/^\/blog\/([^/]+)$/);
  const blogSlug = blogDetailMatch ? blogDetailMatch[1] : undefined;

  // 9. Promo Landing Page Route: /promo/:slug
  const promoMatch = pathname.match(/^\/promo\/([^/]+)$/);
  const promoSlug = promoMatch ? promoMatch[1] : undefined;

  // 10. Cart Recovery Route: /cart/recover/:token
  const recoveryMatch = pathname.match(/^\/cart\/recover\/([^/]+)$/);
  const recoveryToken = recoveryMatch ? decodeURIComponent(recoveryMatch[1]) : undefined;

  // 11. Account Order Detail Route: /account/orders/:orderNumber
  const accountOrderDetailMatch = pathname.match(/^\/account\/orders\/([^/]+)$/);
  const accountDetailOrderNumber = accountOrderDetailMatch ? decodeURIComponent(accountOrderDetailMatch[1]) : undefined;

  // Global search submit handler from Header
  const handleSearchSubmit = (query: string) => {
    updateFilters({ search: query, page: 1 });
    navigate('/products');
  };

  // Product select handler from grid cards
  const handleSelectProduct = (product: ProductWithDetails) => {
    navigate(`/products/${product.slug}`);
  };

  // Render Page Content based on Route
  const renderContent = () => {
    // -------------------------------------------------------------
    // STOREFRONT MAINTENANCE MODE OVERLAY (Tahap 10)
    // -------------------------------------------------------------
    if (!pathname.startsWith('/admin') && isStorefrontInMaintenance()) {
      return (
        <MaintenanceOverlay
          config={getMaintenanceConfig()}
          onBypassed={() => navigate(currentPath)}
        />
      );
    }

    // -------------------------------------------------------------
    // ADMIN ROUTES
    // -------------------------------------------------------------
    if (pathname === '/admin' || pathname === '/admin/dashboard') {
      return (
        <AdminLayout
          currentPath="/admin"
          onNavigate={navigate}
          title="Dashboard Ringkasan"
          subtitle="Statistik performa katalog, inventaris komoditas, dan aksi cepat."
        >
          <AdminDashboardPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/products') {
      return (
        <AdminLayout
          currentPath="/admin/products"
          onNavigate={navigate}
          title="Kelola Produk"
          subtitle="Daftar seluruh komoditas pangan, stok, harga, dan status publikasi."
        >
          <AdminProductsPage
            categories={categories}
            onNavigate={navigate}
          />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/products/new') {
      return (
        <AdminLayout
          currentPath="/admin/products/new"
          onNavigate={navigate}
          title="Tambah Produk Baru"
          subtitle="Input produk komoditas pangan dan upload foto ke Supabase Storage."
        >
          <AdminProductCreatePage
            categories={categories}
            brands={brands}
            onNavigate={navigate}
          />
        </AdminLayout>
      );
    }

    if (editProductId) {
      return (
        <AdminLayout
          currentPath={`/admin/products/${editProductId}/edit`}
          onNavigate={navigate}
          title="Edit Produk"
          subtitle="Perbarui data komoditas pangan, harga, stok, dan urutan foto."
        >
          <AdminProductEditPage
            productId={editProductId}
            categories={categories}
            brands={brands}
            onNavigate={navigate}
          />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/orders') {
      return (
        <AdminLayout
          currentPath="/admin/orders"
          onNavigate={navigate}
          title="Kelola Pesanan"
          subtitle="Daftar transaksi masuk, verifikasi status, dan riwayat pesanan komoditas."
        >
          <AdminOrdersPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (adminDetailOrderId) {
      return (
        <AdminLayout
          currentPath={`/admin/orders/${adminDetailOrderId}`}
          onNavigate={navigate}
          title="Detail & Mutasi Pesanan"
          subtitle={`Kelola rincian pesanan ${adminDetailOrderId} dan status pengiriman.`}
        >
          <AdminOrderDetailPage
            orderId={adminDetailOrderId}
            onNavigate={navigate}
          />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/shipping-methods') {
      return (
        <AdminLayout
          currentPath="/admin/shipping-methods"
          onNavigate={navigate}
          title="Metode Pengiriman"
          subtitle="Kelola opsi kurir pengiriman, estimasi durasi, dan konfigurasi ongkir."
        >
          <AdminShippingMethodsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/payments') {
      return (
        <AdminLayout
          currentPath="/admin/payments"
          onNavigate={navigate}
          title="Transaksi Pembayaran"
          subtitle="Daftar seluruh riwayat pembayaran masuk, status gateway, dan rekonsiliasi transaksi."
        >
          <AdminPaymentsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/payment-methods') {
      return (
        <AdminLayout
          currentPath="/admin/payment-methods"
          onNavigate={navigate}
          title="Metode Pembayaran"
          subtitle="Konfigurasi opsi pembayaran aktif (Virtual Account, QRIS, Kartu Kredit, Transfer Bank)."
        >
          <AdminPaymentMethodsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/analytics') {
      return (
        <AdminLayout
          currentPath="/admin/analytics"
          onNavigate={navigate}
          title="Analitik Penjualan"
          subtitle="Statistik mendalam performa produk, kategori, dan brand distributor."
        >
          <AdminAnalyticsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/analytics/products') {
      return (
        <AdminLayout
          currentPath="/admin/analytics/products"
          onNavigate={navigate}
          title="Performa Produk"
          subtitle="Analisis penjualan per produk, kuantitas terjual, omset, dan ASP."
        >
          <AdminAnalyticsPage initialTab="products" onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/analytics/categories') {
      return (
        <AdminLayout
          currentPath="/admin/analytics/categories"
          onNavigate={navigate}
          title="Performa Kategori"
          subtitle="Kontribusi omset dan volume pesanan per kategori komoditas."
        >
          <AdminAnalyticsPage initialTab="categories" onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/analytics/brands') {
      return (
        <AdminLayout
          currentPath="/admin/analytics/brands"
          onNavigate={navigate}
          title="Performa Brand / Distributor"
          subtitle="Volume dan omset per brand atau pemasok komoditas pangan."
        >
          <AdminAnalyticsPage initialTab="brands" onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/customers') {
      return (
        <AdminLayout
          currentPath="/admin/customers"
          onNavigate={navigate}
          title="Data Pelanggan"
          subtitle="Daftar profil pembeli, segmentasi loyalitas, riwayat belanja, dan nilai total pembelian (LTV)."
        >
          <AdminCustomersPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (adminDetailCustomerId) {
      return (
        <AdminLayout
          currentPath={`/admin/customers/${adminDetailCustomerId}`}
          onNavigate={navigate}
          title="Profil & Riwayat Pelanggan"
          subtitle="Informasi detail profil, ringkasan belanja, dan riwayat pesanan pelanggan."
        >
          <AdminCustomerDetailPage
            customerId={adminDetailCustomerId}
            onNavigate={navigate}
          />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/reports/sales') {
      return (
        <AdminLayout
          currentPath="/admin/reports/sales"
          onNavigate={navigate}
          title="Laporan Penjualan"
          subtitle="Laporan keuangan, omset kotor, diskon promosi, ongkos kirim, dan pendapatan bersih."
        >
          <AdminSalesReportPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/inventory') {
      return (
        <AdminLayout
          currentPath="/admin/inventory"
          onNavigate={navigate}
          title="Inventaris & Kontrol Stok"
          subtitle="Monitoring stok fisik gudang, batas minimum persediaan, dan audit mutasi barang."
        >
          <AdminInventoryPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/users') {
      return (
        <AdminLayout
          currentPath="/admin/users"
          onNavigate={navigate}
          title="Pengguna & Hak Akses"
          subtitle="Kelola pengguna admin, penugasan peran (RBAC), matriks izin, dan audit log."
        >
          <AdminUsersPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    // Tahap 10: Production Hardening, System Health, Security, & Backups
    if (pathname === '/admin/system-health') {
      return (
        <AdminLayout
          currentPath="/admin/system-health"
          onNavigate={navigate}
          title="Monitoring & Observabilitas Sistem"
          subtitle="Status kesehatan subsistem server, latensi PostgreSQL, metrik performa, dan checklist produksi."
        >
          <AdminSystemHealthPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/security-logs') {
      return (
        <AdminLayout
          currentPath="/admin/security-logs"
          onNavigate={navigate}
          title="Log Keamanan & Audit"
          subtitle="Rekaman jejak aktivitas autentikasi, pembatasan rate limit, dan log keamanan sistem."
        >
          <AdminSecurityAuditPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/system-settings') {
      return (
        <AdminLayout
          currentPath="/admin/system-settings"
          onNavigate={navigate}
          title="Pengaturan Sistem & Feature Flags"
          subtitle="Kendali mode pemeliharaan (maintenance mode), bypass key pengembang, dan sakelar fitur dinamis."
        >
          <AdminSystemSettingsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/backup') {
      return (
        <AdminLayout
          currentPath="/admin/backup"
          onNavigate={navigate}
          title="Cadangan & Ekspor Data"
          subtitle="Unduh snapshot lengkap katalog produk, pesanan, inventaris, dan pelanggan dalam format CSV atau JSON."
        >
          <AdminBackupRestorePage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    // Tahap 9: Marketing, CMS, Abandoned Carts, & Alerts
    if (pathname === '/admin/marketing') {
      return (
        <AdminLayout
          currentPath="/admin/marketing"
          onNavigate={navigate}
          title="Pusat Pemasaran & Konversi"
          subtitle="Ringkasan performa banner promo, pemulihan keranjang belanja, dan manajemen konten edukasi."
        >
          <AdminMarketingHubPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/marketing/banners') {
      return (
        <AdminLayout
          currentPath="/admin/marketing/banners"
          onNavigate={navigate}
          title="Kelola Banner Promosi"
          subtitle="Banner hero beranda, carousel penawaran komoditas, dan statistik rasio klik (CTR)."
        >
          <AdminBannersPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/marketing/content') {
      return (
        <AdminLayout
          currentPath="/admin/marketing/content"
          onNavigate={navigate}
          title="Manajemen Konten & Artikel (CMS)"
          subtitle="Publikasi artikel panduan komoditas pangan, resep, dan optimasi SEO."
        >
          <AdminContentPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/marketing/abandoned-carts') {
      return (
        <AdminLayout
          currentPath="/admin/marketing/abandoned-carts"
          onNavigate={navigate}
          title="Keranjang Tertinggal (Abandoned Carts)"
          subtitle="Pemulihan keranjang belanja yang belum selesai checkout dan tautan pemulihan instan."
        >
          <AdminAbandonedCartsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/marketing/alerts') {
      return (
        <AdminLayout
          currentPath="/admin/marketing/alerts"
          onNavigate={navigate}
          title="Notifikasi Stok & Perubahan Harga"
          subtitle="Daftar pengingat ketersediaan komoditas dan alert harga target pelanggan."
        >
          <AdminAlertsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/marketing/funnel') {
      return (
        <AdminLayout
          currentPath="/admin/marketing/funnel"
          onNavigate={navigate}
          title="Corong Konversi (Conversion Funnel)"
          subtitle="Analisis drop-off rate dari kunjungan katalog, keranjang, hingga pesanan terbayar."
        >
          <AdminConversionFunnelPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    if (pathname === '/admin/marketing/analytics') {
      return (
        <AdminLayout
          currentPath="/admin/marketing/analytics"
          onNavigate={navigate}
          title="Analitik Kampanye & UTM"
          subtitle="Efektivitas sumber trafik pemasaran dan tracking performa penjualan."
        >
          <AdminMarketingAnalyticsPage onNavigate={navigate} />
        </AdminLayout>
      );
    }

    // -------------------------------------------------------------
    // STOREFRONT ROUTES
    // -------------------------------------------------------------
    // Category Page: /category/:slug
    if (categorySlug) {
      if (loadingCategories) {
        return (
          <StorefrontLayout
            currentPath={currentPath}
            categories={categories}
            onNavigate={navigate}
            onSearchSubmit={handleSearchSubmit}
          >
            <LoadingState message="Memuat kategori produk..." fullHeight />
          </StorefrontLayout>
        );
      }

      if (!currentCategory) {
        return (
          <StorefrontLayout
            currentPath={currentPath}
            categories={categories}
            onNavigate={navigate}
            onSearchSubmit={handleSearchSubmit}
          >
            <div className="py-20 text-center">
              <ErrorState
                title="Kategori Tidak Ditemukan"
                message="Kategori yang Anda tuju tidak ditemukan atau belum aktif."
                onRetry={() => navigate('/products')}
              />
            </div>
          </StorefrontLayout>
        );
      }

      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <CategoryProductsPage
            category={currentCategory}
            products={products}
            categories={categories}
            brands={brands}
            total={total}
            page={page}
            totalPages={totalPages}
            limit={limit}
            isLoading={loadingProducts}
            filters={{ ...filters, category_slug: categorySlug }}
            onFilterChange={updateFilters}
            onResetFilters={resetFilters}
            onSelectProduct={handleSelectProduct}
            onNavigate={navigate}
          />
        </StorefrontLayout>
      );
    }

    // Product Detail Page: /products/:slug
    if (isProductDetailPage) {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          {loadingDetail ? (
            <LoadingState message="Memuat detail produk..." fullHeight />
          ) : errorDetail || !currentDetailProduct ? (
            <div className="py-20 text-center">
              <ErrorState
                title="Produk Tidak Ditemukan"
                message={errorDetail || 'Produk yang Anda cari tidak tersedia.'}
                onRetry={() => navigate('/products')}
              />
            </div>
          ) : (
            <ProductDetailPage
              product={currentDetailProduct}
              onNavigate={navigate}
            />
          )}
        </StorefrontLayout>
      );
    }

    // Shopping Cart Page: /cart (noindex SEO handled)
    if (pathname === '/cart') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <CartPage onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Checkout Page: /checkout
    if (pathname === '/checkout') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <CheckoutPage onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Payment Gateway Redirect Result Page: /payment/result
    if (pathname === '/payment/result') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <PaymentResultPage onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Order Success Page: /order-success/:orderNumber
    if (successOrderNumber) {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <OrderSuccessPage
            orderNumber={successOrderNumber}
            onNavigate={navigate}
          />
        </StorefrontLayout>
      );
    }

    // Customer Single Order Detail Page: /orders/:orderNumber
    if (detailOrderNumber) {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <OrderDetailPage
            orderNumber={detailOrderNumber}
            onNavigate={navigate}
          />
        </StorefrontLayout>
      );
    }

    // -------------------------------------------------------------
    // ACCOUNT PORTAL ROUTES
    // -------------------------------------------------------------
    if (accountDetailOrderNumber) {
      return (
        <AccountLayout currentPath="/account/orders" onNavigate={navigate}>
          <AccountOrderDetailPage orderNumber={accountDetailOrderNumber} onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account') {
      return (
        <AccountLayout currentPath="/account" onNavigate={navigate}>
          <AccountDashboardPage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account/profile') {
      return (
        <AccountLayout currentPath="/account/profile" onNavigate={navigate}>
          <AccountProfilePage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account/orders') {
      return (
        <AccountLayout currentPath="/account/orders" onNavigate={navigate}>
          <AccountOrdersPage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account/addresses') {
      return (
        <AccountLayout currentPath="/account/addresses" onNavigate={navigate}>
          <AccountAddressesPage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account/wishlist') {
      return (
        <AccountLayout currentPath="/account/wishlist" onNavigate={navigate}>
          <AccountWishlistPage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account/reviews') {
      return (
        <AccountLayout currentPath="/account/reviews" onNavigate={navigate}>
          <AccountReviewsPage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    if (pathname === '/account/loyalty') {
      return (
        <AccountLayout currentPath="/account/loyalty" onNavigate={navigate}>
          <AccountLoyaltyPage onNavigate={navigate} />
        </AccountLayout>
      );
    }

    // Customer Orders List Page: /orders or /my-orders
    if (pathname === '/orders' || pathname === '/my-orders') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <MyOrdersPage onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Cart Recovery Route: /cart/recover/:token
    if (recoveryToken) {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <CartRecoveryPage token={recoveryToken} onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Promo Landing Page Route: /promo/:slug
    if (promoSlug) {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <PromoLandingPage slug={promoSlug} onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Blog Post Detail: /blog/:slug
    if (blogSlug) {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <BlogPostPage slug={blogSlug} onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Blog Hub / Articles List: /blog
    if (pathname === '/blog') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <BlogPage onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // Customer Notification Center: /notifications
    if (pathname === '/notifications') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <NotificationCenterPage onNavigate={navigate} />
        </StorefrontLayout>
      );
    }

    // All Products Catalog: /products
    if (pathname === '/products') {
      return (
        <StorefrontLayout
          currentPath={currentPath}
          categories={categories}
          brands={brands}
          onNavigate={navigate}
          onSearchSubmit={handleSearchSubmit}
        >
          <ProductsPage
            products={products}
            categories={categories}
            brands={brands}
            total={total}
            page={page}
            totalPages={totalPages}
            limit={limit}
            isLoading={loadingProducts}
            filters={filters}
            onFilterChange={updateFilters}
            onResetFilters={resetFilters}
            onSelectProduct={handleSelectProduct}
          />
        </StorefrontLayout>
      );
    }

    // Default: Homepage: /
    return (
      <StorefrontLayout
        currentPath={currentPath}
        categories={categories}
        brands={brands}
        onNavigate={navigate}
        onSearchSubmit={handleSearchSubmit}
      >
        <HomePage
          categories={categories}
          featuredProducts={featuredProducts}
          bestSellerProducts={bestSellerProducts}
          isLoadingFeatured={loadingFeatured}
          isLoadingBestSellers={loadingBestSellers}
          onNavigate={navigate}
          onSelectProduct={handleSelectProduct}
        />
      </StorefrontLayout>
    );
  };

  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <CartProvider>
          {renderContent()}
          <NetworkStatusBanner />
        </CartProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}
