/**
 * Store & Branding Configuration
 * All store information, contact details, and branding text are centralized here
 * and can be easily customized without touching core application code.
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  subTagline: string;
  description: string;
  companyName: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  contact: {
    whatsapp: string;
    whatsappFormatted: string;
    phone: string;
    email: string;
    workingHours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    linkedin: string;
    youtube: string;
  };
  currency: {
    code: string;
    symbol: string;
    locale: string;
  };
  catalog: {
    itemsPerPage: number;
    defaultUnit: string;
    units: string[];
  };
}

export const siteConfig: SiteConfig = {
  name: "ONLINE STORE",
  shortName: "Store",
  tagline: "Produk Berkualitas untuk Kebutuhan Bisnis Anda",
  subTagline: "Temukan berbagai produk pangan pilihan dengan kualitas terbaik.",
  description: "Distributor & penyedia komoditas pangan berkualitas tinggi seperti Kurma, Wijen, Bawang, Aneka Kacang, dan Rempah-rempah untuk kebutuhan horeca, industri, maupun retail.",
  companyName: "PT Bahan Pangan Nusantara",
  address: {
    street: "Jl. Industri Pangan Raya No. 88, Kawasan Pergudangan Sentra Niaga",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    postalCode: "14430",
    country: "Indonesia",
  },
  contact: {
    whatsapp: "6281234567890",
    whatsappFormatted: "+62 812-3456-7890",
    phone: "(021) 555-8901",
    email: "halo@onlinestore.id",
    workingHours: "Senin - Sabtu: 08:00 - 17:00 WIB",
  },
  social: {
    instagram: "https://instagram.com/onlinestore",
    facebook: "https://facebook.com/onlinestore",
    linkedin: "https://linkedin.com/company/onlinestore",
    youtube: "https://youtube.com/onlinestore",
  },
  currency: {
    code: "IDR",
    symbol: "Rp",
    locale: "id-ID",
  },
  catalog: {
    itemsPerPage: 12,
    defaultUnit: "kg",
    units: ["kg", "gram", "karung (25kg)", "karung (50kg)", "dus", "pack", "bal"],
  },
};
