import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MiniCart } from '../cart/MiniCart';
import { Category } from '../../types';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  categories: Category[];
  onNavigate: (path: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
  currentPath,
  categories,
  onNavigate,
  onSearchSubmit,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
      <Header
        currentPath={currentPath}
        categories={categories}
        onNavigate={onNavigate}
        onSearchSubmit={onSearchSubmit}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer
        categories={categories}
        onNavigate={onNavigate}
      />
      <MiniCart onNavigate={onNavigate} />
    </div>
  );
};

