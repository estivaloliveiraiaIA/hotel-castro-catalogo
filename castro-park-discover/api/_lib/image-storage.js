import { supabase } from "./supabase.js";

const BUCKET = "hotel-images";
const GOOGLE_PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo";

/**
 * Busca as referências de fotos de um lugar via Google Places Details API.
 * @param {string} placeId - Google Place ID
 * @param {string} apiKey - Google Places API Key
 * @param {number} maxPhotos - Máximo de fotos (padrão: 5)
 * @returns {Promise<string[]>} Array de photo_reference
 */
export async function fetchPhotoReferences(placeId, apiKey, maxPhotos = 5) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const photos = data.result?.photos || [];
    return photos.slice(0, maxPhotos).map((p) => p.photo_reference);
  } catch {
    return [];
  }
}

/**
 * Baixa uma imagem de uma URL (suporta redirects do Google Places Photo API)
 * e faz upload para o Supabase Storage.
 * @param {string} url - URL da imagem ou Google Places photo URL
 * @returns {Promise<string|null>} URL pública permanente ou null se falhar
 */
export async function downloadAndStore(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) return null;

    const ext = contentType.includes("png") ? "png"
              : contentType.includes("webp") ? "webp"
              : "jpg";
    const name = `places/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, buffer, { contentType, upsert: false });

    if (error) {
      console.error("[image-storage] upload error:", error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(name);

    return publicUrl;
  } catch (e) {
    console.error("[image-storage] downloadAndStore error:", e.message);
    return null;
  }
}

/**
 * Dado um array de photo_references do Google Places, baixa e armazena todas.
 * @param {string[]} photoRefs - Array de photo_reference
 * @param {string} apiKey - Google Places API Key
 * @returns {Promise<string[]>} Array de URLs permanentes (pode ser vazio)
 */
export async function storeGooglePhotos(photoRefs, apiKey) {
  if (!photoRefs.length) return [];

  const urls = await Promise.all(
    photoRefs.map((ref) => {
      const photoUrl = `${GOOGLE_PHOTO_URL}?maxwidth=1200&photo_reference=${ref}&key=${apiKey}`;
      return downloadAndStore(photoUrl);
    })
  );

  return urls.filter(Boolean);
}
