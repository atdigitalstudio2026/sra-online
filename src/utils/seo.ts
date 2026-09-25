import { ProductWithDetails, Category, Brand, Content } from '../types';
import { siteConfig } from '../config/site';

export interface MetaTagOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noindex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

/**
 * Updates DOM head elements dynamically for client-side SEO.
 * Handles meta tags, canonical links, OpenGraph, Twitter cards, and Schema.org JSON-LD.
 */
export function updateMetaTags(options: MetaTagOptions): () => void {
  const previousTitle = document.title;
  const createdElements: HTMLElement[] = [];
  const modifiedElements: Array<{ el: HTMLElement; attr: string; oldVal: string | null }> = [];

  // 1. Page Title
  const formattedTitle = options.title
    ? `${options.title} | ${siteConfig.name}`
    : `${siteConfig.name} - ${siteConfig.tagline}`;
  document.title = formattedTitle;

  // Helper to safely set or create a meta tag
  const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      el.content = content;
      document.head.appendChild(el);
      createdElements.push(el);
    } else {
      modifiedElements.push({ el, attr: 'content', oldVal: el.content });
      el.content = content;
    }
  };

  // Helper to safely set or create link tag (canonical)
  const setLinkTag = (rel: string, href: string) => {
    let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      el.href = href;
      document.head.appendChild(el);
      createdElements.push(el);
    } else {
      modifiedElements.push({ el, attr: 'href', oldVal: el.href });
      el.href = href;
    }
  };

  // 2. Meta Description & Keywords
  const description = options.description || siteConfig.description;
  setMetaTag('meta[name="description"]', 'name', 'description', description);

  if (options.keywords) {
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', options.keywords);
  }

  // 3. Robots (Index Control - Section 14)
  const robotsDirective = options.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  setMetaTag('meta[name="robots"]', 'name', 'robots', robotsDirective);

  // 4. Canonical URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sra-store.id';
  const canonical = options.canonicalUrl
    ? (options.canonicalUrl.startsWith('http') ? options.canonicalUrl : `${currentOrigin}${options.canonicalUrl}`)
    : (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : currentOrigin);
  setLinkTag('canonical', canonical);

  // 5. OpenGraph Tags
  const ogTitle = options.title || siteConfig.name;
  const ogImage = options.ogImage || 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=1200&q=80';
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', options.ogType || 'website');
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteConfig.name);

  // 6. Twitter / X Cards
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

  // 7. Structured Data (Schema.org JSON-LD - Section 8)
  const existingScript = document.head.querySelector<HTMLScriptElement>('#structured-data-json-ld');
  if (existingScript) {
    existingScript.remove();
  }

  if (options.structuredData) {
    const scriptEl = document.createElement('script');
    scriptEl.id = 'structured-data-json-ld';
    scriptEl.type = 'application/ld+json';
    scriptEl.textContent = JSON.stringify(options.structuredData);
    document.head.appendChild(scriptEl);
    createdElements.push(scriptEl);
  }

  // Cleanup function on unmount
  return () => {
    document.title = previousTitle;
    createdElements.forEach((el) => el.remove());
    modifiedElements.forEach(({ el, attr, oldVal }) => {
      if (oldVal !== null) {
        el.setAttribute(attr, oldVal);
      } else {
        el.removeAttribute(attr);
      }
    });
  };
}

/**
 * Generate Schema.org Product structured data (Section 8, 9, 10)
 * Note: Never includes cost_price!
 */
export function generateProductSchema(
  product: ProductWithDetails,
  canonicalUrl: string,
  reviewsCount?: number,
  averageRating?: number
) {
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.image_url)
    : product.primary_image ? [product.primary_image] : [];

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.short_description || product.description || product.name,
    sku: product.sku,
    category: product.category?.name || 'Komoditas Pangan',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      priceValidUntil: '2027-12-31',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand.name,
    };
  }

  if (reviewsCount && reviewsCount > 0 && averageRating && averageRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviewsCount,
    };
  }

  return schema;
}

/**
 * Generate Schema.org BreadcrumbList structured data (Section 8, 11)
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; item: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

/**
 * Generate Schema.org Organization & WebSite structured data (Section 8)
 */
export function generateOrganizationAndWebsiteSchema() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sra-store.id';
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.name,
      url: origin,
      logo: `${origin}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: siteConfig.contact.phone,
        contactType: 'customer service',
        areaServed: 'ID',
        availableLanguage: ['Indonesian', 'English'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/products?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/**
 * Generate Schema.org Article structured data (Section 19)
 */
export function generateArticleSchema(content: Content, canonicalUrl: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sra-store.id';
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.title,
    description: content.excerpt,
    image: content.featured_image ? [content.featured_image] : [],
    datePublished: content.published_at || content.created_at,
    dateModified: content.updated_at,
    author: {
      '@type': 'Person',
      name: content.author_name || siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };
}
