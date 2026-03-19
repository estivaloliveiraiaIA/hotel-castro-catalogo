/**
 * migrate-images.js
 *
 * Migra imagens dos 282 lugares do catálogo do Castro's Park Hotel
 * de URLs temporárias do Google (lh3.googleusercontent.com) para
 * o Supabase Storage permanente.
 *
 * Uso:
 *   GOOGLE_PLACES_API_KEY=xxx node scripts/migrate-images.js
 *
 * Flags:
 *   --dry-run    Mostra o que seria feito, sem escrever nada
 *   --limit=N    Processa apenas N lugares (teste)
 *   --force      Reprocessa lugares que já têm URLs do Supabase Storage
 *
 * Env vars necessárias:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY   = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias");
  process.exit(1);
}
if (!GOOGLE_KEY) {
  console.error("❌ GOOGLE_PLACES_API_KEY é obrigatória");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE   = args.includes("--force");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT   = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

const BUCKET = "hotel-images";
const RATE_LIMIT_MS = 150; // delay entre places (respeita quota Google)
const MAX_PHOTOS = 5;
const GOOGLE_PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo";

// ─── Supabase Client ─────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isTemporaryUrl(url) {
  if (!url) return true;
  return (
    url.includes("lh3.googleusercontent.com") ||
    url.includes("maps.googleapis.com") ||
    url.includes("googleusercontent.com")
  );
}

function isSupabaseUrl(url) {
  if (!url) return false;
  return url.includes(SUPABASE_URL) || url.includes("supabase.co/storage");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Google Places API ───────────────────────────────────────────────────────

async function findPlaceId(name) {
  try {
    const query = encodeURIComponent(`${name} Goiânia GO Brasil`);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${GOOGLE_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.place_id || null;
  } catch {
    return null;
  }
}

async function fetchPhotoRefs(placeId) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const photos = data.result?.photos || [];
    return photos.slice(0, MAX_PHOTOS).map((p) => p.photo_reference);
  } catch {
    return [];
  }
}

// ─── Storage ─────────────────────────────────────────────────────────────────

async function downloadAndStore(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
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
      console.error("    [storage] upload error:", error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(name);

    return publicUrl;
  } catch (e) {
    console.error("    [storage] erro:", e.message);
    return null;
  }
}

async function storePhotos(photoRefs) {
  if (!photoRefs.length) return [];
  const urls = await Promise.all(
    photoRefs.map((ref) => {
      const url = `${GOOGLE_PHOTO_URL}?maxwidth=1200&photo_reference=${ref}&key=${GOOGLE_KEY}`;
      return downloadAndStore(url);
    })
  );
  return urls.filter(Boolean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  console.log("🚀 migrate-images.js iniciado");
  if (DRY_RUN) console.log("   [DRY-RUN] nenhuma escrita será feita");
  if (FORCE)   console.log("   [FORCE] reprocessa mesmo com URLs Supabase");
  console.log("");

  // 1. Busca todos os lugares
  const { data: places, error: fetchError } = await supabase
    .from("places")
    .select("id, name, image, gallery, source_id")
    .order("hotel_score", { ascending: false, nullsFirst: false });

  if (fetchError) {
    console.error("❌ Erro ao buscar places:", fetchError.message);
    process.exit(1);
  }

  console.log(`📋 Total de lugares no catálogo: ${places.length}`);

  // 2. Filtra os que precisam de migração
  const toMigrate = places.filter((p) => {
    if (FORCE) return true;
    if (!p.image) return true;
    return isTemporaryUrl(p.image) && !isSupabaseUrl(p.image);
  });

  const limited = toMigrate.slice(0, LIMIT);
  console.log(`🔧 Lugares para migrar: ${toMigrate.length} (processando: ${limited.length})`);
  console.log("");

  // 3. Migra cada lugar
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < limited.length; i++) {
    const place = limited[i];
    const prefix = `[${i + 1}/${limited.length}]`;
    process.stdout.write(`${prefix} ${place.name} ... `);

    // Determina o place_id
    let placeId = place.source_id || null;
    let photoSource = "source_id";

    if (!placeId) {
      // Busca por nome
      placeId = await findPlaceId(place.name);
      photoSource = "name-search";
      if (!placeId) {
        console.log("⚠️  place_id não encontrado, pulando");
        skipped++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }
    }

    // Busca photo_references
    const photoRefs = await fetchPhotoRefs(placeId);
    if (!photoRefs.length) {
      console.log("⚠️  sem fotos no Google Places, pulando");
      skipped++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    if (DRY_RUN) {
      console.log(`✓ (dry-run) ${photoRefs.length} fotos | via: ${photoSource}`);
      success++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    // Baixa e armazena
    const storedUrls = await storePhotos(photoRefs);
    if (!storedUrls.length) {
      console.log("❌ falha ao armazenar imagens");
      failed++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    // Atualiza no Supabase
    const { error: updateError } = await supabase
      .from("places")
      .update({ image: storedUrls[0], gallery: storedUrls })
      .eq("id", place.id);

    if (updateError) {
      console.log("❌ erro ao atualizar DB:", updateError.message);
      failed++;
    } else {
      console.log(`✓ ${storedUrls.length} imgs | via: ${photoSource}`);
      success++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  // 4. Resumo
  console.log("");
  console.log("─────────────────────────────────────");
  console.log(`✅ Sucesso:  ${success}`);
  console.log(`⚠️  Pulados:  ${skipped}`);
  console.log(`❌ Falhas:   ${failed}`);
  console.log("─────────────────────────────────────");

  if (!DRY_RUN && success > 0) {
    console.log("");
    console.log("💡 Próximo passo: regenerar public/data/places.json se necessário");
    console.log("   (o app lê do Supabase via API em produção — deploy automático)");
  }
}

migrate().catch((e) => {
  console.error("❌ Erro fatal:", e.message);
  process.exit(1);
});
