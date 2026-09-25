import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Content,
  ContentType,
  ContentStatus,
  ContentWithProducts,
  ProductWithDetails,
  ProductSlugHistory,
} from '../types';
import { getProductById } from './productService';
import { logAdminAction } from './auditLogService';

const LOCAL_CONTENTS_KEY = 'fmcg_contents';
const LOCAL_CONTENT_PRODUCTS_KEY = 'fmcg_content_products';
const LOCAL_SLUG_HISTORY_KEY = 'fmcg_product_slug_history';

// Initial educational & guide contents for FMCG commodity store
export const INITIAL_CONTENTS: Content[] = [
  {
    id: 'cnt-1',
    title: 'Panduan Memilih Kurma Ajwa Madinah Berkualitas Asli & Grade A',
    slug: 'panduan-memilih-kurma-ajwa-madinah-grade-a',
    excerpt: 'Ketahui ciri keaslian kurma Ajwa asli Madinah, tekstur serat halus, kadar kelembapan ideal, dan khasiat kesehatan alami.',
    content: `
## Mengenal Keistimewaan Kurma Ajwa Al-Madinah

Kurma Ajwa adalah salah satu jenis kurma paling masyhur dan dicari di dunia, berasal langsung dari tanah Madinah Al-Munawwarah. Memiliki karakteristik fisik berwarna hitam pekat, ukuran sedang, dan guratan-guratan putih halus di permukaannya.

### 1. Ciri Fisik Kurma Ajwa Asli
* **Warna**: Hitam kebiruan atau cokelat sangat gelap, tidak mengkilap berlebihan seperti kurma yang diberi pemanis buatan.
* **Tekstur**: Bagian luar terasa kering dan padat, namun saat digigit daging buahnya sangat lembut, legit, dan tidak berbutir gula kasar.
* **Rasa**: Manis alami sedang (*moderate sweetness*) dengan sentuhan aroma karamel alami yang tidak menyengat di tenggorokan.

### 2. Tips Penyimpanan Optimal
Untuk menjaga kelembutan dan mencegah kutu kurma, simpan kurma Ajwa pada wadah kedap udara (*airtight container*) di suhu ruangan yang sejuk (20-25°C) atau di lemari pendingin (chiller) untuk ketahanan hingga 12 bulan.

### 3. Khasiat Nutrisi Alami
Kaya akan serat larut, kalium, magnesium, dan polifenol tinggi yang berkhasiat menjaga kesehatan jantung, menstabilkan tekanan darah, serta memberikan suplai energi instan tanpa lonjakan glukosa darah berlebih.
    `.trim(),
    featured_image: 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=1200&q=80',
    content_type: 'buying_guide',
    status: 'published',
    author_id: 'adm-01',
    author_name: 'Tim QC Komoditas',
    published_at: '2026-02-01T09:00:00Z',
    seo_title: 'Panduan Memilih Kurma Ajwa Asli Madinah Grade A | Pedoman Belanja',
    seo_description: 'Pelajari cara membedakan kurma Ajwa Madinah asli grade A, ciri fisik tekstur, rasa, dan tips penyimpanan komoditas berkualitas.',
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 'cnt-2',
    title: 'Manfaat Wijen Hitam & Putih untuk Industri Roti & Bumbu Masakan',
    slug: 'manfaat-wijen-hitam-putih-industri-roti',
    excerpt: 'Perbandingan karakteristik biji wijen hitam dan wijen putih murni untuk kebutuhan bakery, bumbu marinasi, dan minyak wijen premium.',
    content: `
## Perbedaan Biji Wijen Hitam dan Wijen Putih

Biji wijen (*Sesamum indicum*) merupakan komoditas pangan bernilai tinggi yang banyak dimanfaatkan oleh pengusaha bakery, restoran, serta industri makanan olahan.

### Wijen Putih (White Sesame)
* Memiliki rasa yang lebih lembut (*nutty & mild*)
* Sangat populer sebagai topping roti burger, onde-onde, dan kue kering tradisional
* Rendemen minyak tinggi dengan aroma wangi setelah disangrai

### Wijen Hitam (Black Sesame)
* Memiliki kulit luar lebih tebal dengan rasa yang lebih pekat (*earthy flavor*)
* Kaya akan pigmen antosianin dan kalsium alami
* Digunakan pada hidangan premium, pasta wijen hitam, serta masakan oriental modern
    `.trim(),
    featured_image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=1200&q=80',
    content_type: 'product_guide',
    status: 'published',
    author_id: 'adm-01',
    author_name: 'Spesialis Pangan Nusantara',
    published_at: '2026-02-10T10:00:00Z',
    seo_title: 'Manfaat Wijen Hitam & Putih untuk Bakery | Panduan Bahan Pangan',
    seo_description: 'Kenali perbedaan karakter rasa, aroma, dan aplikasi wijen hitam vs wijen putih untuk industri roti dan kuliner.',
    created_at: '2026-02-10T09:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'cnt-3',
    title: 'Mengenal Bawang Putih Kating: Kenapa Lebih Harum Dibanding Honan?',
    slug: 'mengenal-bawang-putih-kating-keunggulan-aroma',
    excerpt: 'Alasan mengapa pelaku usaha kuliner dan catering selalu memilih bawang putih kating super untuk masakan dengan aroma gurih mantap.',
    content: `
## Mengapa Bawang Putih Kating Jadi Primadona Dapur Nusantara?

Bawang putih kating (*Allium sativum*) memiliki bentuk siung yang lebih kecil, membulat, dan kulit luar yang putih keunguan tipis. 

### Keunggulan Utama:
1. **Kandungan Minyak Atsiri Lebih Tinggi**: Menghasilkan aroma khas yang jauh lebih tajam dan harum saat ditumis.
2. **Kadar Air Rendah**: Tidak mudah busuk dan menghasilkan bawang goreng yang lebih renyah.
3. **Efisiensi Penggunaan**: Cukup gunakan 2-3 siung kating untuk rasa yang setara dengan 5 siung bawang biasa.
    `.trim(),
    featured_image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=1200&q=80',
    content_type: 'article',
    status: 'published',
    author_id: 'adm-01',
    author_name: 'Dapur Komoditas',
    published_at: '2026-02-15T11:00:00Z',
    seo_title: 'Keunggulan Bawang Putih Kating vs Honan | Ulasan Komoditas',
    seo_description: 'Ulasan lengkap keunggulan aroma dan efisiensi bawang putih kating untuk kebutuhan restoran dan kuliner nusantara.',
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-15T11:00:00Z',
  },
];

// Initial content to product associations
const INITIAL_CONTENT_PRODUCTS = [
  { id: 'cp-1', content_id: 'cnt-1', product_id: 'p1111111-1111-1111-1111-111111111111' }, // Kurma Ajwa 500g
  { id: 'cp-2', content_id: 'cnt-2', product_id: 'p2222222-2222-2222-2222-222222222222' }, // Wijen Putih
  { id: 'cp-3', content_id: 'cnt-3', product_id: 'p4444444-4444-4444-4444-444444444444' }, // Bawang Putih Kating
];

function getLocalContents(): Content[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONTENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading contents from localStorage', e);
  }
  localStorage.setItem(LOCAL_CONTENTS_KEY, JSON.stringify(INITIAL_CONTENTS));
  return INITIAL_CONTENTS;
}

function saveLocalContents(list: Content[]) {
  try {
    localStorage.setItem(LOCAL_CONTENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed saving contents to localStorage', e);
  }
}

function getLocalContentProducts(): Array<{ id: string; content_id: string; product_id: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_CONTENT_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LOCAL_CONTENT_PRODUCTS_KEY, JSON.stringify(INITIAL_CONTENT_PRODUCTS));
  return INITIAL_CONTENT_PRODUCTS;
}

function saveLocalContentProducts(list: Array<{ id: string; content_id: string; product_id: string }>) {
  try {
    localStorage.setItem(LOCAL_CONTENT_PRODUCTS_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalSlugHistory(): ProductSlugHistory[] {
  try {
    const raw = localStorage.getItem(LOCAL_SLUG_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalSlugHistory(list: ProductSlugHistory[]) {
  try {
    localStorage.setItem(LOCAL_SLUG_HISTORY_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Fetch all contents with optional filtering
 */
export async function getContents(filter?: {
  type?: ContentType;
  status?: ContentStatus;
  search?: string;
  limit?: number;
}): Promise<Content[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('contents').select('*').order('created_at', { ascending: false });

      if (filter?.type) {
        query = query.eq('content_type', filter.type);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let results = data as Content[];
        if (filter?.search?.trim()) {
          const q = filter.search.toLowerCase();
          results = results.filter((c) => c.title.toLowerCase().includes(q) || c.excerpt.toLowerCase().includes(q));
        }
        return results;
      }
    } catch (e) {
      console.warn('Supabase getContents failed, falling back:', e);
    }
  }

  let list = getLocalContents();

  if (filter?.type) {
    list = list.filter((c) => c.content_type === filter.type);
  }
  if (filter?.status) {
    list = list.filter((c) => c.status === filter.status);
  }
  if (filter?.search?.trim()) {
    const q = filter.search.toLowerCase();
    list = list.filter((c) => c.title.toLowerCase().includes(q) || c.excerpt.toLowerCase().includes(q));
  }
  if (filter?.limit) {
    list = list.slice(0, filter.limit);
  }

  return list;
}

/**
 * Fetch single content by slug with its related products
 */
export async function getContentBySlug(slug: string): Promise<ContentWithProducts | null> {
  let content: Content | null = null;
  let relatedProductIds: string[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        content = data as Content;

        // Fetch related products
        const { data: relData } = await supabase
          .from('content_products')
          .select('product_id')
          .eq('content_id', content.id);

        if (relData) {
          relatedProductIds = relData.map((r) => r.product_id);
        }
      }
    } catch (e) {
      console.warn('Supabase getContentBySlug failed, falling back:', e);
    }
  }

  if (!content) {
    const list = getLocalContents();
    content = list.find((c) => c.slug === slug) || null;
    if (content) {
      const cps = getLocalContentProducts();
      relatedProductIds = cps.filter((cp) => cp.content_id === content!.id).map((cp) => cp.product_id);
    }
  }

  if (!content) return null;

  // Hydrate related products
  const relatedProducts: ProductWithDetails[] = [];
  for (const pid of relatedProductIds) {
    try {
      const prod = await getProductById(pid);
      if (prod) relatedProducts.push(prod);
    } catch {}
  }

  return {
    ...content,
    related_products: relatedProducts,
  };
}

/**
 * Create new content with related products and audit logging
 */
export async function createContent(
  data: Omit<Content, 'id' | 'created_at' | 'updated_at'>,
  relatedProductIds: string[] = []
): Promise<Content> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const newContent: Content = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('contents').insert(newContent);
      if (!error) {
        if (relatedProductIds.length > 0) {
          const links = relatedProductIds.map((pid) => ({
            id: crypto.randomUUID(),
            content_id: id,
            product_id: pid,
          }));
          await supabase.from('content_products').insert(links);
        }
      }
    } catch (e) {
      console.warn('Supabase createContent failed, using local:', e);
    }
  }

  const list = getLocalContents();
  list.unshift(newContent);
  saveLocalContents(list);

  if (relatedProductIds.length > 0) {
    const cps = getLocalContentProducts();
    for (const pid of relatedProductIds) {
      cps.push({ id: crypto.randomUUID(), content_id: id, product_id: pid });
    }
    saveLocalContentProducts(cps);
  }

  await logAdminAction(
    'system_admin',
    'create_content',
    'contents',
    id,
    `Konten baru dibuat: "${newContent.title}" (${newContent.status})`
  );

  return newContent;
}

/**
 * Update content
 */
export async function updateContent(
  id: string,
  updates: Partial<Content>,
  relatedProductIds?: string[]
): Promise<Content> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('contents').update({ ...updates, updated_at: now }).eq('id', id);
      if (relatedProductIds !== undefined) {
        await supabase.from('content_products').delete().eq('content_id', id);
        if (relatedProductIds.length > 0) {
          const links = relatedProductIds.map((pid) => ({
            id: crypto.randomUUID(),
            content_id: id,
            product_id: pid,
          }));
          await supabase.from('content_products').insert(links);
        }
      }
    } catch (e) {
      console.warn('Supabase updateContent error:', e);
    }
  }

  const list = getLocalContents();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('Konten tidak ditemukan.');
  }

  const updated: Content = {
    ...list[index],
    ...updates,
    updated_at: now,
  };
  list[index] = updated;
  saveLocalContents(list);

  if (relatedProductIds !== undefined) {
    let cps = getLocalContentProducts().filter((cp) => cp.content_id !== id);
    for (const pid of relatedProductIds) {
      cps.push({ id: crypto.randomUUID(), content_id: id, product_id: pid });
    }
    saveLocalContentProducts(cps);
  }

  await logAdminAction(
    'system_admin',
    'update_content',
    'contents',
    id,
    `Konten diperbarui: "${updated.title}"`
  );

  return updated;
}

/**
 * Delete content
 */
export async function deleteContent(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('content_products').delete().eq('content_id', id);
      await supabase.from('contents').delete().eq('id', id);
    } catch {}
  }

  const list = getLocalContents().filter((c) => c.id !== id);
  saveLocalContents(list);

  const cps = getLocalContentProducts().filter((cp) => cp.content_id !== id);
  saveLocalContentProducts(cps);

  await logAdminAction('system_admin', 'delete_content', 'contents', id, `Konten dihapus (ID: ${id})`);
  return true;
}

/**
 * Record Product Slug Change and check for 301/client-side redirects (Section 16)
 */
export async function recordProductSlugChange(
  productId: string,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  if (oldSlug === newSlug) return;

  const record: ProductSlugHistory = {
    id: crypto.randomUUID(),
    product_id: productId,
    old_slug: oldSlug,
    new_slug: newSlug,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('product_slug_history').insert(record);
    } catch (e) {
      console.warn('Supabase product_slug_history insert failed:', e);
    }
  }

  const history = getLocalSlugHistory();
  history.unshift(record);
  saveLocalSlugHistory(history);
}

export async function checkProductSlugRedirect(oldSlug: string): Promise<string | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('product_slug_history')
        .select('new_slug')
        .eq('old_slug', oldSlug)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.new_slug) {
        return data.new_slug;
      }
    } catch {}
  }

  const history = getLocalSlugHistory();
  const match = history.find((h) => h.old_slug === oldSlug);
  return match ? match.new_slug : null;
}
