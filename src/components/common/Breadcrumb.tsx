import React, { useEffect } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { generateBreadcrumbSchema } from '../../utils/seo';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onNavigate,
  className = '',
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sra-store.id';

  // Inject BreadcrumbList JSON-LD Schema (Section 8, 11)
  useEffect(() => {
    const schemaItems = [
      { name: 'Beranda', item: `${origin}/` },
      ...items.map((it) => ({
        name: it.label,
        item: it.path ? `${origin}${it.path}` : `${origin}${window.location.pathname}`,
      })),
    ];

    const breadcrumbSchema = generateBreadcrumbSchema(schemaItems);
    const existing = document.head.querySelector<HTMLScriptElement>('#breadcrumb-json-ld');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'breadcrumb-json-ld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    return () => {
      const el = document.head.querySelector<HTMLScriptElement>('#breadcrumb-json-ld');
      if (el) el.remove();
    };
  }, [items, origin]);

  return (
    <nav aria-label="Breadcrumb" className={`text-xs text-stone-500 ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/')}
            className="inline-flex items-center gap-1 hover:text-stone-900 transition-colors text-stone-500 font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li aria-hidden="true" className="text-stone-300">
                <ChevronRight className="w-3 h-3" />
              </li>
              <li>
                {isLast || !item.path ? (
                  <span className="font-semibold text-stone-900 truncate max-w-[200px] sm:max-w-xs block" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate && item.path && onNavigate(item.path)}
                    className="hover:text-stone-900 transition-colors font-medium text-stone-600 truncate max-w-[150px] block"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
