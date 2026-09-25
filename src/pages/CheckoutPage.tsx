import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { CustomerInfoSection } from '../components/checkout/CustomerInfoSection';
import { ShippingAddressSection } from '../components/checkout/ShippingAddressSection';
import { ShippingMethodSection } from '../components/checkout/ShippingMethodSection';
import { OrderSummarySection } from '../components/checkout/OrderSummarySection';
import { AuthModal } from '../components/auth/AuthModal';
import { getShippingMethods } from '../services/shippingService';
import { getCustomerAddresses } from '../services/addressService';
import { createOrder } from '../services/orderService';
import { ShippingMethod, CustomerAddress, CheckoutFormData } from '../types';
import { useToast } from '../components/common/Toast';
import { EmptyCart } from '../components/cart/EmptyCart';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, items, totalCount, subtotal, user, refreshCart } = useCart();
  const { error } = useToast();

  // Shipping methods state
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [loadingShipping, setLoadingShipping] = useState<boolean>(true);

  // Saved addresses state for logged-in user
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');

  const [addressLine, setAddressLine] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [subdistrict, setSubdistrict] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState<string>('');

  const [saveAddress, setSaveAddress] = useState<boolean>(false);
  const [addressLabel, setAddressLabel] = useState<string>('Rumah');

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // SEO noindex requirement (Section 44)
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    const previousContent = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      if (meta) {
        if (created) meta.remove();
        else meta.content = previousContent;
      }
    };
  }, []);

  // Fetch Shipping Methods
  useEffect(() => {
    async function loadShipping() {
      setLoadingShipping(true);
      try {
        const methods = await getShippingMethods(false);
        setShippingMethods(methods);
        if (methods.length > 0) {
          setSelectedMethodId(methods[0].id);
        }
      } catch (err) {
        console.error('Failed loading shipping methods', err);
      } finally {
        setLoadingShipping(false);
      }
    }
    loadShipping();
  }, []);

  // Fetch Saved Addresses if user is logged-in
  useEffect(() => {
    async function loadAddresses() {
      if (user?.id) {
        try {
          const list = await getCustomerAddresses(user.id);
          setSavedAddresses(list);
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          if (defaultAddr) {
            handleSelectSavedAddress(defaultAddr);
          }
        } catch (e) {
          console.warn('Failed loading customer addresses', e);
        }
      } else {
        setSavedAddresses([]);
      }
    }
    loadAddresses();
  }, [user?.id]);

  // When user updates, sync name/email if empty
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setFullName(addr.recipient_name);
    setPhone(addr.phone);
    setAddressLine(addr.address_line);
    setProvince(addr.province);
    setCity(addr.city);
    setDistrict(addr.district);
    setSubdistrict(addr.subdistrict);
    setPostalCode(addr.postal_code);
    if (addr.delivery_note) {
      setDeliveryNote(addr.delivery_note);
    }
  };

  // Check product warnings in cart (Section 32)
  const hasInactiveItems = items.some((i) => i.isUnavailable);
  const hasStockWarnings = items.some((i) => i.hasStockChanged);
  const hasPriceChanges = items.some((i) => i.hasPriceChanged);
  const hasProductIssues = hasInactiveItems || hasStockWarnings || hasPriceChanges;

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName || fullName.trim().length < 2) {
      errors.fullName = 'Nama lengkap penerima minimal 2 karakter.';
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (!phone || cleanedPhone.length < 10) {
      errors.phone = 'Nomor WhatsApp wajib diisi (minimal 10 digit).';
    }

    if (!addressLine || addressLine.trim().length < 5) {
      errors.addressLine = 'Alamat pengiriman wajib diisi dengan lengkap.';
    }

    if (!province.trim()) errors.province = 'Provinsi wajib diisi.';
    if (!city.trim()) errors.city = 'Kota/Kabupaten wajib diisi.';
    if (!district.trim()) errors.district = 'Kecamatan wajib diisi.';
    if (!postalCode.trim() || postalCode.trim().length < 4) {
      errors.postalCode = 'Kode pos wajib diisi minimal 4 digit.';
    }

    if (!selectedMethodId) {
      errors.shippingMethod = 'Pilih salah satu metode pengiriman.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Order Submission
  const handleConfirmOrder = async () => {
    if (isSubmitting) return; // Prevent double click (TEST 3)

    if (hasProductIssues) {
      error('Terdapat perubahan stok atau harga produk pada keranjang. Silakan periksa kembali sebelum melanjutkan.');
      onNavigate('/cart');
      return;
    }

    if (!validate()) {
      error('Mohon lengkapi seluruh informasi yang ditandai merah.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CheckoutFormData = {
        customer_name: fullName.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
        address_line: addressLine.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        subdistrict: subdistrict.trim(),
        postal_code: postalCode.trim(),
        delivery_note: deliveryNote.trim(),
        shipping_method_id: selectedMethodId,
        save_address: saveAddress,
        address_label: addressLabel.trim(),
      };

      const result = await createOrder(payload, user?.id);
      if (result.success && result.order) {
        await refreshCart();
        onNavigate(`/order-success/${result.order.order_number}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pesanan belum berhasil dibuat. Silakan coba lagi.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If cart is empty, show empty state (Section 31)
  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-lg mx-auto shadow-sm">
          <EmptyCart onStartShopping={() => onNavigate('/products')} />
        </div>
      </div>
    );
  }

  const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedMethodId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/cart')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Keranjang</span>
          </button>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Checkout Pesanan
          </h1>
        </div>

        {/* Progress Step Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-800">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center text-[11px] font-bold">1</span>
            <span className="hidden sm:inline">Kontak</span>
          </span>
          <span className="text-stone-300">→</span>
          <span className="flex items-center gap-1 text-emerald-950">
            <span className="w-5 h-5 rounded-full bg-emerald-900 text-white flex items-center justify-center text-[11px] font-bold">2</span>
            <span>Alamat & Ekspedisi</span>
          </span>
          <span className="text-stone-300">→</span>
          <span className="flex items-center gap-1 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center text-[11px] font-bold">3</span>
            <span>Pembayaran</span>
          </span>
        </div>
      </div>

      {/* Cart Issue Warnings Banner if any */}
      {hasProductIssues && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block">
                Perubahan Stok atau Harga Terdeteksi di Keranjang
              </span>
              Silakan sesuaikan item pada keranjang terlebih dahulu sebelum melakukan checkout.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/cart')}
            className="px-3 py-1.5 bg-amber-900 text-white text-xs font-semibold rounded-lg shrink-0 hover:bg-amber-800"
          >
            Periksa Keranjang
          </button>
        </div>
      )}

      {/* 2-Column Desktop Layout (Section 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <CustomerInfoSection
            fullName={fullName}
            phone={phone}
            email={email}
            onChangeFullName={setFullName}
            onChangePhone={setPhone}
            onChangeEmail={setEmail}
            isLoggedIn={Boolean(user)}
            userEmail={user?.email}
            onOpenLogin={() => setAuthModalOpen(true)}
            errors={formErrors}
          />

          <ShippingAddressSection
            addressLine={addressLine}
            province={province}
            city={city}
            district={district}
            subdistrict={subdistrict}
            postalCode={postalCode}
            deliveryNote={deliveryNote}
            onChangeAddressLine={setAddressLine}
            onChangeProvince={setProvince}
            onChangeCity={setCity}
            onChangeDistrict={setDistrict}
            onChangeSubdistrict={setSubdistrict}
            onChangePostalCode={setPostalCode}
            onChangeDeliveryNote={setDeliveryNote}
            saveAddress={saveAddress}
            onChangeSaveAddress={setSaveAddress}
            addressLabel={addressLabel}
            onChangeAddressLabel={setAddressLabel}
            savedAddresses={savedAddresses}
            onSelectSavedAddress={handleSelectSavedAddress}
            isLoggedIn={Boolean(user)}
            errors={formErrors}
          />

          <ShippingMethodSection
            methods={shippingMethods}
            selectedMethodId={selectedMethodId}
            onSelectMethod={setSelectedMethodId}
            isLoading={loadingShipping}
            error={formErrors.shippingMethod}
          />
        </div>

        {/* Right Side: Order Summary & Confirm (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <OrderSummarySection
            items={items}
            totalCount={totalCount}
            subtotal={subtotal}
            selectedShippingMethod={selectedShippingMethod}
            onConfirmOrder={handleConfirmOrder}
            onBackToCart={() => onNavigate('/cart')}
            isSubmitting={isSubmitting}
            hasErrors={hasProductIssues}
          />
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
