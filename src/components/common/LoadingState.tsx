import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Memuat data...',
  size = 'md',
  fullHeight = false,
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-stone-500 ${
        fullHeight ? 'min-h-[50vh]' : 'py-12'
      }`}
    >
      <Loader2 className={`${iconSizes[size]} animate-spin text-amber-700`} />
      <p className="text-sm font-medium tracking-tight text-stone-600">{message}</p>
    </div>
  );
};
