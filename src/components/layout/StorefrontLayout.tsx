import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MiniCart } from '../cart/MiniCart';
import { MobileBottomNav } from '../navigation/MobileBottomNav';
import { Category, Brand } from '../../types';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  categories: Category[];
  brands?: Brand[];
  onNavigate: (path: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
  currentPath,
  categories,
  brands = [],
  onNavigate,
  onSearchSubmit,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 selection:bg-emerald-100 selection:text-emerald-950">
      <Header
        currentPath={currentPath}
        categories={categories}
        brands={brands}
        onNavigate={onNavigate}
        onSearchSubmit={onSearchSubmit}
      />

      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      <Footer
        categories={categories}
        onNavigate={onNavigate}
      />

      {/* Slide-over Mini Cart Drawer */}
      <MiniCart onNavigate={onNavigate} />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
    </div>
  );
};
