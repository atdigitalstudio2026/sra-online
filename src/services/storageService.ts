import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_NAME = 'product-images';

/**
 * Upload an image file to Supabase Storage bucket 'product-images'
 * Returns the public URL and path of the uploaded image.
 */
export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<{ url: string; path: string }> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Format file tidak didukung. Harap gunakan format JPG, JPEG, PNG, atau WEBP.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Ukuran file terlalu besar. Maksimum ukuran adalah 5 MB.');
  }

  // Generate safe unique filename
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = productId
    ? `products/${productId}/${timestamp}_${cleanFileName}`
    : `products/temp/${timestamp}_${cleanFileName}`;

  // If Supabase is configured, upload to storage bucket
  if (isSupabaseConfigured() && supabase) {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      throw new Error(`Gagal mengunggah gambar ke Supabase Storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
    };
  }

  // Local browser fallback when running in preview without active Supabase credentials
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Create local blob or data URL for seamless preview capability
      const localUrl = URL.createObjectURL(file);
      resolve({
        url: localUrl,
        path: filePath,
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteProductImage(pathOrUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    // Extract path if full public URL was provided
    let path = pathOrUrl;
    if (pathOrUrl.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
      path = pathOrUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) {
      console.warn('Error deleting from storage:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete image error:', err);
    return false;
  }
}
